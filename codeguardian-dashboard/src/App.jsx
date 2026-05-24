import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ReviewList from './components/ReviewList';
import ReviewDetail from './components/ReviewDetail';
import ManualInput from './components/ManualInput';
import LoginView from './components/LoginView';
import AgentChat from './components/AgentChat';
import SettingsView from './components/SettingsView';
import LeaderboardView from './components/LeaderboardView';
import { useReviews } from './hooks/useReviews';
import { analyzeManual } from './api/client';

// ---------------------------------------------------------------------------
// App — root layout
//
// ┌─────────────────────────────────────────────────────────┐
// │  Header  (top metric bar)                               │
// ├──────────────────────┬──────────────────────────────────┤
// │  ReviewList  (40%)   │  ReviewDetail  (60%)             │
// │  scrollable PR list  │  full analysis for selected PR   │
// └──────────────────────┴──────────────────────────────────┘
// [  ManualInput — fixed bottom bar (URL input + submit)   ]
// ---------------------------------------------------------------------------

export default function App() {
  const { 
    reviews, 
    globalMetrics, 
    loading, 
    refetch, 
    connected,
    page,
    setPage,
    totalPages,
    repoFilter,
    setRepoFilter,
    severityFilter,
    setSeverityFilter
  } = useReviews();
  const [selectedId, setSelectedId] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isSettingsView, setIsSettingsView] = useState(false);
  const [isLeaderboardView, setIsLeaderboardView] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('auth_token'));
  const [authLoading, setAuthLoading] = useState(false);
  const isFetchingAuth = useRef(false);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !authToken && !isFetchingAuth.current) {
      isFetchingAuth.current = true;
      setAuthLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/auth/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            setAuthToken(data.token);
            // Remove code from URL
            window.history.replaceState({}, document.title, "/");
          } else {
            alert('Login failed: ' + data.error);
          }
        })
        .catch((err) => alert('Login request failed: ' + err.message))
        .finally(() => setAuthLoading(false));
    }
  }, [authToken]);

  // Auto-select first review on initial load
  useEffect(() => {
    if (selectedId === null && reviews.length > 0) {
      setSelectedId(reviews[0].id);
    }
  }, [reviews, selectedId]);

  // Toggle light-mode class on root element
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const selectedReview = reviews.find((r) => r.id === selectedId) ?? null;

  const handleManualSubmit = async (prUrl) => {
    setManualLoading(true);
    setAnalysisStatus('Initializing analysis...');
    setAnalysisProgress(0);
    try {
      const result = await analyzeManual(prUrl);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');
      const eventSource = new EventSource(`${API_URL}/analyze/progress/${result.id}?token=${token}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setAnalysisStatus(data.step);
        setAnalysisProgress(data.progress);
      };
      
      eventSource.addEventListener('end', async () => {
        eventSource.close();
        await refetch();
        setSelectedId(result.id);
        setManualLoading(false);
      });

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setManualLoading(false);
        // We still refetch just in case it actually finished
        refetch();
      };

    } catch (error) {
      alert('Failed to analyze PR: ' + (error.response?.data?.error || error.message));
      setManualLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}>
        Authenticating with GitHub...
      </div>
    );
  }

  const handleGuestLogin = async (password) => {
    setAuthLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/auth/guest`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setAuthToken(data.token);
      } else {
        alert('Guest login failed: ' + data.error);
      }
    } catch (err) {
      alert('Guest login request failed: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (!authToken) {
    return <LoginView onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* ── Top metric bar ── */}
      <Header 
        reviews={reviews} 
        globalMetrics={globalMetrics}
        connected={connected} 
        isLightMode={isLightMode} 
        setIsLightMode={setIsLightMode} 
        onLogout={() => {
          localStorage.removeItem('auth_token');
          setAuthToken(null);
        }}
        isSettingsView={isSettingsView}
        onToggleSettings={() => {
          setIsSettingsView(!isSettingsView);
          setIsLeaderboardView(false);
        }}
        isLeaderboardView={isLeaderboardView}
        onToggleLeaderboard={() => {
          setIsLeaderboardView(!isLeaderboardView);
          setIsSettingsView(false);
        }}
      />

      {/* ── Main Area ── */}
      {isLeaderboardView ? (
        <LeaderboardView />
      ) : isSettingsView ? (
        <SettingsView />
      ) : (
        <main
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left panel — PR list and Manual Input */}
          <div style={{ width: '40%', borderRight: '1px solid var(--color-bg-border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ReviewList
              reviews={reviews}
              selectedId={selectedId}
              onSelect={setSelectedId}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              repoFilter={repoFilter}
              setRepoFilter={setRepoFilter}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
            />
          </div>
          <ManualInput 
            onSubmit={handleManualSubmit} 
            loading={manualLoading} 
            progress={analysisProgress}
            statusText={analysisStatus}
          />
        </div>

          {/* Right panel — PR detail */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ReviewDetail review={selectedReview} />
          </div>
        </main>
      )}

      {/* Floating Agent Chat Widget */}
      {!isSettingsView && !isLeaderboardView && selectedReview && (
        <AgentChat  
          reviewId={selectedReview.id} 
          isAnalyzed={selectedReview.status?.toLowerCase() === 'analyzed' || selectedReview.status?.toLowerCase() === 'completed'} 
        />
      )}
    </div>
  );
}
