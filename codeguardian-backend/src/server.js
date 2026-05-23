const express = require('express');
const cors = require('cors');
const config = require('./config');
const webhookRoutes = require('./routes/webhook');
const manualRoutes = require('./routes/manual');

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Routes
app.use('/webhook', webhookRoutes);
app.use('/manual', manualRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start the server
app.listen(config.PORT, () => {
  console.log(`CodeGuardian Backend server running on port ${config.PORT}`);
});
