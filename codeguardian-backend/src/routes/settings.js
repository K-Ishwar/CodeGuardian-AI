const express = require('express');
const router = express.Router();
const { getRules, saveRules } = require('../storage/store');

// ─────────────────────────────────────────────
// GET /settings/rules — Get custom AI rules
// ─────────────────────────────────────────────
router.get('/rules', async (req, res) => {
  try {
    const rules = await getRules();
    return res.status(200).json({ rules });
  } catch (err) {
    console.error(`[Settings] ❌ GET /rules error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /settings/rules — Save custom AI rules
// ─────────────────────────────────────────────
router.post('/rules', async (req, res) => {
  try {
    const { rules } = req.body;
    if (typeof rules !== 'string') {
      return res.status(400).json({ error: 'Rules must be a string' });
    }
    
    await saveRules(rules);
    return res.status(200).json({ success: true, rules });
  } catch (err) {
    console.error(`[Settings] ❌ POST /rules error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
