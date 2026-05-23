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
        backgroundColor: 'var(--color-bg-primary)',
        borderRight: '1px solid var(--color-bg-border)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-bg-border)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--color-bg-primary)',
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
        
        return (
          <div
            key={review.id}
            onClick={() => onSelect(review.id)}
            style={{
              backgroundColor: isSelected ? 'var(--color-bg-card)' : 'transparent',
              borderBottom: '1px solid var(--color-bg-border)',
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-panel)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
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

            {/* Second line: PR Title */}
            <div
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '6px',
              }}
              title={review.pr_title}
            >
              {review.pr_title || 'Untitled PR'}
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
