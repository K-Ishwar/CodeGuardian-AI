const express = require('express');
const cors = require('cors');
const config = require('./config');
const webhookRoutes = require('./routes/webhook');
const manualRoutes = require('./routes/manual');
const { router: authRoutes, authenticate } = require('./routes/auth');

const app = express();

// ─────────────────────────────────────────────
// Global middleware
// ─────────────────────────────────────────────

// Enable CORS for all origins (frontend runs on port 5173)
app.use(cors());

// Parse JSON bodies for all non-webhook routes.
// NOTE: /webhook uses express.raw() internally to preserve the raw buffer
// needed for HMAC signature validation — do NOT apply express.json() to it.
app.use((req, res, next) => {
  if (req.path === '/webhook') return next();
  express.json()(req, res, next);
});

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// GitHub webhook — handles its own body parsing (raw bytes for HMAC)
app.use('/webhook', webhookRoutes);

// Auth routes (public)
app.use('/auth', authRoutes);

// Manual analysis + review listing (protected)
app.use('/', authenticate, manualRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`CodeGuardian Backend server running on port ${config.PORT}`);
});
