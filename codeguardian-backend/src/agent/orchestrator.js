// Main agent brain — runs all analysis steps in order
const { v4: uuidv4 } = require('uuid');
const githubClient = require('./githubClient');
const { parseDiff } = require('./diffParser');
const { analyzeCodeWithGemini } = require('./geminiClient');
const { addReview, getReviewById, updateReview } = require('../storage/store');
const EventEmitter = require('events');

const progressEmitter = new EventEmitter();

const LOG_PREFIX = '[CodeGuardian]';

/**
 * Returns the severity emoji for a given severity level.
 * @param {string} severity
 * @returns {string}
 */
function severityEmoji(severity) {
  switch (severity) {
    case 'Critical': return '🔴';
    case 'Moderate': return '🟡';
    case 'Low':      return '🟢';
    default:         return '⚪';
  }
}

/**
 * Builds a markdown comment body summarising the review.
 * @param {object} review
 * @returns {string}
 */
function buildReviewComment(review) {
  const { metrics, latency_seconds, issues } = review;
  const lines = [
    '## 🤖 CodeGuardian AI Review',
    '',
    `Found **${metrics.total_issues} issue(s)** | Est. **$${metrics.financial_saved.toFixed(2)} saved** | Latency: **${latency_seconds}s**`,
    '',
  ];

  if (issues.length === 0) {
    lines.push('✅ No issues found. Great work!');
  } else {
    lines.push('### Issues');
    lines.push('');
    for (const issue of issues) {
      const emoji = severityEmoji(issue.severity);
      lines.push(`#### ${emoji} [${issue.severity}] ${issue.title}`);
      lines.push(`**File:** \`${issue.filename}\``);
      lines.push('');
      lines.push(issue.explanation);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * The CodeGuardian agent brain.
 * Orchestrates all steps: parse URL → create record → fetch metadata →
 * fetch diff → parse diff → Gemini analysis → compute metrics →
 * update record → post GitHub comment → return result.
 *
 * @param {string} prUrl  - Full GitHub PR URL
 * @param {string} source - "webhook" | "manual"
 * @param {string} reviewId - The UUID for the review
 * @returns {Promise<object>} The completed (or failed) review record
 */
async function runAnalysis(prUrl, source, reviewId) {
  console.log(`${LOG_PREFIX} ▶ Starting analysis | source=${source} | url=${prUrl}`);
  
  const emitProgress = (step, progress, status = 'Processing') => {
    progressEmitter.emit('progress', { id: reviewId, step, progress, status });
  };

  emitProgress('Parsing PR URL...', 5);

  // ─────────────────────────────────────────────
  // STEP 1 — Parse PR URL
  // ─────────────────────────────────────────────
  console.log(`${LOG_PREFIX} [Step 1] Parsing PR URL...`);
  const { owner, repo, pull_number } = githubClient.parsePRUrl(prUrl);
  console.log(`${LOG_PREFIX} [Step 1] ✔ owner=${owner} repo=${repo} pull_number=${pull_number}`);

  // ─────────────────────────────────────────────
  // STEP 2 — Create a pending review record immediately
  // ─────────────────────────────────────────────
  console.log(`${LOG_PREFIX} [Step 2] Creating pending review record...`);
  const review = {
    id: reviewId,
    pr_title: '',
    repository: `${owner}/${repo}`,
    author: '',
    pr_url: prUrl,
    status: 'Processing',
    timestamp: new Date().toISOString(),
    latency_seconds: 0,
    metrics: { total_issues: 0, hours_saved: 0, financial_saved: 0 },
    issues: [],
    source,
  };
  await addReview(review);
  console.log(`${LOG_PREFIX} [Step 2] ✔ Review created with id=${review.id}`);
  emitProgress('Fetching PR metadata...', 10);

  try {
    // ─────────────────────────────────────────────
    // STEP 3 — Fetch PR metadata
    // ─────────────────────────────────────────────
    console.log(`${LOG_PREFIX} [Step 3] Fetching PR metadata...`);
    const metadata = await githubClient.fetchPRMetadata(owner, repo, pull_number);
    await updateReview(review.id, {
      pr_title: metadata.title,
      author: metadata.author,
      pr_url: metadata.pr_url,
    });
    review.pr_title = metadata.title;
    review.author   = metadata.author;
    review.pr_url   = metadata.pr_url;
    console.log(`${LOG_PREFIX} [Step 3] ✔ PR: "${metadata.title}" by @${metadata.author}`);

    // ─────────────────────────────────────────────
    // STEP 4 — Fetch the diff
    // ─────────────────────────────────────────────
    emitProgress('Fetching PR diff...', 20);
    console.log(`${LOG_PREFIX} [Step 4] Fetching PR diff...`);
    const rawDiff = await githubClient.fetchPRDiff(owner, repo, pull_number);

    if (!rawDiff || rawDiff.trim() === '') {
      console.warn(`${LOG_PREFIX} [Step 4] ⚠ Diff is empty. Marking as Failed.`);
      await updateReview(review.id, { status: 'Failed' });
      review.status = 'Failed';
      return review;
    }
    console.log(`${LOG_PREFIX} [Step 4] ✔ Diff fetched (${rawDiff.length} chars)`);

    // ─────────────────────────────────────────────
    // STEP 5 — Parse the diff
    // ─────────────────────────────────────────────
    emitProgress('Parsing diff...', 30);
    console.log(`${LOG_PREFIX} [Step 5] Parsing diff...`);
    const fileDiffChunks = parseDiff(rawDiff);
    console.log(`${LOG_PREFIX} [Step 5] ✔ Found ${fileDiffChunks.length} file chunk(s)`);

    if (fileDiffChunks.length === 0) {
      console.log(`${LOG_PREFIX} [Step 5] No actionable file chunks. Marking as Analyzed with 0 issues.`);
      await updateReview(review.id, { status: 'Analyzed' });
      review.status = 'Analyzed';
      emitProgress('No issues found.', 100, 'Analyzed');
      return review;
    }

    // ─────────────────────────────────────────────
    // STEP 6 — Analyze with Gemini
    // ─────────────────────────────────────────────
    emitProgress('Sending diff to AI for analysis...', 40);
    console.log(`${LOG_PREFIX} [Step 6] Sending diff to Gemini for analysis...`);
    const startTime = Date.now();
    const issues = await analyzeCodeWithGemini(fileDiffChunks);
    const latency_seconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    console.log(`${LOG_PREFIX} [Step 6] ✔ Gemini returned ${issues.length} issue(s) in ${latency_seconds}s`);

    // ─────────────────────────────────────────────
    // STEP 7 — Compute metrics
    // ─────────────────────────────────────────────
    emitProgress('Computing metrics...', 80);
    console.log(`${LOG_PREFIX} [Step 7] Computing metrics...`);
    const total_issues    = issues.length;
    const hours_saved     = total_issues * 0.25;
    const financial_saved = hours_saved * 60;
    const metrics = { total_issues, hours_saved, financial_saved };
    console.log(`${LOG_PREFIX} [Step 7] ✔ total_issues=${total_issues} hours_saved=${hours_saved} financial_saved=$${financial_saved}`);

    // ─────────────────────────────────────────────
    // STEP 8 — Update the review record
    // ─────────────────────────────────────────────
    console.log(`${LOG_PREFIX} [Step 8] Updating review record...`);
    const finalUpdates = { status: 'Analyzed', issues, metrics, latency_seconds };
    await updateReview(review.id, finalUpdates);
    Object.assign(review, finalUpdates);
    console.log(`${LOG_PREFIX} [Step 8] ✔ Review marked as Analyzed`);

    // ─────────────────────────────────────────────
    // STEP 9 — Post comment back to GitHub
    // ─────────────────────────────────────────────
    emitProgress('Posting review comment to GitHub...', 90);
    console.log(`${LOG_PREFIX} [Step 9] Posting review comment to GitHub...`);
    try {
      const commentBody = buildReviewComment(review);
      await githubClient.postReviewComment(owner, repo, pull_number, commentBody);
      console.log(`${LOG_PREFIX} [Step 9] ✔ Review summary comment posted successfully`);
    } catch (commentErr) {
      console.warn(`${LOG_PREFIX} [Step 9] ⚠ Could not post GitHub summary comment: ${commentErr.message}`);
      // Non-fatal — do not rethrow
    }

    // ─────────────────────────────────────────────
    // STEP 9.1 — Post line-level comments to GitHub
    // ─────────────────────────────────────────────
    console.log(`${LOG_PREFIX} [Step 9.1] Posting line-level comments to GitHub...`);
    let lineCommentsPosted = 0;
    for (const issue of issues) {
      if (issue.line && issue.filename && metadata.head_sha) {
        try {
          const emoji = severityEmoji(issue.severity);
          const body = `### ${emoji} CodeGuardian: ${issue.title} [${issue.severity}]\n\n${issue.explanation}\n\n**Time to fix:** ~${issue.time_to_fix} mins\n\n**Suggestion:**\n\`\`\`javascript\n${issue.patch_suggestion}\n\`\`\``;
          
          await githubClient.postLineComment(owner, repo, pull_number, metadata.head_sha, issue.filename, issue.line, body);
          lineCommentsPosted++;
        } catch (lineErr) {
          console.warn(`${LOG_PREFIX} [Step 9.1] ⚠ Could not post line comment for ${issue.filename}:${issue.line}: ${lineErr.message}`);
        }
      }
    }
    console.log(`${LOG_PREFIX} [Step 9.1] ✔ Posted ${lineCommentsPosted} line-level comments`);

    // ─────────────────────────────────────────────
    // STEP 10 — Return the completed review
    // ─────────────────────────────────────────────
    console.log(`${LOG_PREFIX} ✅ Analysis complete for review id=${review.id}`);
    emitProgress('Analysis complete.', 100, 'Analyzed');
    return review;

  } catch (err) {
    // ─────────────────────────────────────────────
    // ERROR HANDLER — mark review as Failed
    // ─────────────────────────────────────────────
    console.error(`${LOG_PREFIX} ❌ Analysis failed: ${err.message}`);
    await updateReview(review.id, { status: 'Failed' });
    review.status = 'Failed';
    emitProgress(`Analysis failed: ${err.message}`, 100, 'Failed');
    return review;
  }
}

module.exports = { runAnalysis, progressEmitter };
