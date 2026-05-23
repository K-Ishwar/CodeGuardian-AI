import axios from 'axios';

// ---------------------------------------------------------------------------
// CodeGuardian AI — API Client
// Base URL points to the Express backend running on http://localhost:3001
// ---------------------------------------------------------------------------

const client = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getReviews() {
  const response = await client.get('/reviews');
  return response.data;
}

export async function analyzeManual(prUrl) {
  const response = await client.post('/analyze', { prUrl });
  return response.data;
}

export default client;

