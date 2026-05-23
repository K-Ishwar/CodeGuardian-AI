import { useState, useEffect, useCallback } from 'react';
import { getReviews } from '../api/client';

// ---------------------------------------------------------------------------
// useReviews — polling hook
// Fetches GET /reviews every 3 seconds and keeps local state in sync.
// ---------------------------------------------------------------------------

export function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await getReviews();
      setReviews(data);
      setConnected(true);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    fetchReviews();

    // Set up polling every 3000ms
    const intervalId = setInterval(fetchReviews, 3000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchReviews]);

  return { reviews, loading, refetch: fetchReviews, connected };
}


