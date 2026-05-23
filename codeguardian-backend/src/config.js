require('dotenv').config();

module.exports = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  PORT: process.env.PORT || 3001,
};
