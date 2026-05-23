import { useState, useEffect } from 'react';
import client from '../api/client';

// ---------------------------------------------------------------------------
// useReviews — polling hook
// Fetches GET /reviews every 3 seconds and keeps local state in sync.
// ---------------------------------------------------------------------------

export function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: implement polling logic
    // - fetch /reviews on mount
    // - set up a setInterval for every 3 000 ms
    // - clear the interval on unmount
  }, []);

  return { reviews, loading, error };
}
