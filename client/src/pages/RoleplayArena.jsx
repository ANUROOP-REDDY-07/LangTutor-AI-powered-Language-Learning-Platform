import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, RefreshCw, Send, Star, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { getLevelData } from '../utils/progression';
import { getLangCode } from '../utils/langCode';

const SCENARIOS = [
  {
    id: 'coffee_shop',
    category: 'Daily Life',
    icon: '☕',
    title: 'Coffee Shop',
    description: 'Order your favorite drink and chat with the barista.',
    aiRole: 'Barista',
    userRole: 'Customer',
    context: 'You are a barista in a busy coffee shop. The user is a customer ordering a drink.',
    minLevel: 1
  },
  {
    id: 'restaurant',
    category: 'Daily Life',
    icon: '🍽️',
    title: 'Restaurant',
    description: 'Order food, ask about the menu, and pay the bill.',
    aiRole: 'Waiter',
    userRole: 'Diner',
    context: 'You are a waiter at a nice restaurant. The user is a diner. You should welcome them and ask for their order.',
    minLevel: 1
  },
  {
    id: 'airport',
    category: 'Travel',
    icon: '✈️',
    title: 'Airport Check-in',
    description: 'Check in your luggage and get your boarding pass.',
    aiRole: 'Check-in Agent',
    userRole: 'Traveler',
    context: 'You are an airport check-in agent. The user is a traveler. Ask for their passport and ticket.',
    minLevel: 1
  },
  {
    id: 'directions',
    category: 'Travel',
    icon: '🗺️',
    title: 'Asking for Directions',
    description: 'You are lost in a new city and need help finding the train station.',
    aiRole: 'Friendly Local',
    userRole: 'Lost Tourist',
    context: 'You are a friendly local walking down the street. The user is a tourist asking you for directions to the train station.',
    minLevel: 1
  },
  {
    id: 'job_interview',
    category: 'Professional',
    icon: '💼',
    title: 'Job Interview',
    description: 'Interview for a new position at a tech company.',
    aiRole: 'Interviewer',
    userRole: 'Candidate',
    context: 'You are a hiring manager conducting a job interview. The user is the candidate applying for a software engineering role.',
    minLevel: 5
  },
  {
    id: 'hospital',
    category: 'Emergency',
    icon: '🚑',
    title: 'Hospital Visit',
    description: 'Describe your symptoms to the doctor.',
    aiRole: 'Doctor',
    userRole: 'Patient',
    context: 'You are a doctor in a clinic. The user is a patient who has come in feeling unwell. Ask about their symptoms.',
    minLevel: 1
  },
  {
    id: 'office_meeting',
    category: 'Professional',
    icon: '📊',
    title: 'Office Meeting',
    description: 'Pitch a new idea to your strict manager.',
    aiRole: 'Manager',
    userRole: 'Employee',
    context: 'You are a strict office manager. The user is an employee pitching a new idea. You should ask tough questions.',
    minLevel: 6
  }
];

export default function RoleplayArena() {
  const { currentUser, userData, theme } = useAuth();
  const navigate = useNavigate();
  const targetLang = userData?.learningLanguage || userData?.targetLanguage || 'Spanish';

  const [phase, setPhase] = useState('selection'); // selection, playing, summary
  const [selectedScenario, setSelectedScenario] = useState(null);
  
  // Game State
  const [messages, setMessages] = useState([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const maxTurns = 6; // Total interactions before ending
  
  // Learning Toggles
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessingAI]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.lang = getLangCode(targetLang);

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        setTranscript((finalTranscript + ' ' + interimTranscript).trim());
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [userData]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const startGame = async (scenario) => {
    setSelectedScenario(scenario);
    setPhase('playing');
    setMessages([]);
    setTurnCount(0);
    setTranscript('');
    
    // Auto-start AI greeting
    setIsProcessingAI(true);
    await triggerAI(scenario, []);
  };

  const triggerAI = async (scenario, currentMessages) => {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/ai/roleplay/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          scenarioContext: scenario.context,
          messages: currentMessages,
          nativeLang: userData?.nativeLanguage || 'English',
          targetLang: targetLang
        })
      });
      const data = await res.json();
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.lang = getLangCode(targetLang);
        window.speechSynthesis.speak(utterance);
      }
      
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.reply,
        translation: data.translation,
        hint: data.hint
      }]);
    } catch (error) {
      console.error("Failed AI Response", error);
    }
    setIsProcessingAI(false);
  };

  const handleSend = async () => {
    if (!transcript.trim()) return;
    
    const userMsg = transcript;
    setTranscript('');
    
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    
    if (newTurn >= maxTurns) {
      endGame(newMessages);
    } else {
      setIsProcessingAI(true);
      await triggerAI(selectedScenario, newMessages);
    }
  };

  const endGame = async (finalMessages) => {
    setPhase('summary');
    setIsProcessingAI(true);
    
    try {
      const token = await currentUser.getIdToken();
      
      // Update XP based on Gamification System
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/progress/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ xpToAdd: 30, minutes: 2, gamesPlayed: 1 })
      });
      
      // Get AI Review
      const reviewRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/ai/session-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          transcript: finalMessages, 
          nativeLang: userData?.nativeLanguage || 'English', 
          targetLang: targetLang
        })
      });
      
      const reviewData = await reviewRes.json();
      setSummaryData({ ...reviewData, xpEarned: 30 });
      
    } catch (err) {
      console.error("Failed to generate summary", err);
    }
    setIsProcessingAI(false);
  };

  // ---------------- Render Phases ----------------

  if (phase === 'selection') {
    return (
      <div style={themeStyles[theme].container}>
        <header style={themeStyles[theme].header}>
          <Link to="/dashboard" style={styles.backLink}><ArrowLeft size={16}/> Back to Dashboard</Link>
        </header>
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Roleplay Arena</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Immerse yourself in real-life voice conversations.</p>
        </div>
        
        <div style={styles.gridContainer}>
          {SCENARIOS.map(sc => {
            const userLvlData = getLevelData(userData?.xp || 0);
            const isLocked = userLvlData.level < sc.minLevel;
            
            return (
              <div key={sc.id} style={{ ...themeStyles[theme].scenarioCard, position: 'relative', opacity: isLocked ? 0.8 : 1 }} onClick={() => !isLocked && startGame(sc)}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{sc.icon}</div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b5cf6', fontWeight: 'bold' }}>{sc.category}</span>
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.25rem' }}>{sc.title}</h3>
                <p style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>{sc.description}</p>
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>AI:</strong> {sc.aiRole}</span>
                  <span><strong>You:</strong> {sc.userRole}</span>
                </div>
                
                {isLocked && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(248, 250, 252, 0.85)', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1.5rem', backdropFilter: 'blur(2px)' }}>
                    <Lock size={32} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>🔓 Almost there!</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Reach Level {sc.minLevel} to unlock.</p>
                    {/* Calculate missing XP for that specific level if we want, but keeping it simple */}
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Keep playing to earn XP!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <div style={themeStyles[theme].container}>
        <div style={themeStyles[theme].summaryWrapper}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Arena Completed! 🎉</h1>
          
          {isProcessingAI ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <RefreshCw className="spin" size={48} color="#60a5fa" style={{ marginBottom: '1rem' }}/>
              <h3>AI is analyzing your performance...</h3>
            </div>
          ) : (
            <>
              <div style={styles.xpBox}>
                <h2 style={{ margin: 0, color: '#10b981' }}>+{summaryData?.xpEarned || 20} XP</h2>
                <p style={{ margin: '0.5rem 0 0' }}>Roleplay Mastery</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <div style={themeStyles[theme].statBox}>
                  <h4>Fluency</h4>
                  <div style={styles.score}>{summaryData?.fluencyScore || '--'}/100</div>
                </div>
                <div style={themeStyles[theme].statBox}>
                  <h4>Grammar</h4>
                  <div style={styles.score}>{summaryData?.grammarAccuracy || '--'}/100</div>
                </div>
              </div>

              <div style={themeStyles[theme].feedbackPanel}>
                <h3><Star size={20} color="#f59e0b" style={{verticalAlign:'middle', marginRight:'0.5rem'}}/> Teacher's Notes</h3>
                <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{summaryData?.improvementTips}</p>
                {summaryData?.vocabularySuggestions?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>New Vocabulary to Learn: </strong>
                    {summaryData.vocabularySuggestions.join(', ')}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={() => setPhase('selection')} style={styles.secondaryBtn}>Play Another</button>
                <button onClick={() => navigate('/dashboard')} style={styles.primaryBtn}>Finish</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Playing Phase
  const progressPercent = (turnCount / maxTurns) * 100;
  const currentHint = messages.length > 0 && messages[messages.length - 1].role === 'ai' ? messages[messages.length - 1].hint : null;

  return (
    <div style={{ ...themeStyles[theme].container, padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={themeStyles[theme].playHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => setPhase('selection')} style={styles.iconBtnText}><ArrowLeft size={16}/> Quit</button>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{selectedScenario?.title}</span>
            <span style={{ background: '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem' }}>
              Turn {turnCount}/{maxTurns}
            </span>
          </div>
        </div>
        
        <div style={{ height: '8px', background: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#4ade80', width: `${progressPercent}%`, transition: 'width 0.5s ease' }}></div>
        </div>
      </div>

      {/* Toggles */}
      <div style={{ padding: '0.5rem 1.5rem', background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} />
          Show Translation
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={showHint} onChange={(e) => setShowHint(e.target.checked)} />
          Show Hints
        </label>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
        {messages.map((msg, idx) => {
          const isAI = msg.role === 'ai';
          return (
            <div key={idx} style={{ alignSelf: isAI ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem', textAlign: isAI ? 'left' : 'right' }}>
                {isAI ? selectedScenario?.aiRole : 'You'}
              </div>
              <div style={{
                background: isAI ? (theme === 'dark' ? '#1e293b' : '#ffffff') : '#3b82f6',
                color: isAI ? (theme === 'dark' ? '#ffffff' : '#000000') : '#ffffff',
                padding: '1rem 1.5rem',
                borderRadius: '16px',
                borderBottomLeftRadius: isAI ? 0 : '16px',
                borderBottomRightRadius: !isAI ? 0 : '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: isAI ? `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` : 'none'
              }}>
                <div style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>{msg.content}</div>
                {isAI && showTranslation && msg.translation && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, fontSize: '0.9rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                    {msg.translation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isProcessingAI && (
          <div style={{ alignSelf: 'flex-start', padding: '1rem', background: theme === 'dark' ? '#1e293b' : '#ffffff', borderRadius: '16px', borderBottomLeftRadius: 0 }}>
            <RefreshCw className="spin" size={20} color="#64748b" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Smart Hint Bar */}
      {showHint && currentHint && !isProcessingAI && (
        <div style={{ padding: '0.75rem 1.5rem', background: '#fef3c7', color: '#92400e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={16} /> <strong>Hint:</strong> Try saying: "{currentHint}"
        </div>
      )}

      {/* Voice Input Area */}
      <div style={{ padding: '1.5rem', background: theme === 'dark' ? '#1e293b' : '#ffffff', borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {isListening && (
              <div style={{ fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', animation: 'pulse 1.5s infinite' }}>
                <Mic size={14} /> Listening...
              </div>
            )}
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Tap the mic and speak, or type your response..."
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: theme === 'dark' ? '1px solid #334155' : '1px solid #cbd5e1',
                background: theme === 'dark' ? '#0f172a' : '#f8fafc',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                resize: 'none',
                height: '80px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={toggleListen}
              style={{
                ...styles.iconBtn,
                background: isListening ? '#ef4444' : (theme === 'dark' ? '#334155' : '#e2e8f0'),
                color: isListening ? 'white' : (theme === 'dark' ? '#94a3b8' : '#64748b')
              }}
            >
              {isListening ? <Mic size={24}/> : <MicOff size={24}/>}
            </button>
            <button 
              onClick={handleSend}
              disabled={!transcript.trim() || isProcessingAI}
              style={{
                ...styles.iconBtn,
                background: (!transcript.trim() || isProcessingAI) ? '#64748b' : '#3b82f6',
                color: 'white',
                cursor: (!transcript.trim() || isProcessingAI) ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backLink: { display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#60a5fa', fontWeight: 'bold' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', margin: '0 auto' },
  xpBox: { padding: '2rem', backgroundColor: '#10b98115', border: '2px dashed #10b981', borderRadius: '16px', textAlign: 'center', marginBottom: '2rem' },
  statBox: { flex: 1, minWidth: '120px', padding: '1.5rem', background: '#3b82f615', borderRadius: '12px', textAlign: 'center', border: '1px solid #3b82f630' },
  score: { fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.5rem' },
  primaryBtn: { padding: '0.75rem 2rem', borderRadius: '24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  secondaryBtn: { padding: '0.75rem 2rem', borderRadius: '24px', backgroundColor: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  iconBtn: { width: '56px', height: '56px', borderRadius: '16px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  iconBtnText: { display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }
};

const themeStyles = {
  dark: {
    container: { padding: '2rem', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' },
    header: { marginBottom: '1rem' },
    scenarioCard: { backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', border: '1px solid #334155' },
    playHeader: { padding: '1.5rem', background: '#1e293b', borderBottom: '1px solid #334155' },
    summaryWrapper: { maxWidth: '800px', margin: '0 auto', background: '#1e293b', padding: '3rem', borderRadius: '24px', border: '1px solid #334155' },
    feedbackPanel: { background: '#0f172a', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155' }
  },
  light: {
    container: { padding: '2rem', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' },
    header: { marginBottom: '1rem' },
    scenarioCard: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    playHeader: { padding: '1.5rem', background: '#ffffff', borderBottom: '1px solid #cbd5e1' },
    summaryWrapper: { maxWidth: '800px', margin: '0 auto', background: '#ffffff', padding: '3rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
    feedbackPanel: { background: '#f1f5f9', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }
  }
};
