// Manual PR analysis handler — POST /analyze, GET /reviews, GET /reviews/:id
const express = require('express');
const router = express.Router();
const { runAnalysis } = require('../agent/orchestrator');
const { getAllReviews, getReviewById } = require('../storage/store');

/**
 * Validates that a string is a plausible GitHub PR URL.
 * @param {string} url
 * @returns {boolean}
 */
function isValidPRUrl(url) {
  return (
    typeof url === 'string' &&
    url.includes('github.com') &&
    url.includes('/pull/')
  );
}

const { v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────────
// POST /analyze — trigger a manual PR analysis
// ─────────────────────────────────────────────
router.post('/analyze', async (req, res) => {
  try {
    const { prUrl } = req.body;

    if (!isValidPRUrl(prUrl)) {
      return res.status(400).json({ error: 'Invalid GitHub PR URL' });
    }

    console.log(`[Manual] ▶ Starting manual analysis for: ${prUrl}`);

    const reviewId = uuidv4();
    
    // Start analysis asynchronously in the background
    runAnalysis(prUrl, 'manual', reviewId).catch(err => {
      console.error(`[Manual] Background analysis error: ${err.message}`);
    });

    // Return immediately with status 202 Accepted and the new ID
    return res.status(202).json({ id: reviewId, status: 'Processing' });
  } catch (err) {
    console.error(`[Manual] ❌ /analyze error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /analyze/progress/:id — SSE progress stream
// ─────────────────────────────────────────────
router.get('/analyze/progress/:id', (req, res) => {
  const { id } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  // Import the emitter dynamically or pass it from orchestrator
  const { progressEmitter } = require('../agent/orchestrator');

  const onProgress = (data) => {
    if (data.id === id) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (data.progress === 100) {
        // End the stream if progress is 100
        res.write('event: end\ndata: {}\n\n');
        res.end();
        progressEmitter.removeListener('progress', onProgress);
      }
    }
  };

  progressEmitter.on('progress', onProgress);

  // If client closes connection, stop listening
  req.on('close', () => {
    progressEmitter.removeListener('progress', onProgress);
  });
});


// ─────────────────────────────────────────────
// POST /analyze/chat/:id — RAG chat with the AI
// ─────────────────────────────────────────────
router.post('/analyze/chat/:id', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid messages array is required' });
    }

    const review = await getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: `Review not found: ${req.params.id}` });
    }

    const { chatWithAgent } = require('../agent/geminiClient');
    const responseText = await chatWithAgent(review, messages);

    return res.status(200).json({ reply: responseText });
  } catch (err) {
    console.error(`[Manual] ❌ /analyze/chat error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────
// POST /analyze/fix/:id — Apply a 1-click fix to PR
// ─────────────────────────────────────────────
router.post('/analyze/fix/:id', async (req, res) => {
  try {
    const { issue } = req.body;
    if (!issue || !issue.filename || !issue.patch_suggestion) {
      return res.status(400).json({ error: 'Valid issue object with filename and patch_suggestion is required' });
    }

    const review = await getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: `Review not found: ${req.params.id}` });
    }

    const { parsePRUrl, applyFixToPR } = require('../agent/githubClient');
    const { owner, repo, pull_number } = parsePRUrl(review.pr_url);

    // Default to line 1 if not provided, though it should be
    const line = issue.line || 1; 

    const commitData = await applyFixToPR(owner, repo, pull_number, issue.filename, issue.patch_suggestion, line);

    return res.status(200).json({ success: true, commitUrl: commitData.commit.html_url });
  } catch (err) {
    console.error(`[Manual] ❌ /analyze/fix error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────
// GET /analyze/diff/:id — Fetch PR diff chunk for a specific file
// ─────────────────────────────────────────────
router.get('/analyze/diff/:id', async (req, res) => {
  try {
    const { file } = req.query;
    if (!file) {
      return res.status(400).json({ error: 'file query parameter is required' });
    }

    const review = await getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: `Review not found: ${req.params.id}` });
    }

    const { parsePRUrl, fetchPRDiff } = require('../agent/githubClient');
    const { parseDiff } = require('../agent/diffParser');
    
    const { owner, repo, pull_number } = parsePRUrl(review.pr_url);
    const rawDiff = await fetchPRDiff(owner, repo, pull_number);
    
    if (!rawDiff) {
      return res.status(404).json({ error: 'Diff not found on GitHub' });
    }

    const fileDiffChunks = parseDiff(rawDiff);
    const chunk = fileDiffChunks.find(c => c.filename === file);

    if (!chunk) {
      return res.status(404).json({ error: `Diff chunk not found for file: ${file}` });
    }

    return res.status(200).json({ diff: chunk.patch });
  } catch (err) {
    console.error(`[Manual] ❌ /analyze/diff error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────
// GET /reviews — list all reviews with pagination/filtering
// ─────────────────────────────────────────────
router.get('/reviews', async (req, res) => {
  try {
    // For now, pass options from query. Later we will pass req.user.repos
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      repo: req.query.repo || '',
      severity: req.query.severity || '',
      userRepos: req.user.repos,
    };
    const reviews = await getAllReviews(options);
    return res.status(200).json(reviews);
  } catch (err) {
    console.error(`[Manual] ❌ /reviews error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /reviews/:id — get a single review by id
// ─────────────────────────────────────────────
router.get('/reviews/:id', async (req, res) => {
  try {
    const review = await getReviewById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: `Review not found: ${req.params.id}` });
    }

    return res.status(200).json(review);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
