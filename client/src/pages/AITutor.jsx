import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SUGGESTION_POOL = [
  "How do I order food in ${targetLang}?",
  "Can you help me practice greeting someone?",
  "What are some common travel phrases in ${targetLang}?",
  "I have a doubt. Can you explain the past tense to me using ${nativeLang}?",
  "How do I ask for directions to the train station?",
  "What is the best way to say goodbye in ${targetLang}?",
  "Let's practice a conversation about buying clothes.",
  "How do you conjugate basic verbs in ${targetLang}?",
  "Can you give me a quiz on basic vocabulary?",
  "Tell me a short story in ${targetLang}!",
  "Explain the difference between formal and informal speech.",
  "Let's roleplay! You are a barista and I am ordering coffee.",
  "How do I apologize politely in ${targetLang}?",
  "What are some good idioms to know in ${targetLang}?",
  "Teach me how to express my hobbies."
];

export default function AITutor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { userData, theme } = useAuth(); // FIXED: Imported useAuth and useAuth() instead of useUser
  const nativeLang = userData?.nativeLanguage || 'English';
  const targetLang = userData?.learningLanguage || userData?.targetLanguage || 'Spanish';
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize and Refresh Suggestions
  const refreshSuggestions = () => {
    const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(shuffled.slice(0, 4));
  };

  const langMap = {
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Japanese': 'ja-JP',
    'English': 'en-US'
  };

  useEffect(() => {
    refreshSuggestions();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = langMap[targetLang] || 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setTimeout(() => handleSend(transcript), 300);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [targetLang]); 

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const speakText = (text, lang) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = langMap[lang] || 'en-US'; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSuggestionClick = (promptTemplate) => {
    const textToSend = promptTemplate.replace('${targetLang}', targetLang).replace('${nativeLang}', nativeLang);
    handleSend(textToSend);
    
    setCurrentSuggestions(prev => {
      const remainingPool = SUGGESTION_POOL.filter(p => !prev.includes(p));
      const newSuggestion = remainingPool[Math.floor(Math.random() * remainingPool.length)];
      return prev.map(p => p === promptTemplate ? newSuggestion : p);
    });
  };

  const handleSend = async (textOverride) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : input;
    if (!textToSend.trim() || isLoading) return;
    
    const msgId = Date.now();
    const userMessage = { id: msgId, role: 'user', content: textToSend };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          nativeLang,
          targetLang
        })
      });
      
      const data = await response.json();
      if (data.reply) {
        setMessages(prev => {
          const stateCopy = [...prev];
          const userIdx = stateCopy.findIndex(m => m.id === msgId);
          if (userIdx > -1 && data.userTranslation) {
            stateCopy[userIdx].translation = data.userTranslation;
          }
          return [...stateCopy, { role: 'ai', content: data.reply, translation: data.nativeLangTranslation }];
        });
        speakText(data.reply, targetLang);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No reply from server');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err.message || 'Cannot connect to brain.'}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <Link to="/dashboard" style={{ fontWeight: 'bold' }}>&larr; Back to Dashboard</Link>
        <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '1.5rem', borderRadius: '2rem' }}>
          <div><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Native:</span> <strong>{nativeLang}</strong></div>
          <div><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Learning:</span> <strong style={{ color: 'var(--primary)' }}>{targetLang}</strong></div>
        </div>
      </header>

      <div style={{ marginBottom: '2rem' }}>
        <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Two-Way AI Voice Tutor</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Speak clearly into your microphone to practice! Ask in {nativeLang} and the AI will explain bilingually.</p>
      </div>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 60%' }}>
          <div className="glass-card" style={{ height: '500px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', scrollBehavior: 'smooth' }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
                <h3>Start speaking or typing to practice!</h3>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  padding: '1rem 1.25rem', 
                  borderRadius: '1rem',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '1rem',
                  borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '1rem',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-color)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  maxWidth: '85%',
                  boxShadow: 'var(--shadow-sm)',
                  border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none'
                 }}>
                  <div style={{ fontWeight: '500', fontSize: '1.05rem', marginBottom: msg.translation ? '0.5rem' : '0' }}>
                    {msg.content}
                  </div>
                  {msg.translation && (
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, borderTop: msg.role === 'user' ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      {msg.translation}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                 <div style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--surface-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                   <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Thinking...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={toggleListening}
              className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
              style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, fontSize: '1.2rem', boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none' }}
              title={isListening ? "Stop Listening" : "Start Speaking"}
            >
              🎤
            </button>
            <input 
              type="text" 
              className="input-field"
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={isLoading || !input.trim()} 
              className="btn btn-primary"
            >
              Send
            </button>
            <button 
              onClick={() => window.speechSynthesis.cancel()} 
              className="btn btn-secondary"
              title="Stop Audio"
            >
              Stop 🔇
            </button>
          </div>
        </div>
        
        <div style={{ flex: '1 1 30%', minWidth: '300px' }}>
          <div className="glass-card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Suggested Prompts</h3>
              <button onClick={refreshSuggestions} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                🔄
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentSuggestions.map((promptTemplate, idx) => {
                const displayString = promptTemplate.replace('${targetLang}', targetLang).replace('${nativeLang}', nativeLang);
                return (
                  <button 
                    key={idx}
                    onClick={() => handleSuggestionClick(promptTemplate)}
                    disabled={isLoading}
                    className="btn btn-secondary animate-fade-in"
                    style={{
                      padding: '1rem',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      height: 'auto',
                      lineHeight: '1.4',
                      fontWeight: 'normal',
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    {displayString}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
