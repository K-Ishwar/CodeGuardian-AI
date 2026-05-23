import axios from 'axios';

// ---------------------------------------------------------------------------
// CodeGuardian AI — API Client
// Base URL points to the Express backend running on http://localhost:3001
// ---------------------------------------------------------------------------

const client = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TODO: Add request/response interceptors here (auth headers, error toasts, etc.)

export default client;
