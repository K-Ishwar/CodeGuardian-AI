// GitHub webhook handler — POST /webhook
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { WEBHOOK_SECRET } = require('../config');
const { runAnalysis } = require('../agent/orchestrator');

/**
 * Validates the X-Hub-Signature-256 header against the raw request body.
 * @param {Buffer} rawBody
 * @param {string} signature
 * @returns {boolean}
 */
function validateSignature(rawBody, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('[Webhook] ⚠ WEBHOOK_SECRET is not set — skipping signature validation.');
    return true;
  }

  if (!signature) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')}`;

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

// Use raw body parser so we can compute HMAC over the exact bytes GitHub sent
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    try {
      const signature = req.headers['x-hub-signature-256'];
      const rawBody = req.body; // Buffer when using express.raw()

      // Validate signature
      if (!validateSignature(rawBody, signature)) {
        console.error('[Webhook] ❌ Invalid signature. Rejecting request.');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Parse the JSON body
      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        console.error('[Webhook] ❌ Failed to parse JSON payload.');
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }

      const { action, pull_request } = payload;

      // Only process opened / synchronize events
      if (action !== 'opened' && action !== 'synchronize') {
        console.log(`[Webhook] ℹ Ignoring event action="${action}"`);
        return res.status(200).json({ received: true, processed: false });
      }

      if (!pull_request || !pull_request.html_url) {
        console.warn('[Webhook] ⚠ No pull_request.html_url found in payload.');
        return res.status(200).json({ received: true, processed: false });
      }

      const prUrl = pull_request.html_url;
      console.log(`[Webhook] ✔ Received PR event action="${action}" url=${prUrl}`);

      // Fire-and-forget — do NOT await so GitHub doesn't timeout
      runAnalysis(prUrl, 'webhook').catch((err) =>
        console.error(`[Webhook] ❌ runAnalysis error: ${err.message}`)
      );

      // Immediately acknowledge to GitHub
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error(`[Webhook] ❌ Unexpected error: ${err.message}`);
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }
);

module.exports = router;
