import React from 'react';
import { GitPullRequest, LogIn } from 'lucide-react';

export default function LoginView({ onGuestLogin }) {
  const handleLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      alert("Missing VITE_GITHUB_CLIENT_ID in environment variables");
      return;
    }
    const redirectUri = window.location.origin;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'transparent'
    }}>
      <div style={{
        backgroundColor: 'var(--color-glass-panel)',
        padding: '48px',
        borderRadius: '16px',
        border: '1px solid var(--color-glass-border-strong)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          CodeGuardian AI
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
          Sign in to view and analyze your repositories.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '250px' }}>
          <button
            onClick={handleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#24292e',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1b1f23'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#24292e'}
          >
            <GitPullRequest size={20} />
            Login with GitHub
          </button>

          <button
            onClick={onGuestLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: 'var(--color-glass-panel)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-glass-border-strong)',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-glass-border)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-glass-panel)'}
          >
            <LogIn size={20} />
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
