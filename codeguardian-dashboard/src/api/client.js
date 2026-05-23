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
  timeout: 15_000,
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

export default client;
