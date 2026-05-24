import { useState } from 'react';

// ---------------------------------------------------------------------------
// ManualInput — fixed bottom bar
// Accepts a GitHub PR URL and POSTs it to POST /analyze for manual analysis.
// ---------------------------------------------------------------------------

export default function ManualInput({ onSubmit, loading, progress, statusText }) {
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const validateUrl = (url) => {
    // Basic regex for https://github.com/owner/repo/pull/123
    const regex = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+\/?$/i;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = inputValue.trim();
    if (!url) return;
    
    if (!validateUrl(url)) {
      setErrorMsg('Invalid GitHub PR URL format');
      return;
    }
    
    setErrorMsg('');
    await onSubmit(url);
    setInputValue(''); // clear input after submit
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (errorMsg) setErrorMsg(''); // Clear error when user types
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-glass-panel)',
        border: '1px solid var(--color-glass-border-strong)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '12px',
        padding: '16px',
        margin: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 10,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 var(--color-glass-border-strong)',
      }}
    >
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Manual Trigger
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="https://github.com/owner/repo/pull/123"
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: 'var(--color-glass-input)',
              border: `1px solid ${errorMsg ? 'var(--color-accent-red)' : 'var(--color-glass-border-strong)'}`,
              borderRadius: '6px',
              padding: '10px 16px',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          />
          
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              color: '#ffffff',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !inputValue.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze PR'}
          </button>
        </form>
        {loading && statusText && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-glass-input)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  transition: 'width 0.3s ease-out' 
                }} 
              />
            </div>
          </div>
        )}
        {errorMsg && (
          <div style={{ color: 'var(--color-accent-red)', fontSize: '0.75rem', marginLeft: '2px' }}>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}


