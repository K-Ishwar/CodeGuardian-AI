const express = require('express');
const router = express.Router();

// Manual PR URL POST /analyze
router.post('/analyze', (req, res) => {
  res.status(200).json({ status: 'received' });
});

module.exports = router;
