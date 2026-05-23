import StatusBadge from './StatusBadge';
import IssueCard from './IssueCard';

// ---------------------------------------------------------------------------
// ReviewDetail — right panel
// Shows full analysis for the selected PR: summary, issues list, score, etc.
// ---------------------------------------------------------------------------

function DetailMetric({ label, value, valueColor }) {
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
          color: valueColor || 'var(--color-text-primary)',
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

export default function ReviewDetail({ review }) {
  if (!review) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        Select a PR from the queue to view analysis
      </div>
    );
  }

  const issues = review.issues || [];
  const totalIssues = review.metrics?.total_issues || 0;
  const hoursSaved = review.metrics?.hours_saved || 0;
  const financialSaved = review.metrics?.financial_saved || 0;
  
  // Determine color for issues count
  let issuesColor = 'var(--color-accent-green)';
  if (totalIssues >= 4) {
    issuesColor = 'var(--color-accent-red)';
  } else if (totalIssues >= 1) {
    issuesColor = 'var(--color-accent-amber)';
  }

  const isProcessing = review.status?.toLowerCase() === 'processing';
  const isAnalyzed = review.status?.toLowerCase() === 'analyzed' || review.status?.toLowerCase() === 'completed';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {/* Header section */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-bg-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2
            style={{
              color: 'var(--color-text-primary)',
              fontSize: '1rem',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {review.pr_title || 'Untitled PR'}
          </h2>
          <StatusBadge status={review.status} />
        </div>
        
        <div
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {review.repository || 'unknown/repo'} <span style={{ opacity: 0.5 }}>·</span> @{review.author || 'unknown'} <span style={{ opacity: 0.5 }}>·</span> {review.latency_seconds ? `${review.latency_seconds.toFixed(1)}s` : '—'}
        </div>
      </div>

      {/* Metrics row */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--color-bg-border)',
          backgroundColor: 'var(--color-bg-panel)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <DetailMetric 
          label="Issues Found" 
          value={totalIssues} 
          valueColor={issuesColor} 
        />
        <DetailMetric 
          label="Time Saved" 
          value={`${hoursSaved}h`} 
          valueColor="var(--color-accent-blue)" 
        />
        <DetailMetric 
          label="Cost Recovered" 
          value={`$${financialSaved}`} 
          valueColor="var(--color-accent-green)" 
        />
      </div>

      {/* Issues section */}
      <div
        style={{
          flex: 1,
          padding: '16px 24px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
          }}
        >
          Findings
        </div>

        {isProcessing && (
          <div
            style={{
              color: 'var(--color-accent-blue)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          >
            {/* simple inline style for a pulse animation effect doesn't strictly work without keyframes defined globally, but setting opacity creates a decent placeholder */}
            <span style={{ fontSize: '1.2em' }}>↻</span> Analyzing with Gemini AI...
          </div>
        )}

        {!isProcessing && isAnalyzed && issues.length === 0 && (
          <div
            style={{
              color: 'var(--color-accent-green)',
              fontSize: '0.875rem',
              marginTop: '8px',
            }}
          >
            ✓ No issues detected. Clean code.
          </div>
        )}

        {!isProcessing && issues.length > 0 && (
          <div>
            {issues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

