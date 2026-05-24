const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../storage/store');

// ─────────────────────────────────────────────
// GET /analytics/leaderboard — Get gamified stats
// ─────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const userRepos = req.user.repos; // Passed from authenticate middleware
    const leaderboard = await getLeaderboard(userRepos);
    return res.status(200).json(leaderboard);
  } catch (err) {
    console.error(`[Analytics] ❌ GET /leaderboard error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
