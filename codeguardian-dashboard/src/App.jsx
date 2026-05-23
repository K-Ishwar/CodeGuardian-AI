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
  const { reviews, loading, refetch, connected } = useReviews();
  const [selectedId, setSelectedId] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Auto-select first review on initial load
  useEffect(() => {
    if (selectedId === null && reviews.length > 0) {
      setSelectedId(reviews[0].id);
    }
  }, [reviews, selectedId]);

  // Toggle light-mode class on root element
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isLightMode]);

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
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* ── Top metric bar ── */}
      <Header 
        reviews={reviews} 
        connected={connected} 
        isLightMode={isLightMode} 
        setIsLightMode={setIsLightMode} 
      />

      {/* ── Two-column main area ── */}
      <main
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left panel — PR list and Manual Input */}
        <div style={{ width: '40%', borderRight: '1px solid var(--color-bg-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ReviewList
              reviews={reviews}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <ManualInput onSubmit={handleManualSubmit} loading={manualLoading} />
        </div>

        {/* Right panel — PR detail */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ReviewDetail review={selectedReview} />
        </div>
      </main>
    </div>
  );
}
