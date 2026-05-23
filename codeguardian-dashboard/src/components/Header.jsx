import { useState, useEffect } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';

// ---------------------------------------------------------------------------
// Header — top metric bar
// Displays global stats: total reviews, issues found, avg score, etc.
// ---------------------------------------------------------------------------

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour12: false });
  return <span>{timeString}</span>;
}

export default function Header({ reviews = [], globalMetrics = {}, connected = true, isLightMode, setIsLightMode, onLogout }) {
  // Use globalMetrics computed by backend over the full dataset
  const totalReviews = globalMetrics.totalReviews || 0;
  const totalIssues = globalMetrics.totalIssues || 0;
  const totalDebtRecovered = globalMetrics.debtRecovered || 0;
  const avgLatency = globalMetrics.avgLatency ? `${globalMetrics.avgLatency}s` : '0.0s';

  return (
    <header
      style={{
        backgroundColor: 'var(--color-glass-panel)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-glass-border)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Left side: Logo & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <h1
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.125rem',
              lineHeight: '1.75rem',
              fontWeight: 600,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            CodeGuardian AI
            {/* Connection Indicator */}
            <span
              title={connected ? "Connected to Backend" : "Disconnected from Backend"}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connected ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                boxShadow: connected ? '0 0 8px var(--color-accent-green)' : 'none',
                opacity: connected ? 1 : 0.5,
                transition: 'background-color 0.3s, box-shadow 0.3s',
              }}
            />
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              lineHeight: '1rem',
              margin: 0,
              marginTop: '4px',
            }}
          >
            Autonomous Code Review Agent
          </p>
        </div>
      </div>

      {/* Right side: Metrics & Clock */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <MetricChip label="PRs Reviewed" value={totalReviews} />
        <MetricChip label="Issues Caught" value={totalIssues} />
        <MetricChip label="Debt Recovered" value={`$${totalDebtRecovered.toFixed(0)}`} />
        <MetricChip label="Avg Latency" value={avgLatency} />
        
        {/* Theme Toggle & System Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
          <button
            onClick={() => setIsLightMode?.(!isLightMode)}
            style={{
              background: 'var(--color-glass-border)',
              border: '1px solid var(--color-glass-border-strong)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
              transition: 'all 0.2s',
            }}
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <button
            onClick={onLogout}
            style={{
              background: 'var(--color-glass-border)',
              border: '1px solid var(--color-glass-border-strong)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-accent-red)',
              transition: 'all 0.2s',
            }}
            title="Logout"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent-red)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-glass-border)';
              e.currentTarget.style.color = 'var(--color-accent-red)';
            }}
          >
            <LogOut size={16} />
          </button>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
          <span
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '2px',
            }}
          >
            System Time
          </span>
          <span
            style={{
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}
          >
            <Clock />
          </span>
        </div>
      </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// MetricChip component
// ---------------------------------------------------------------------------
function MetricChip({ label, value }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '1px solid rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '6px',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: '120px',
        boxShadow: isHovered 
          ? '0 0 24px rgba(106, 90, 205, 0.25), inset 0 0 12px rgba(106, 90, 205, 0.15)' // Soft Slate Blue LED glow
          : '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
    >
      <span
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '4px',
          textShadow: isHovered ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
          transition: 'text-shadow 0.3s ease',
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: 'var(--color-accent-blue)',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          textShadow: isHovered 
            ? '0 0 12px var(--color-accent-blue), 0 0 4px var(--color-accent-blue)' 
            : '0 0 4px var(--color-accent-blue)',
          transition: 'text-shadow 0.3s ease',
        }}
      >
        {value}
      </span>
    </div>
  );
}

