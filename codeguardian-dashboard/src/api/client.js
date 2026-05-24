import axios from 'axios';

// ---------------------------------------------------------------------------
// CodeGuardian AI — API Client
// Base URL points to the Express backend running on http://localhost:3001
// ---------------------------------------------------------------------------

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

const client = axios.create({
  baseURL: API_URL,
  timeout: 300_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getReviews(params = {}) {
  const response = await client.get('/reviews', { params });
  return response.data;
}

export async function analyzeManual(prUrl) {
  const response = await client.post('/analyze', { prUrl });
  return response.data;
}

export async function sendChatMessage(reviewId, messages) {
  const response = await client.post(`/analyze/chat/${reviewId}`, { messages });
  return response.data;
}

export async function applyIssueFix(reviewId, issue) {
  const response = await client.post(`/analyze/fix/${reviewId}`, { issue });
  return response.data;
}

export async function getRules() {
  const response = await client.get('/settings/rules');
  return response.data.rules;
}

export async function saveRules(rules) {
  const response = await client.post('/settings/rules', { rules });
  return response.data;
}

export async function getIssueDiff(reviewId, filename) {
  const response = await client.get(`/analyze/diff/${reviewId}`, { params: { file: filename } });
  return response.data.diff;
}

export async function getLeaderboard() {
  const response = await client.get('/analytics/leaderboard');
  return response.data;
}

export default client;
