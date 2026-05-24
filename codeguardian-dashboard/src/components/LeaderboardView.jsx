import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/client';

export default function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((data) => {
        setLeaderboard(data || []);
      })
      .catch((err) => console.error('Failed to load leaderboard:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '40px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Calculating Code Health Scores...
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
        background: 'linear-gradient(to bottom, var(--color-bg-card), var(--color-bg-primary))',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--color-text-primary)', margin: '0 0 8px 0', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            🏆 Security Champions Leaderboard
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
            Gamifying code quality. Earn points for clean PRs, lose points for critical vulnerabilities.
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No reviews processed yet. Start analyzing PRs to see the leaderboard!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leaderboard.map((dev, index) => {
              let rankIcon = `#${index + 1}`;
              let rankStyle = { color: 'var(--color-text-secondary)' };
              let borderStyle = '1px solid var(--color-glass-border-strong)';
              
              if (index === 0) {
                rankIcon = '🥇';
                rankStyle = { color: '#FCD34D', fontSize: '1.5rem', textShadow: '0 0 10px rgba(252, 211, 77, 0.5)' };
                borderStyle = '1px solid rgba(252, 211, 77, 0.5)';
              } else if (index === 1) {
                rankIcon = '🥈';
                rankStyle = { color: '#E5E7EB', fontSize: '1.25rem' };
              } else if (index === 2) {
                rankIcon = '🥉';
                rankStyle = { color: '#D97706', fontSize: '1.25rem' };
              }

              return (
                <div
                  key={dev.author}
                  style={{
                    backgroundColor: 'var(--color-glass-panel)',
                    border: borderStyle,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: index === 0 ? '0 10px 40px rgba(252, 211, 77, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '30%' }}>
                    <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', ...rankStyle }}>
                      {rankIcon}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={`https://github.com/${dev.author}.png`} 
                        alt={dev.author} 
                        style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--color-glass-border-strong)' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://github.com/ghost.png'; }}
                      />
                      <div>
                        <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '1.125rem' }}>@{dev.author}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '40px', flex: 1, justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Clean PRs</div>
                      <div style={{ color: 'var(--color-accent-green)', fontWeight: 600, fontSize: '1.25rem' }}>{dev.cleanPrRate}%</div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>({dev.cleanPrs}/{dev.totalPrs})</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Critical Blocked</div>
                      <div style={{ color: dev.criticalBugsPrevented > 0 ? 'var(--color-accent-red)' : 'var(--color-text-primary)', fontWeight: 600, fontSize: '1.25rem' }}>{dev.criticalBugsPrevented}</div>
                    </div>
                  </div>

                  <div style={{ width: '20%', textAlign: 'right' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Health Score</div>
                    <div style={{ color: 'var(--color-accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1.75rem' }}>
                      {dev.score}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
