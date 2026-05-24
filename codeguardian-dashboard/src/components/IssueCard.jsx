import { useState } from 'react';
import { applyIssueFix, getIssueDiff } from '../api/client';

// ---------------------------------------------------------------------------
// IssueCard — single issue display
// Renders severity, file path, line number, and description for one issue.
// ---------------------------------------------------------------------------

export default function IssueCard({ issue, reviewId }) {
  const [isApplying, setIsApplying] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);
  const [commitUrl, setCommitUrl] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [diffContent, setDiffContent] = useState('');
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  if (!issue) return null;

  const handleApplyFix = async () => {
    if (!reviewId) return;
    setIsApplying(true);
    try {
      const result = await applyIssueFix(reviewId, issue);
      if (result.success) {
        setFixApplied(true);
        setCommitUrl(result.commitUrl);
      }
    } catch (err) {
      alert('Failed to apply fix: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsApplying(false);
    }
  };

  const handleToggleDiff = async () => {
    if (showDiff) {
      setShowDiff(false);
      return;
    }
    
    setShowDiff(true);
    if (diffContent) return; // already loaded

    setIsLoadingDiff(true);
    try {
      const diff = await getIssueDiff(reviewId, issue.filename);
      setDiffContent(diff);
    } catch (err) {
      setDiffContent('Error loading diff: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoadingDiff(false);
    }
  };

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
        backgroundColor: 'var(--color-glass-hover)',
        borderTop: '1px solid var(--color-glass-border-strong)',
        borderLeft: '1px solid var(--color-glass-border)',
        borderRight: '1px solid var(--color-glass-border)',
        borderBottom: '1px solid var(--color-glass-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: severityLower === 'critical' 
          ? 'inset 0 0 24px rgba(239, 68, 68, 0.05)'
          : severityLower === 'moderate'
          ? 'inset 0 0 24px rgba(245, 158, 11, 0.05)'
          : 'inset 0 0 24px rgba(16, 185, 129, 0.05)',
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                color: 'var(--color-accent-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Suggested Fix
            </div>
            {!fixApplied ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleToggleDiff}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {showDiff ? 'Hide Diff ▴' : 'View Diff 📄'}
                </button>
                <button
                  onClick={handleApplyFix}
                  disabled={isApplying}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: 'var(--color-accent-blue)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    cursor: isApplying ? 'wait' : 'pointer',
                    opacity: isApplying ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isApplying ? 'Applying...' : 'Apply Fix ✨'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-accent-green)', fontSize: '0.75rem', fontWeight: 600 }}>✓ Fix Applied</span>
                {commitUrl && (
                  <a href={commitUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-blue)', fontSize: '0.7rem', textDecoration: 'none' }}>
                    View Commit ↗
                  </a>
                )}
              </div>
            )}
          </div>
          <pre
            style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--color-accent-green)',
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.8)',
            }}
          >
            {issue.patch_suggestion}
          </pre>
        </div>
      )}

      {/* Diff Panel */}
      {showDiff && (
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
            File Diff Context
          </div>
          <div
            style={{
              backgroundColor: '#0A0A0A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.8)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {isLoadingDiff ? (
              <span style={{ color: 'var(--color-text-secondary)' }}>Loading diff...</span>
            ) : (
              diffContent.split('\n').map((line, i) => {
                let color = 'var(--color-text-primary)';
                let bgColor = 'transparent';
                if (line.startsWith('+')) {
                  color = 'var(--color-accent-green)';
                  bgColor = 'rgba(16, 185, 129, 0.1)';
                } else if (line.startsWith('-')) {
                  color = 'var(--color-accent-red)';
                  bgColor = 'rgba(239, 68, 68, 0.1)';
                } else if (line.startsWith('@@')) {
                  color = 'var(--color-accent-muted)';
                }

                return (
                  <div key={i} style={{ color, backgroundColor: bgColor, padding: '0 4px', borderRadius: '2px' }}>
                    {line || ' '}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

