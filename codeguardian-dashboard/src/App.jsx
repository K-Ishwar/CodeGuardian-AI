import { useState, useEffect } from 'react';
import Header from './components/Header';
import ReviewList from './components/ReviewList';
import ReviewDetail from './components/ReviewDetail';
import ManualInput from './components/ManualInput';
import { useReviews } from './hooks/useReviews';
import { analyzeManual } from './api/client';

// ---------------------------------------------------------------------------
// App — root layout
//
// ┌─────────────────────────────────────────────────────────┐
// │  Header  (top metric bar)                               │
// ├──────────────────────┬──────────────────────────────────┤
// │  ReviewList  (40%)   │  ReviewDetail  (60%)             │
// │  scrollable PR list  │  full analysis for selected PR   │
// └──────────────────────┴──────────────────────────────────┘
// [  ManualInput — fixed bottom bar (URL input + submit)   ]
// ---------------------------------------------------------------------------

export default function App() {
  const { reviews, loading, refetch } = useReviews();
  const [selectedId, setSelectedId] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  // Auto-select first review on initial load
  useEffect(() => {
    if (selectedId === null && reviews.length > 0) {
      setSelectedId(reviews[0].id);
    }
  }, [reviews, selectedId]);

  const selectedReview = reviews.find((r) => r.id === selectedId) ?? null;

  const handleManualSubmit = async (prUrl) => {
    setManualLoading(true);
    try {
      const result = await analyzeManual(prUrl);
      await refetch();
      // Select the newly analyzed PR
      if (result && result.review && result.review.id) {
        setSelectedId(result.review.id);
      }
    } catch (error) {
      alert('Failed to analyze PR: ' + (error.response?.data?.error || error.message));
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        overflow: 'hidden',
        // Make space for the fixed bottom bar
        paddingBottom: '60px', 
      }}
    >
      {/* ── Top metric bar ── */}
      <Header reviews={reviews} loading={loading} />

      {/* ── Two-column main area ── */}
      <main
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left panel — PR list */}
        <div style={{ width: '40%', borderRight: '1px solid var(--color-bg-border)' }}>
          <ReviewList
            reviews={reviews}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Right panel — PR detail */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ReviewDetail review={selectedReview} />
        </div>
      </main>

      {/* ── Fixed bottom input bar ── */}
      <ManualInput onSubmit={handleManualSubmit} loading={manualLoading} />
    </div>
  );
}
