import { useState } from 'react';
import Header from './components/Header';
import ReviewList from './components/ReviewList';
import ReviewDetail from './components/ReviewDetail';
import ManualInput from './components/ManualInput';
import { useReviews } from './hooks/useReviews';

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
  const { reviews, loading, error } = useReviews();
  const [selectedId, setSelectedId] = useState(null);

  const selectedReview = reviews.find((r) => r.id === selectedId) ?? null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--color-bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── Top metric bar ── */}
      <Header reviews={reviews} loading={loading} />

      {/* ── Two-column main area ── */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: '40% 60%',
          flex: 1,
          overflow: 'hidden',
          borderTop: '1px solid var(--color-bg-border)',
        }}
      >
        {/* Left panel — PR list */}
        <ReviewList
          reviews={reviews}
          loading={loading}
          error={error}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Right panel — PR detail */}
        <ReviewDetail review={selectedReview} />
      </main>

      {/* ── Fixed bottom input bar ── */}
      <ManualInput />
    </div>
  );
}
