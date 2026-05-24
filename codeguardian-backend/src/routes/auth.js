const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT_SECRET } = process.env;

// Simple in-memory cache to store the user's accessible repositories
// In production, this should go into SQLite or Redis.
const userRepoCache = new Map();

router.post('/github', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'OAuth code is required' });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('[Auth] Token Response from GitHub:', tokenResponse.data);
    
    if (!accessToken) {
      console.error('[Auth] Missing access_token in response');
      return res.status(400).json({ error: 'Failed to retrieve access token' });
    }

    // 2. Fetch user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'CodeGuardian-AI',
        'Accept': 'application/vnd.github.v3+json'
      },
    });
    
    const user = userResponse.data;

    // 3. Fetch user repositories (100 per page, up to 1 page for simplicity in this MVP)
    const reposResponse = await axios.get('https://api.github.com/user/repos?per_page=100', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'CodeGuardian-AI',
        'Accept': 'application/vnd.github.v3+json'
      },
    });

    const accessibleRepos = reposResponse.data.map((repo) => repo.full_name);

    // Cache the repos
    userRepoCache.set(user.login, accessibleRepos);

    // 4. Generate JWT
    const token = jwt.sign(
      { username: user.login, avatar_url: user.avatar_url },
      JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '24h' }
    );

    return res.status(200).json({ token, user: { username: user.login, avatar_url: user.avatar_url } });

  } catch (err) {
    console.error('[Auth] GitHub OAuth Error:', err.message);
    if (err.response) {
      console.error('[Auth] GitHub Error Data:', err.response.data);
      return res.status(err.response.status || 500).json({ error: `GitHub API Error: ${err.response.data?.message || err.message}` });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// ─────────────────────────────────────────────
// Guest Login (For Hackathon Judges)
// ─────────────────────────────────────────────
router.post('/guest', (req, res) => {
  const { password } = req.body;
  const expectedPassword = process.env.GUEST_PASSWORD || 'judges123';

  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid guest password' });
  }

  try {
    const token = jwt.sign(
      { username: 'HackathonJudge', avatar_url: 'https://github.com/ghost.png' },
      JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '24h' }
    );
    return res.status(200).json({ token, user: { username: 'HackathonJudge', avatar_url: 'https://github.com/ghost.png' } });
  } catch (err) {
    return res.status(500).json({ error: 'Guest login failed' });
  }
});

// Middleware to protect routes
function authenticate(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    // Fallback for EventSource (SSE) which cannot send custom headers
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET || 'fallback_secret_for_dev');
    req.user = decoded;
    
    // Attach accessible repos from cache
    req.user.repos = userRepoCache.get(decoded.username) || [];
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { router, authenticate };
