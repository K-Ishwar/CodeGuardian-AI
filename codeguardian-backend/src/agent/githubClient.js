// All GitHub API calls
const axios = require('axios');
const { GITHUB_TOKEN, DRY_RUN } = require('../config');

const BASE_URL = 'https://api.github.com';

// Default headers for all GitHub API requests
const defaultHeaders = () => ({
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
});

/**
 * Parses a GitHub PR URL into its components.
 * @param {string} prUrl - e.g. https://github.com/owner/repo/pull/123
 * @returns {{ owner: string, repo: string, pull_number: number }}
 */
function parsePRUrl(prUrl) {
  try {
    // Expected format: https://github.com/{owner}/{repo}/pull/{pull_number}
    const parts = prUrl.trim().split('/');
    // parts: ['https:', '', 'github.com', 'owner', 'repo', 'pull', '123']
    const owner = parts[3];
    const repo = parts[4];
    const pull_number = parseInt(parts[6], 10);

    if (!owner || !repo || isNaN(pull_number)) {
      throw new Error(`Invalid PR URL format: ${prUrl}`);
    }

    return { owner, repo, pull_number };
  } catch (err) {
    console.error('GitHubClient error in parsePRUrl:', err.message);
    throw new Error(`GitHubClient error in parsePRUrl: ${err.message}`);
  }
}

/**
 * Fetches metadata for a given Pull Request.
 * @param {string} owner
 * @param {string} repo
 * @param {number} pull_number
 * @returns {{ title, author, base_branch, head_branch, pr_url }}
 */
async function fetchPRMetadata(owner, repo, pull_number) {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/pulls/${pull_number}`,
      { headers: defaultHeaders() }
    );

    return {
      title: data.title,
      author: data.user.login,
      base_branch: data.base.ref,
      head_branch: data.head.ref,
      head_sha: data.head.sha,
      pr_url: data.html_url,
    };
  } catch (err) {
    console.error('GitHubClient error in fetchPRMetadata:', err.message);
    throw new Error(`GitHubClient error in fetchPRMetadata: ${err.message}`);
  }
}

/**
 * Fetches the raw unified diff for a Pull Request.
 * @param {string} owner
 * @param {string} repo
 * @param {number} pull_number
 * @returns {string} raw diff text
 */
async function fetchPRDiff(owner, repo, pull_number) {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/pulls/${pull_number}`,
      {
        headers: {
          ...defaultHeaders(),
          Accept: 'application/vnd.github.v3.diff',
        },
        // Ensure axios doesn't try to parse as JSON
        responseType: 'text',
      }
    );

    return data;
  } catch (err) {
    console.error('GitHubClient error in fetchPRDiff:', err.message);
    throw new Error(`GitHubClient error in fetchPRDiff: ${err.message}`);
  }
}

/**
 * Posts a review comment on a Pull Request.
 * @param {string} owner
 * @param {string} repo
 * @param {number} pull_number
 * @param {string} reviewBody - Markdown body for the review comment
 * @returns {object|null} GitHub response data, or null if token not set
 */
async function postReviewComment(owner, repo, pull_number, reviewBody) {
  try {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would have posted review comment to ${owner}/${repo}#${pull_number}`);
      return { id: 'dry-run-comment-id' };
    }

    if (!GITHUB_TOKEN) {
      console.warn(
        'GitHubClient warning in postReviewComment: GITHUB_TOKEN is not set. Skipping comment post.'
      );
      return null;
    }

    const { data } = await axios.post(
      `${BASE_URL}/repos/${owner}/${repo}/pulls/${pull_number}/reviews`,
      { body: reviewBody, event: 'COMMENT' },
      { headers: defaultHeaders() }
    );

    return data;
  } catch (err) {
    console.error('GitHubClient error in postReviewComment:', err.message);
    throw new Error(`GitHubClient error in postReviewComment: ${err.message}`);
  }
}

/**
 * Posts a line-level comment on a Pull Request.
 * @param {string} owner
 * @param {string} repo
 * @param {number} pull_number
 * @param {string} commit_id
 * @param {string} path
 * @param {number} line
 * @param {string} body
 * @returns {object|null}
 */
async function postLineComment(owner, repo, pull_number, commit_id, path, line, body) {
  try {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would have posted line comment to ${owner}/${repo}#${pull_number} on ${path}:${line}`);
      return { id: 'dry-run-line-comment-id' };
    }

    if (!GITHUB_TOKEN) {
      console.warn('GitHubClient warning: GITHUB_TOKEN not set. Skipping line comment.');
      return null;
    }

    const { data } = await axios.post(
      `${BASE_URL}/repos/${owner}/${repo}/pulls/${pull_number}/comments`,
      {
        body,
        commit_id,
        path,
        line,
        side: 'RIGHT'
      },
      { headers: defaultHeaders() }
    );
    return data;
  } catch (err) {
    console.error(`GitHubClient error in postLineComment (file: ${path}, line: ${line}):`, err.response?.data?.message || err.message);
    throw new Error(`GitHubClient error in postLineComment: ${err.message}`);
  }
}

/**
 * Applies a code fix directly to a file on a Pull Request branch via GitHub API.
 * @param {string} owner
 * @param {string} repo
 * @param {number} pull_number
 * @param {string} filename
 * @param {string} patchSuggestion
 * @param {number} line
 * @returns {object} API response of the commit
 */
async function applyFixToPR(owner, repo, pull_number, filename, patchSuggestion, line) {
  try {
    if (DRY_RUN || !GITHUB_TOKEN) {
      console.warn('GitHubClient: DRY_RUN or no token. Skipping actual file commit.');
      return { commit: { html_url: '#' } };
    }

    // 1. Get PR metadata to find the head branch
    const prMeta = await fetchPRMetadata(owner, repo, pull_number);
    const branch = prMeta.head_branch;

    // 2. Fetch the current file contents from that branch
    const { data: fileData } = await axios.get(
      `${BASE_URL}/repos/${owner}/${repo}/contents/${filename}?ref=${branch}`,
      { headers: defaultHeaders() }
    );

    // fileData.content is base64 encoded
    const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf8');
    
    // 3. Apply the patch
    const lines = decodedContent.split('\n');
    // Basic heuristic: replace the exact line provided
    if (line > 0 && line <= lines.length) {
      lines[line - 1] = patchSuggestion;
    } else {
      throw new Error(`Line ${line} is out of bounds for file ${filename}`);
    }
    
    const newContent = lines.join('\n');
    const newContentBase64 = Buffer.from(newContent, 'utf8').toString('base64');

    // 4. Commit the new file back to the branch
    const commitMessage = `CodeGuardian AI Fix: ${filename}`;
    const { data: commitData } = await axios.put(
      `${BASE_URL}/repos/${owner}/${repo}/contents/${filename}`,
      {
        message: commitMessage,
        content: newContentBase64,
        sha: fileData.sha,
        branch: branch
      },
      { headers: defaultHeaders() }
    );

    return commitData;
  } catch (err) {
    console.error(`GitHubClient error in applyFixToPR for ${filename}:`, err.response?.data?.message || err.message);
    throw new Error(`GitHubClient error in applyFixToPR: ${err.message}`);
  }
}

module.exports = {
  parsePRUrl,
  fetchPRMetadata,
  fetchPRDiff,
  postReviewComment,
  postLineComment,
  applyFixToPR,
};
