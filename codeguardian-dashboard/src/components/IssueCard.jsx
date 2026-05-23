// ---------------------------------------------------------------------------
// IssueCard — single issue display
// Renders severity, file path, line number, and description for one issue.
// ---------------------------------------------------------------------------

export default function IssueCard({ issue }) {
  if (!issue) return null;

  // Determine severity visual
  const severityLower = (issue.severity || '').toLowerCase();
  let icon = '⚪';
  let iconColor = 'var(--color-text-secondary)';
  if (severityLower === 'critical') {
    icon = '🔴';
    iconColor = 'var(--color-accent-red)';
  } else if (severityLower === 'moderate') {
    icon = '🟡';
    iconColor = 'var(--color-accent-amber)';
  } else if (severityLower === 'low') {
    icon = '🟢';
    iconColor = 'var(--color-accent-green)';
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-bg-border)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: iconColor, fontSize: '0.875rem' }}>{icon}</span>
          <span
            style={{
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginLeft: '8px',
            }}
          >
            {issue.title || 'Unknown Issue'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            textAlign: 'right',
          }}
        >
          {issue.filename && <span style={{ color: 'var(--color-accent-muted)' }}>{issue.filename}</span>}
          {issue.time_to_fix && <span>{issue.time_to_fix}min</span>}
        </div>
      </div>

      {/* Middle: Explanation */}
      {issue.explanation && (
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            lineHeight: 1.6,
            marginTop: '8px',
            marginBottom: 0,
          }}
        >
          {issue.explanation}
        </p>
      )}

      {/* Bottom: Patch Suggestion */}
      {issue.patch_suggestion && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              color: 'var(--color-accent-muted)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            Suggested Fix
          </div>
          <pre
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-bg-border)',
              borderRadius: '4px',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--color-accent-green)',
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {issue.patch_suggestion}
          </pre>
        </div>
      )}
    </div>
  );
}

