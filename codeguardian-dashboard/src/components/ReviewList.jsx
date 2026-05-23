import StatusBadge from './StatusBadge';

// ---------------------------------------------------------------------------
// ReviewList — left panel
// Renders a scrollable list of PR review cards. Clicking one selects it.
// ---------------------------------------------------------------------------

function getRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function ReviewList({ reviews = [], selectedId, onSelect }) {
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'transparent',
        borderRight: '1px solid var(--color-glass-border)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-glass-border)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--color-glass-panel)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 10,
        }}
      >
        PR Queue
      </div>

      {/* Empty State */}
      {reviews.length === 0 && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          No reviews yet. Submit a PR URL below.
        </div>
      )}

      {/* Review Items */}
      {reviews.map((review) => {
        const isSelected = selectedId === review.id;
        const issues = review.issues || [];
        
        // Count severities
        let crit = 0, mod = 0, low = 0;
        issues.forEach(i => {
          const sev = (i.severity || '').toLowerCase();
          if (sev === 'critical') crit++;
          else if (sev === 'moderate') mod++;
          else if (sev === 'low') low++;
        });
        
        return (
          <div
            key={review.id}
            onClick={() => onSelect(review.id)}
            style={{
              backgroundColor: isSelected ? 'var(--color-glass-selected)' : 'transparent',
              borderBottom: '1px solid var(--color-glass-border)',
              borderLeft: isSelected ? '3px solid var(--color-accent-blue)' : '3px solid transparent',
              backdropFilter: isSelected ? 'blur(12px)' : 'none',
              WebkitBackdropFilter: isSelected ? 'blur(12px)' : 'none',
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? 'inset 0 0 16px var(--color-glass-hover)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'var(--color-glass-hover)';
                e.currentTarget.style.backdropFilter = 'blur(12px)';
                e.currentTarget.style.WebkitBackdropFilter = 'blur(12px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.backdropFilter = 'none';
                e.currentTarget.style.WebkitBackdropFilter = 'none';
              }
            }}
          >
            {/* Top line: Repo & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span
                style={{
                  color: 'var(--color-text-primary)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginRight: '8px',
                  flex: 1,
                }}
                title={review.repository}
              >
                {review.repository || 'unknown/repo'}
              </span>
              <StatusBadge status={review.status} />
            </div>

            {/* Second line: PR Title & Severity Summary */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <div
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                  marginRight: '8px',
                }}
                title={review.pr_title}
              >
                {review.pr_title || 'Untitled PR'}
              </div>
              
              {/* Severity Summary */}
              {issues.length > 0 && (
                <div style={{ fontSize: '0.65rem', display: 'flex', gap: '4px', whiteSpace: 'nowrap' }}>
                  {crit > 0 && <span style={{ color: 'var(--color-text-secondary)' }}>🔴{crit}</span>}
                  {mod > 0 && <span style={{ color: 'var(--color-text-secondary)' }}>🟡{mod}</span>}
                  {low > 0 && <span style={{ color: 'var(--color-text-secondary)' }}>🟢{low}</span>}
                </div>
              )}
            </div>

            {/* Third line: Author & Timestamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  color: 'var(--color-accent-muted)',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                @{review.author || 'unknown'}
              </span>
              <span
                style={{
                  color: 'var(--color-accent-muted)',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {getRelativeTime(review.created_at || new Date().toISOString())}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
