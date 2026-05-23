import { useState } from 'react';

// ---------------------------------------------------------------------------
// ManualInput — fixed bottom bar
// Accepts a GitHub PR URL and POSTs it to POST /analyze for manual analysis.
// ---------------------------------------------------------------------------

export default function ManualInput({ onSubmit, loading }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    await onSubmit(inputValue.trim());
    setInputValue(''); // clear input after submit
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--color-bg-panel)',
        borderTop: '1px solid var(--color-bg-border)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        Manual Trigger
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flex: 1,
          gap: '12px',
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="https://github.com/owner/repo/pull/123"
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-bg-border)',
            borderRadius: '4px',
            padding: '8px 16px',
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-mono)',
            outline: 'none',
          }}
        />
        
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          style={{
            backgroundColor: 'var(--color-accent-blue)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !inputValue.trim() ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze PR'}
        </button>
      </form>
    </div>
  );
}

