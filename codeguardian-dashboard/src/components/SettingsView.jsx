import { useState, useEffect } from 'react';
import { getRules, saveRules } from '../api/client';

export default function SettingsView() {
  const [rulesText, setRulesText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    getRules()
      .then((rules) => {
        setRulesText(rules || '');
      })
      .catch((err) => console.error('Failed to load rules:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveRules(rulesText);
      setSaveMessage('Rules saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('Failed to save rules.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        padding: '40px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: 'var(--color-glass-panel)',
          border: '1px solid var(--color-glass-border-strong)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 style={{ color: 'var(--color-text-primary)', margin: '0 0 8px 0', fontSize: '1.5rem' }}>
          Custom AI Ruleset
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          Define custom coding standards, style guides, or project constraints. CodeGuardian AI will strictly adhere to these instructions when analyzing your Pull Requests.
        </p>

        <textarea
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          placeholder="Example:&#10;- Never use 'var', always use 'let' or 'const'&#10;- Require JSDoc comments for all exported functions&#10;- Flag any console.log as a Moderate issue"
          style={{
            width: '100%',
            height: '300px',
            backgroundColor: 'var(--color-glass-input)',
            border: '1px solid var(--color-glass-border-strong)',
            borderRadius: '8px',
            padding: '16px',
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6,
            outline: 'none',
            resize: 'vertical',
            marginBottom: '20px',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: saveMessage.includes('Failed') ? 'var(--color-accent-red)' : 'var(--color-accent-green)', fontSize: '0.875rem', fontWeight: 500 }}>
            {saveMessage}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              color: 'white',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
}
