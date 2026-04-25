import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getLevelData } from '../utils/progression';

export default function Dashboard() {
  const { currentUser, userData, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  // Apply theme to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <h1 className="text-gradient">Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={toggleTheme} className="btn btn-secondary">
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button onClick={handleLogout} className="btn btn-danger">
            Log Out
          </button>
        </div>
      </header>
      
      <div>
        <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Welcome, {currentUser?.email?.split('@')[0]}!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>Learning <strong style={{ color: 'var(--primary)' }}>{userData?.learningLanguage || userData?.targetLanguage || 'Language'}</strong></p>
            </div>
            <div style={{ display: 'flex', gap: '2.5rem', textAlign: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="animate-float" style={{ animationDelay: '0s' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</p>
                <h3 style={{ color: 'var(--secondary)', fontSize: '1.5rem', margin: 0 }}>{getLevelData(userData?.xp || 0).level} - {getLevelData(userData?.xp || 0).title}</h3>
              </div>
              <div className="animate-float" style={{ animationDelay: '0.2s' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total XP</p>
                <h3 style={{ color: 'var(--primary)', fontSize: '1.5rem', margin: 0 }}>{userData?.xp || 0}</h3>
              </div>
              <div className="animate-float" style={{ animationDelay: '0.6s' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔥 Streak</p>
                <h3 style={{ color: 'var(--warning)', fontSize: '1.5rem', margin: 0 }}>{userData?.currentStreak || 0} Days</h3>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          {(() => {
            const lData = getLevelData(userData?.xp || 0);
            return (
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{lData.title}</span>
                  {lData.nextLevelTitle ? (
                    <span style={{ color: 'var(--text-secondary)' }}>{lData.xpRemaining} XP to {lData.nextLevelTitle}</span>
                  ) : (
                    <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>Max Level Reached!</span>
                  )}
                </div>
                <div style={{ height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lData.progressPercent}%`, background: 'var(--primary)', transition: 'width 1s ease' }}></div>
                </div>
              </div>
            );
          })()}
        </div>
        
        <h2 style={{ marginBottom: '1.5rem' }}>Your Learning Activities</h2>
        <div className="grid-cards">
          
          <Link to="/image-game" className="glass-card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>🖼️</div>
            <h3 style={{ margin: 0 }}>Image Vocabulary</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Practice vocabulary with engaging images</p>
            <span className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>Play Now</span>
          </Link>
          
          <Link to="/voice-room" className="glass-card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>🎙️</div>
            <h3 style={{ margin: 0 }}>Voice Room</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Converse with peers in real-time</p>
            <span className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>Join Room</span>
          </Link>

          <Link to="/ai-tutor" className="glass-card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>🤖</div>
            <h3 style={{ margin: 0 }}>AI Tutor</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Get personalized feedback from AI</p>
            <span className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>Start Session</span>
          </Link>

          <Link to="/roleplay" className="glass-card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid #c084fc' }}>
            <div style={{ fontSize: '3rem' }}>🎭</div>
            <h3 style={{ margin: 0, background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Roleplay Arena</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Practice real-world voice scenarios</p>
            <span className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', background: 'linear-gradient(to right, #60a5fa, #c084fc)' }}>Enter Arena</span>
          </Link>

          <Link to="/sayit-right" className="glass-card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid #f59e0b' }}>
            <div style={{ fontSize: '3rem' }}>🗣️</div>
            <h3 style={{ margin: 0, background: 'linear-gradient(to right, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SayIt Right</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Translate & Speak the sentence</p>
            <span className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', background: 'linear-gradient(to right, #f59e0b, #ef4444)' }}>Play Game</span>
          </Link>

        </div>
      </div>
    </div>
  );
}
