import { useState, useEffect, useCallback } from 'react';
import { getReviews } from '../api/client';

// ---------------------------------------------------------------------------
// useReviews — polling hook
// Fetches GET /reviews every 3 seconds and keeps local state in sync.
// ---------------------------------------------------------------------------

export function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [globalMetrics, setGlobalMetrics] = useState({ totalReviews: 0, totalIssues: 0, debtRecovered: 0, avgLatency: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [repoFilter, setRepoFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const params = { page, limit: 10 };
      if (repoFilter) params.repo = repoFilter;
      if (severityFilter) params.severity = severityFilter;
      
      const result = await getReviews(params);
      
      setReviews(result.data || []);
      if (result.globalMetrics) {
        setGlobalMetrics(result.globalMetrics);
      }
      if (result.totalPages) {
        setTotalPages(result.totalPages);
      }
      setConnected(true);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [page, repoFilter, severityFilter]);

  useEffect(() => {
    fetchReviews();
    const intervalId = setInterval(fetchReviews, 3000);
    return () => clearInterval(intervalId);
  }, [fetchReviews]);

  return {
    reviews,
    globalMetrics,
    loading,
    refetch: fetchReviews,
    connected,
    page,
    setPage,
    totalPages,
    repoFilter,
    setRepoFilter,
    severityFilter,
    setSeverityFilter
  };
}


