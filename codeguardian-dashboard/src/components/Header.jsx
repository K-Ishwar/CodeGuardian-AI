// ---------------------------------------------------------------------------
// Header — top metric bar
// Displays global stats: total reviews, issues found, avg score, etc.
// ---------------------------------------------------------------------------

export default function Header({ reviews = [] }) {
  // Compute metrics
  const totalReviews = reviews.length;
  
  const totalIssues = reviews.reduce((sum, review) => {
    return sum + (review.metrics?.total_issues || 0);
  }, 0);
  
  const totalDebtRecovered = reviews.reduce((sum, review) => {
    return sum + (review.metrics?.financial_saved || 0);
  }, 0);
  
  const totalLatency = reviews.reduce((sum, review) => {
    return sum + (review.latency_seconds || 0);
  }, 0);
  
  const avgLatency = totalReviews > 0 ? (totalLatency / totalReviews).toFixed(1) + 's' : '—';

  return (
    <header
      style={{
        backgroundColor: 'var(--color-bg-panel)',
        borderBottom: '1px solid var(--color-bg-border)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Left side: Logo & Subtitle */}
      <div>
        <h1
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.125rem',
            lineHeight: '1.75rem',
            fontWeight: 600,
            margin: 0,
          }}
        >
          CodeGuardian AI
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            lineHeight: '1rem',
            margin: 0,
            marginTop: '4px',
          }}
        >
          Autonomous Code Review Agent
        </p>
      </div>

      {/* Right side: Metrics */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <MetricChip label="PRs Reviewed" value={totalReviews} />
        <MetricChip label="Issues Caught" value={totalIssues} />
        <MetricChip label="Debt Recovered" value={`$${totalDebtRecovered.toFixed(0)}`} />
        <MetricChip label="Avg Latency" value={avgLatency} />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// MetricChip component
// ---------------------------------------------------------------------------
function MetricChip({ label, value }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-bg-border)',
        borderRadius: '6px',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: '120px',
      }}
    >
      <span
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '4px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: 'var(--color-accent-blue)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          fontWeight: 'bold',
        }}
      >
        {value}
      </span>
    </div>
  );
}
