import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, RefreshCw, Send, CheckCircle, AlertCircle, ArrowLeft, Lightbulb, Languages, Play, Lock } from 'lucide-react';
import { SAY_IT_RIGHT_DATA } from '../data/sayItRightData';
import { getLevelData } from '../utils/progression';
import { getLangCode } from '../utils/langCode';

export default function SayItRight() {
  const { currentUser, userData, theme } = useAuth();
  const navigate = useNavigate();
  const targetLang = userData?.learningLanguage || userData?.targetLanguage || 'Spanish';

  // Navigation State
  const [phase, setPhase] = useState('menu'); // menu, playing, evaluation, summary
  
  // Selection State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Beginner');
  
  // Game State
  const [roundQuestions, setRoundQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoreTotal, setScoreTotal] = useState(0);
  const [roundResults, setRoundResults] = useState([]); // Array of evaluation data
  
  // Active Question State
  const [timeLeft, setTimeLeft] = useState(15);
  const [hintLevel, setHintLevel] = useState(0); // 0: none, 1: word, 2: skeleton
  const [usedTranslate, setUsedTranslate] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  
  // Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  // --- Initialize Speech ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;        // Keep listening until manually stopped
      recognition.interimResults = true;     // Show live partial results
      recognition.maxAlternatives = 3;       // More alternatives = better accuracy
      recognition.lang = getLangCode(targetLang);

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            // Use the highest-confidence alternative
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        // Show confirmed text + live partial text
        setTranscript((finalTranscript + ' ' + interimTranscript).trim());
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
  }, [userData]);

  // --- Timer Logic ---
  useEffect(() => {
    let timer;
    if (phase === 'playing' && timeLeft > 0 && !isListening) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && phase === 'playing') {
      handleTimeUp();
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft, isListening]);

  // --- Game Flow Methods ---
  const startGame = (category) => {
    const questions = SAY_IT_RIGHT_DATA[category][selectedDifficulty];
    if (!questions || questions.length === 0) return alert("No questions found for this category/difficulty.");
    
    // Shuffle and pick 5
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    setRoundQuestions(selected);
    setSelectedCategory(category);
    setCurrentIndex(0);
    setScoreTotal(0);
    setRoundResults([]);
    
    resetQuestionState();
    setPhase('playing');
  };

  const resetQuestionState = () => {
    setTimeLeft(60);
    setHintLevel(0);
    setUsedTranslate(false);
    setTranscript('');
    setEvalResult(null);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= roundQuestions.length) {
      finishGame();
    } else {
      setCurrentIndex(prev => prev + 1);
      resetQuestionState();
      setPhase('playing');
    }
  };

  const handleTimeUp = () => {
    submitAnswer("Time expired");
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const submitAnswer = async (manualTranscript = null) => {
    const spokenText = manualTranscript || transcript;
    if (!spokenText.trim()) return;
    
    setIsEvaluating(true);
    setPhase('evaluation');
    recognitionRef.current?.stop();
    
    const currentQ = roundQuestions[currentIndex];
    
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/ai/sayitright/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userSpokenText: spokenText,
          originalText: currentQ.original,
          targetLang: targetLang
        })
      });
      const data = await res.json();
      
      // Calculate penalty and High-Reward XP
      let baseScore = data.score || 0;
      let finalScore = 0;
      if (baseScore === 10) finalScore = 25; // Perfect
      else if (baseScore >= 5) finalScore = 18; // Partial
      
      if (usedTranslate) finalScore -= 5;
      else if (hintLevel > 0) finalScore -= (hintLevel * 2);
      
      if (finalScore < 0) finalScore = 0;
      if (spokenText === "Time expired") finalScore = 0;

      const resultObj = { ...data, finalScore, spokenText };
      setEvalResult(resultObj);
      setScoreTotal(prev => prev + finalScore);
      setRoundResults(prev => [...prev, resultObj]);
      
      // Read out the perfect sentence
      if (window.speechSynthesis && data.betterSentence) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.betterSentence);
        utterance.lang = getLangCode(targetLang);
        window.speechSynthesis.speak(utterance);
      }
      
    } catch (err) {
      console.error("Evaluation failed", err);
    }
    setIsEvaluating(false);
  };

  const finishGame = async () => {
    setPhase('summary');
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/progress/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ xpToAdd: scoreTotal, minutes: 2, gamesPlayed: 1 })
      });
    } catch(e) {}
  };

  const getHintText = (targetStr) => {
    const words = targetStr.split(' ');
    if (hintLevel === 0) return null;
    if (hintLevel === 1) return `Starts with: "${words[0]}..."`;
    if (hintLevel === 2) {
      // Skeleton: "Word _____ word _____"
      return words.map((w, i) => i % 2 === 0 ? w : '_____').join(' ');
    }
    return targetStr; // Used translation
  };

  // --- Render Sections ---

  if (phase === 'menu') {
    const userLvlData = getLevelData(userData?.xp || 0);

    return (
      <div style={themeStyles[theme].container}>
        <header style={themeStyles[theme].header}>
          <Link to="/dashboard" style={styles.backLink}><ArrowLeft size={16}/> Back to Dashboard</Link>
        </header>
        <div style={{ textAlign: 'center', margin: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '3rem', margin: 0, color: '#f59e0b' }}>SayIt Right 🗣️</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>The Voice Translation Game</p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto', background: theme === 'dark' ? '#1e293b' : '#ffffff', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Select Difficulty</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['Beginner', 'Intermediate'].map(diff => {
                const diffMinLvl = diff === 'Intermediate' ? 3 : 1;
                const isDiffLocked = userLvlData.level < diffMinLvl;
                
                return (
                  <button 
                    key={diff}
                    disabled={isDiffLocked}
                    onClick={() => setSelectedDifficulty(diff)}
                    style={{
                      flex: 1, padding: '1rem', borderRadius: '12px', cursor: isDiffLocked ? 'not-allowed' : 'pointer', fontWeight: 'bold',
                      border: selectedDifficulty === diff ? '2px solid #f59e0b' : `2px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                      background: selectedDifficulty === diff ? '#f59e0b20' : 'transparent',
                      color: selectedDifficulty === diff ? '#f59e0b' : (theme === 'dark' ? 'white' : 'black'),
                      opacity: isDiffLocked ? 0.5 : 1, position: 'relative'
                    }}
                  >
                    {isDiffLocked && <Lock size={14} style={{ position: 'absolute', top: '8px', right: '8px' }} />}
                    {diff}
                    {isDiffLocked && <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '0.25rem' }}>Lvl {diffMinLvl} Required</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem' }}>Choose Scenario</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.keys(SAY_IT_RIGHT_DATA).map(cat => {
                const catMinLvl = cat === 'Shopping' ? 3 : 1;
                const isCatLocked = userLvlData.level < catMinLvl;
                
                return (
                  <button 
                    key={cat}
                    disabled={isCatLocked}
                    onClick={() => startGame(cat)}
                    style={{
                      padding: '1.25rem', borderRadius: '16px', cursor: isCatLocked ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontWeight: 'bold',
                      background: isCatLocked ? (theme === 'dark' ? '#334155' : '#cbd5e1') : '#3b82f6', 
                      color: isCatLocked ? (theme === 'dark' ? '#94a3b8' : '#64748b') : 'white', 
                      border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {cat} {isCatLocked && <span style={{ fontSize: '0.8rem', background: '#f59e0b', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '8px' }}>Lvl {catMinLvl}</span>}
                    </div>
                    {isCatLocked ? <Lock size={20} /> : <Play size={20} fill="white"/>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    const totalFluency = roundResults.reduce((acc, curr) => acc + (curr.fluency || 0), 0) / roundResults.length;
    const totalGrammar = roundResults.reduce((acc, curr) => acc + (curr.grammar || 0), 0) / roundResults.length;
    
    return (
      <div style={themeStyles[theme].container}>
        <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', background: theme === 'dark' ? '#1e293b' : '#ffffff', padding: '3rem', borderRadius: '24px' }}>
          <h1 style={{ color: '#10b981', fontSize: '3rem', margin: '0 0 1rem' }}>Round Complete!</h1>
          
          <div style={styles.scoreCircle}>
            <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#f59e0b' }}>{scoreTotal}</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Total Score</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
            <div style={styles.statBox}>
              <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Avg Fluency</h4>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{totalFluency.toFixed(1)}/10</p>
            </div>
            <div style={styles.statBox}>
              <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Avg Grammar</h4>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{totalGrammar.toFixed(1)}/10</p>
            </div>
          </div>

          <button onClick={() => setPhase('menu')} style={{ ...styles.primaryBtn, width: '100%', fontSize: '1.2rem', padding: '1rem' }}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // --- Playing & Evaluation UI ---
  const currentQ = roundQuestions[currentIndex];
  const expectedStr = currentQ?.expectedTranslation[targetLang] || null;
  const isThinkFirst = timeLeft > 55; // First 5 seconds locked

  return (
    <div style={themeStyles[theme].container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => setPhase('menu')} style={styles.iconBtnText}><ArrowLeft size={16}/> Quit Game</button>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', background: '#3b82f620', color: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '24px' }}>
          Score: {scoreTotal}
        </div>
      </header>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {roundQuestions.map((_, idx) => (
            <div key={idx} style={{ flex: 1, height: '8px', borderRadius: '4px', background: idx < currentIndex ? '#10b981' : idx === currentIndex ? '#3b82f6' : (theme === 'dark' ? '#334155' : '#e2e8f0') }} />
          ))}
        </div>

        <div style={{ background: theme === 'dark' ? '#1e293b' : '#ffffff', padding: '3rem 2rem', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
          
          {phase === 'playing' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
              <div style={{ height: '100%', width: `${(timeLeft/60)*100}%`, background: timeLeft > 5 ? '#3b82f6' : '#ef4444', transition: 'width 1s linear' }} />
            </div>
          )}

          <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8b5cf6', fontWeight: 'bold', marginBottom: '1rem' }}>
            Translate into {targetLang}
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '0 0 2rem', lineHeight: 1.3 }}>"{currentQ?.original}"</h2>

          {phase === 'playing' && (
            <>
              {/* Hint System Area */}
              <div style={{ minHeight: '60px', marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {usedTranslate && expectedStr ? (
                  <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>{expectedStr}</div>
                ) : usedTranslate && !expectedStr ? (
                  <div style={{ color: '#f59e0b', fontSize: '1rem' }}>Translation not pre-loaded for {targetLang}. Speak your best guess!</div>
                ) : hintLevel > 0 && expectedStr ? (
                  <div style={{ color: '#f59e0b', fontSize: '1.2rem', padding: '0.5rem 1rem', background: '#f59e0b20', borderRadius: '8px' }}>
                    Hint: {getHintText(expectedStr)}
                  </div>
                ) : hintLevel > 0 && !expectedStr ? (
                  <div style={{ color: '#f59e0b', fontSize: '1rem' }}>Hints not available for {targetLang} yet. Try your best!</div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>Translate and speak your answer!</div>
                )}
              </div>

              {/* Tools */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                  onClick={() => setHintLevel(prev => Math.min(prev + 1, 2))}
                  disabled={isThinkFirst || usedTranslate || hintLevel >= 2 || !expectedStr}
                  style={{ ...styles.toolBtn, opacity: (isThinkFirst || usedTranslate || hintLevel >= 2 || !expectedStr) ? 0.5 : 1 }}
                >
                  <Lightbulb size={18} /> {isThinkFirst ? 'Think First...' : !expectedStr ? 'No Hints' : 'Hint (-2 pts)'}
                </button>
                <button 
                  onClick={() => setUsedTranslate(true)}
                  disabled={isThinkFirst || usedTranslate || !expectedStr}
                  style={{ ...styles.toolBtn, opacity: (isThinkFirst || usedTranslate || !expectedStr) ? 0.5 : 1 }}
                >
                  <Languages size={18} /> {!expectedStr ? 'No Translation' : 'Translate (-5 pts)'}
                </button>
              </div>

              {/* Voice Input */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', background: isListening ? '#ef4444' : '#3b82f6', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isListening ? '0 0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                }} onClick={toggleListen}>
                  {isListening ? <Mic size={40} color="white" /> : <MicOff size={40} color="white" />}
                </div>
                <div style={{ marginTop: '1.5rem', minHeight: '24px', fontSize: '1.1rem', color: isListening ? '#ef4444' : 'inherit' }}>
                  {isListening ? 'Listening...' : transcript || 'Tap mic to speak'}
                </div>
                {transcript && !isListening && (
                  <button onClick={() => submitAnswer()} style={{ ...styles.primaryBtn, marginTop: '1rem' }}>Submit Answer <Send size={16} style={{marginLeft:'0.5rem', verticalAlign:'middle'}}/></button>
                )}
              </div>
            </>
          )}

          {phase === 'evaluation' && (
            <div className="animate-fade-in">
              {isEvaluating ? (
                <div style={{ padding: '3rem' }}>
                  <RefreshCw size={40} className="spin" color="#3b82f6" style={{ marginBottom: '1rem' }} />
                  <h3>Evaluating meaning & grammar...</h3>
                </div>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>You said:</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>"{evalResult?.spokenText}"</div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: evalResult?.finalScore >= 8 ? '#10b981' : evalResult?.finalScore >= 5 ? '#f59e0b' : '#ef4444' }}>
                      {evalResult?.finalScore}/10
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: evalResult?.isMeaningCorrect ? '#10b98115' : '#ef444415', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', color: evalResult?.isMeaningCorrect ? '#10b981' : '#ef4444', marginBottom: '0.5rem' }}>
                      {evalResult?.isMeaningCorrect ? <CheckCircle size={20}/> : <AlertCircle size={20}/>} 
                      {evalResult?.isMeaningCorrect ? 'Meaning Understood!' : 'Meaning Incorrect'}
                    </div>
                    {evalResult?.mistakes?.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        {evalResult.mistakes.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    )}
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Better way to say it:</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>"{evalResult?.betterSentence}"</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button onClick={() => {
                        if(window.speechSynthesis && evalResult?.betterSentence) {
                          const u = new SpeechSynthesisUtterance(evalResult.betterSentence);
                          u.lang = getLangCode(targetLang);
                          window.speechSynthesis.speak(u);
                        }
                      }} style={styles.toolBtn}>
                      <Play size={18}/> Hear Again
                    </button>
                    <button onClick={nextQuestion} style={styles.primaryBtn}>
                      Next Sentence <ArrowLeft size={16} style={{transform: 'rotate(180deg)', verticalAlign:'middle', marginLeft:'0.5rem'}}/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  backLink: { display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#60a5fa', fontWeight: 'bold' },
  toolBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'transparent', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' },
  primaryBtn: { padding: '1rem 2rem', borderRadius: '24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' },
  iconBtnText: { display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' },
  scoreCircle: { width: '200px', height: '200px', borderRadius: '50%', border: '8px solid #f59e0b20', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '0 auto 2rem' },
  statBox: { padding: '1rem', background: '#f8fafc', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0', color: '#0f172a' }
};

const themeStyles = {
  dark: {
    container: { padding: '2rem', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' },
    header: { marginBottom: '1rem' }
  },
  light: {
    container: { padding: '2rem', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' },
    header: { marginBottom: '1rem' }
  }
};
