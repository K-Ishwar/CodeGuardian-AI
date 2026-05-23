// All GitHub API calls
const axios = require('axios');
const { GITHUB_TOKEN } = require('../config');

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

module.exports = {
  parsePRUrl,
  fetchPRMetadata,
  fetchPRDiff,
  postReviewComment,
};
