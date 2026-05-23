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

    // Await the full analysis — caller waits for the result
    const review = await runAnalysis(prUrl, 'manual');

    return res.status(200).json(review);
  } catch (err) {
    console.error(`[Manual] ❌ /analyze error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /reviews — list all reviews, newest first
// ─────────────────────────────────────────────
router.get('/reviews', (req, res) => {
  const reviews = getAllReviews()
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return res.status(200).json(reviews);
});

// ─────────────────────────────────────────────
// GET /reviews/:id — get a single review by id
// ─────────────────────────────────────────────
router.get('/reviews/:id', (req, res) => {
  const review = getReviewById(req.params.id);

  if (!review) {
    return res.status(404).json({ error: `Review not found: ${req.params.id}` });
  }

  return res.status(200).json(review);
});

module.exports = router;
