const express = require('express');
const router = express.Router();

// GitHub webhook POST /webhook
router.post('/', (req, res) => {
  res.status(200).json({ status: 'received' });
});

module.exports = router;
