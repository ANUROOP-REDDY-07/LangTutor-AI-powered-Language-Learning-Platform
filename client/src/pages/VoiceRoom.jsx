import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, MessageSquare, PhoneOff, RefreshCw, CheckCircle, Volume2, Globe, Sparkles, AlertCircle, Languages, Send } from 'lucide-react';
import { getLangCode } from '../utils/langCode';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const TOPICS = [
  "Introduce yourself to your partner.",
  "Order food in a restaurant.",
  "Talk about a hobby you enjoy.",
  "Describe your last vacation."
];

export default function VoiceRoom() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatorOutput, setTranslatorOutput] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Real-time tracking
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  
  // Advanced Features State
  const [challengeMode, setChallengeMode] = useState('Free Talk');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [transcriptLog, setTranscriptLog] = useState([]);
  
  // Subtitles
  const [localSubtitle, setLocalSubtitle] = useState('');
  const [remoteSubtitle, setRemoteSubtitle] = useState('');

  // Gamification & Summary state
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [messagesSentCount, setMessagesSentCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  
  const [currentTopic, setCurrentTopic] = useState(TOPICS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  const { currentUser, userData, theme } = useAuth();
  const navigate = useNavigate();
  
  const remoteAudioRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const audioContextRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const remoteAnalyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const socketRef = useRef(null);

  // Subtitle recognition
  const continuousRecognitionRef = useRef(null);

  // Auto-scroll chat
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    
    const initConnection = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = await currentUser.getIdToken();
      const newSocket = io(backendUrl, { auth: { token } });
      socketRef.current = newSocket;

      newSocket.on('connect', () => setConnected(true));
      newSocket.on('disconnect', () => setConnected(false));
      newSocket.on('waiting-for-match', () => setIsWaiting(true));

      newSocket.on('match-found', async (data) => {
        setIsWaiting(false);
        setRoomId(data.roomId);
        setPartnerData(data.partnerData);
        setSessionStartTime(Date.now());
        setMessagesSentCount(0);
        setMessages([]);
        setTranscriptLog([]);
        
        setupPeerConnection(newSocket, data.roomId);
        startContinuousRecognition(newSocket, data.roomId);
        
        if (data.initiator) {
           try {
             const offer = await peerConnection.current.createOffer();
             await peerConnection.current.setLocalDescription(offer);
             newSocket.emit('offer', { roomId: data.roomId, offer });
           } catch(e) {}
        }
      });

      newSocket.on('offer', async (data) => {
        if (!peerConnection.current) setupPeerConnection(newSocket, data.roomId);
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        newSocket.emit('answer', { roomId: data.roomId, answer });
      });

      newSocket.on('answer', async (data) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      });

      newSocket.on('ice-candidate', async (data) => {
        if (peerConnection.current && data.candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      newSocket.on('receive-message', (data) => {
        setMessages(prev => [...prev, data]);
        setTranscriptLog(prev => [...prev, { role: 'partner', content: data.text }]);
      });
      
      newSocket.on('receive-subtitle', (data) => {
        setRemoteSubtitle(data.text);
      });

      newSocket.on('partner-disconnected', () => {
        endSession();
      });

      setSocket(newSocket);

      // Get Local Audio Media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStream.current = stream;
        setupLocalAudioAnalysis(stream);
        setMicGranted(true);
      } catch (err) {
        console.error("Error accessing audio devices:", err);
      }
    };

    initConnection();

    return () => {
      cleanupSession();
      if (socketRef.current) socketRef.current.close();
    }
  }, [currentUser]);

  const setupLocalAudioAnalysis = (stream) => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    localAnalyserRef.current = analyser;
    monitorAudioVolumes();
  };

  const setupRemoteAudioAnalysis = (stream) => {
    if (!audioContextRef.current) return;
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContextRef.current.destination);
    remoteAnalyserRef.current = analyser;
  };

  const monitorAudioVolumes = () => {
    const checkVolume = () => {
      if (localAnalyserRef.current) {
        const localData = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
        localAnalyserRef.current.getByteFrequencyData(localData);
        const localAvg = localData.reduce((a, b) => a + b) / localData.length;
        setLocalSpeaking(localAvg > 20);
      }
      if (remoteAnalyserRef.current) {
        const remoteData = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
        remoteAnalyserRef.current.getByteFrequencyData(remoteData);
        const remoteAvg = remoteData.reduce((a, b) => a + b) / remoteData.length;
        setRemoteSpeaking(remoteAvg > 20);
      }
      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };
    checkVolume();
  };

  const setupPeerConnection = (currentSocket, currentRoomId) => {
    peerConnection.current = new RTCPeerConnection(ICE_SERVERS);
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, localStream.current);
      });
    }
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) currentSocket.emit('ice-candidate', { roomId: currentRoomId, candidate: event.candidate });
    };
    peerConnection.current.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(e => console.warn(e));
        setupRemoteAudioAnalysis(event.streams[0]);
      }
    };
  };

  const startContinuousRecognition = (currentSocket, currentRoom) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLangCode(userData?.learningLanguage || userData?.targetLanguage);
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          setTranscriptLog(prev => [...prev, { role: 'user', content: event.results[i][0].transcript }]);
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const textToDisplay = finalTranscript || interimTranscript;
      setLocalSubtitle(textToDisplay);
      if (textToDisplay && currentSocket) {
        currentSocket.emit('send-subtitle', { roomId: currentRoom, text: textToDisplay });
      }
      
      if (finalTranscript) {
        setTimeout(() => setLocalSubtitle(''), 3000);
      }
    };
    
    recognition.start();
    continuousRecognitionRef.current = recognition;
  };

  const joinMatchmaking = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (socket) {
      setShowSummary(false);
      socket.emit('join-matchmaking', { userData: { name: currentUser.email.split('@')[0], level: userData?.level, language: userData?.learningLanguage } });
      setIsWaiting(true);
    }
  };

  // Normal Chat Send
  const sendMessage = async () => {
    if (!socket || !roomId || message.trim() === '') return;

    const payloadText = message;
    setMessage('');
    
    const payload = { roomId, text: payloadText, senderId: socket.id };
    socket.emit('send-message', payload);
    
    setMessagesSentCount(prev => prev + 1);
    // Add to local state (partner won't see originalText because it's not in the payload emitted above)
    setMessages(prev => [...prev, { ...payload, isTranslated: false }]);
    setTranscriptLog(prev => [...prev, { role: 'user', content: payloadText }]);
  };

  // Translate Text Only
  const handleTranslate = async () => {
    if (translatorInput.trim() === '' || isTranslating) return;

    const msgDraft = translatorInput;
    setTranslatorInput('');
    setIsTranslating(true);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: msgDraft, nativeLang: userData?.nativeLanguage || 'English', targetLang: userData?.learningLanguage })
      });
      const data = await res.json();
      
      const translatedResult = data.translatedText || msgDraft;
      
      // Do NOT send to chat. Only update local UI state.
      setTranslatorOutput({ original: msgDraft, translated: translatedResult });
      
    } catch (err) {
      console.error("Translation fail", err);
      setTranslatorOutput({ original: msgDraft, translated: "Translation failed." });
    }
    setIsTranslating(false);
  };
  
  const hitSuggestions = async () => {
    setIsProcessingAI(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: "Suggest what to say next based on the topic: " + currentTopic, nativeLang: userData?.nativeLanguage || 'English', targetLang: userData?.learningLanguage })
      });
      const data = await res.json();
      if (data.suggestions) setAiSuggestions(data.suggestions);
    } catch(e) {}
    setIsProcessingAI(false);
  }

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
      setIsMuted(!isMuted);
    }
  };

  const endSession = async () => {
    if (!sessionStartTime) return;
    const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
    
    setIsProcessingAI(true);
    let aiSummary = {};
    try {
      const token = await currentUser.getIdToken();
      
      // Update XP
      await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/progress/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ xpToAdd: (durationMinutes * 5) + (messagesSentCount * 2), minutes: durationMinutes, messages: messagesSentCount })
      });
      
      // Get Review
      const reviewRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/ai/session-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ transcript: transcriptLog, nativeLang: userData?.nativeLanguage || 'English', targetLang: userData?.learningLanguage })
      });
      aiSummary = await reviewRes.json();
    } catch (e) { console.error(e); }
    setIsProcessingAI(false);
    
    setSummaryData({ durationMinutes, messagesSentCount, xpEarned: (durationMinutes * 5) + (messagesSentCount * 2), review: aiSummary });
    setShowSummary(true);
    cleanupPeer();
  };

  const cleanupPeer = () => {
    if (socket && roomId) socket.emit('leave-room', roomId);
    if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
    if (continuousRecognitionRef.current) continuousRecognitionRef.current.stop();
    setRoomId(null); setPartnerData(null); setSessionStartTime(null);
  };

  const cleanupSession = () => {
    cleanupPeer();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (localStream.current) localStream.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
  };

  if (showSummary) {
    return (
      <div style={themeStyles[theme].container}>
        <div style={themeStyles[theme].summaryCard}>
          <h2>Session Review & Transcripts</h2>
          <div style={{display:'flex', gap:'2rem', textAlign:'left'}}>
             <div style={{flex:1}}>
                <div style={styles.xpBox}>
                  <h3>+{summaryData?.xpEarned} XP Earned</h3>
                  <p>Duration: {summaryData?.durationMinutes} min</p>
                </div>
                {summaryData?.review?.fluencyScore && (
                  <div style={{...themeStyles[theme].feedPanel, marginTop:'1rem'}}>
                    <h3>AI Feedback Overview</h3>
                    <p><strong>Fluency:</strong> {summaryData.review.fluencyScore}/100</p>
                    <p><strong>Grammar:</strong> {summaryData.review.grammarAccuracy}/100</p>
                    <p><strong>Tips:</strong> {summaryData.review.improvementTips}</p>
                    <p><strong>New Vocab:</strong> {summaryData.review.vocabularySuggestions?.join(', ')}</p>
                  </div>
                )}
             </div>
             
             <div style={{flex: 1, maxHeight:'400px', overflowY:'auto', background: theme==='dark'?'#0f172a':'#f1f5f9', padding:'1rem', borderRadius:'8px'}}>
               <h3>Session Transcript</h3>
               {transcriptLog.map((log, i) => (
                 <p key={i} style={{color: log.role === 'user' ? '#60a5fa' : '#a0a0b0', margin:'0.5rem 0'}}>
                   <strong>{log.role === 'user' ? 'You' : 'Partner'}:</strong> {log.content}
                 </p>
               ))}
               {transcriptLog.length === 0 && <p>No speech detected during session.</p>}
             </div>
          </div>
          
          <div style={{marginTop:'2rem'}}>
             <button onClick={() => navigate('/dashboard')} style={styles.primaryBtn}>Return to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={themeStyles[theme].container}>
      <header style={themeStyles[theme].header}>
        <Link to="/dashboard" style={{textDecoration: 'none', color: '#60a5fa', fontWeight: 'bold'}}>&larr; Back to Dashboard</Link>
        <span style={{ color: connected ? '#4ade80' : '#ef4444', fontWeight: 'bold' }}>
          {connected ? '● Connected' : '● Disconnected'}
        </span>
      </header>
      
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {!roomId ? (
        <div style={themeStyles[theme].matchmakingPane}>
          <h1 style={{fontSize:'2.5rem', marginBottom:'1rem'}}>Practice Environments</h1>
          
          <div style={{display:'flex', gap:'1rem', marginBottom:'2rem'}}>
             {['Free Talk', 'Vocabulary', 'Rapid Fire Questions'].map(mode => (
               <button 
                 key={mode} 
                 onClick={() => setChallengeMode(mode)}
                 style={{
                   padding: '1rem', borderRadius: '12px', border: challengeMode === mode ? '2px solid #60a5fa' : '2px solid #334155',
                   background: theme==='dark'?'#1e293b':'#ffffff', color: theme==='dark'?'#fff':'#000', cursor:'pointer'
                 }}
               >
                 {mode}
               </button>
             ))}
          </div>

          <div style={styles.pulseContainer}>
            {isWaiting && <div className="pulse-ring"></div>}
            <Mic size={48} color={isWaiting ? "#60a5fa" : "#555"} />
          </div>
          <button 
            onClick={joinMatchmaking} 
            disabled={isWaiting || !micGranted}
            style={isWaiting || !micGranted ? {...styles.primaryBtn, opacity: 0.7, cursor: isWaiting ? 'wait' : 'not-allowed'} : styles.primaryBtn}
          >
            {isWaiting ? 'Finding a partner...' : (!micGranted ? 'Waiting for Mic...' : 'Start Matchmaking')}
          </button>
        </div>
      ) : (
        <div style={themeStyles[theme].activeSessionGrid}>
          
          {/* Left Column: Video/Audio Cards */}
          <div style={styles.cardsColumn}>
             <div style={{...themeStyles[theme].panel, padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
               <h3 style={{margin:0, color:'#60a5fa'}}>Mode: {challengeMode}</h3>
               {isProcessingAI && <span style={{fontSize:'0.8rem', color:'#f59e0b'}}><RefreshCw size={12} className="spin" /> AI THINKING</span>}
             </div>

            {/* User Card */}
            <div style={localSpeaking ? {...themeStyles[theme].userCard, ...styles.speakingGlow} : themeStyles[theme].userCard}>
              <div style={styles.avatar}>You</div>
              <h3>{currentUser.email.split('@')[0]}</h3>
              {isMuted && <MicOff color="#ef4444" style={styles.muteIcon}/>}
              {localSpeaking && <Volume2 color="#4ade80" style={styles.speakingIcon}/>}
              
              {/* LIVE TITLE */}
              {localSubtitle && (
                 <div style={styles.subtitleBox}>{localSubtitle}</div>
              )}
            </div>

            {/* Partner Card */}
            <div style={remoteSpeaking ? {...themeStyles[theme].userCard, ...styles.speakingGlow} : themeStyles[theme].userCard}>
              <div style={styles.avatarP}>{partnerData?.name?.[0]?.toUpperCase() || 'P'}</div>
              <h3>{partnerData?.name || 'Partner'}</h3>
              {remoteSpeaking && <Volume2 color="#4ade80" style={styles.speakingIcon}/>}
              
               {/* LIVE TITLE */}
               {remoteSubtitle && (
                 <div style={styles.subtitleBoxRemote}>{remoteSubtitle}</div>
              )}
            </div>

            <div style={themeStyles[theme].controls}>
              <button onClick={toggleMute} style={isMuted ? {...styles.iconBtn, backgroundColor: '#ef4444'} : styles.iconBtn}>
                {isMuted ? <MicOff /> : <Mic />}
              </button>
              <button onClick={endSession} style={{...styles.iconBtn, backgroundColor: '#ef4444', color: 'white'}}>
                <PhoneOff />
              </button>
            </div>
          </div>

          {/* Right Area: Split into Chat (Left) and Translator (Right) */}
          <div style={{ display: 'flex', gap: '1rem', flex: 2, minWidth: '0' }}>
            
            {/* Main Chat Column */}
            <div style={{...themeStyles[theme].chatColumn, display:'flex', flexDirection:'column', flex: 1, minWidth: '0'}}>
              <div style={themeStyles[theme].chatHeader}>
                <MessageSquare size={20} />
                <h3 style={{margin: 0, marginLeft: '0.5rem'}}>Smart Chat</h3>
              </div>
              
              <div style={themeStyles[theme].chatHistory}>
                {messages.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', marginTop: '50%' }}>Chat history will appear here.</p>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === socket?.id;
                    return (
                      <div key={idx} style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        backgroundColor: isMe ? '#2563eb' : (theme === 'dark' ? '#334155' : '#e2e8f0'),
                        color: isMe || theme === 'dark' ? 'white' : 'black',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        borderBottomRightRadius: isMe ? '0px' : '12px',
                        borderBottomLeftRadius: !isMe ? '0px' : '12px',
                        maxWidth: '85%'
                      }}>
                        <div style={{fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.2rem'}}>{isMe ? 'You' : 'Partner'}</div>
                        <div style={{fontWeight: 'bold'}}>{msg.text}</div>
                        {msg.isTranslated && isMe && (
                          <div style={{fontSize: '0.85rem', opacity: 0.6, borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:'0.5rem', paddingTop:'0.2rem'}}>
                            Original: {msg.originalText}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions Panel */}
              {aiSuggestions.length > 0 && (
                 <div style={{padding:'0.5rem 1rem', background:theme==='dark'?'#0f172a':'#f8fafc'}}>
                   <p style={{fontSize:'0.8rem', color:'#60a5fa', margin:'0 0 0.5rem 0'}}><Sparkles size={12}/> AI Suggestions:</p>
                   <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                      {aiSuggestions.map((sug,i) => (
                        <button key={i} onClick={() => setMessage(sug)} style={{padding:'0.4rem 0.8rem', borderRadius:'20px', background:'#334155', color:'#fff', border:'none', cursor:'pointer', fontSize:'0.85rem'}}>{sug}</button>
                      ))}
                   </div>
                 </div>
              )}

              <div style={themeStyles[theme].chatInputArea}>
                <button onClick={hitSuggestions} title="Get suggestions" style={{padding:'0.75rem', borderRadius:'50%', border:'none', background:'#334155', color:'#fff', cursor:'pointer'}}><Sparkles size={16} /></button>
                <input 
                  type="text" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  style={themeStyles[theme].chatInput} 
                  placeholder={"Type a message..."}
                />
                <button onClick={sendMessage} style={styles.chatSendBtn}>Send</button>
              </div>
            </div>

            {/* Translator Dedicated Panel */}
            <div style={{...themeStyles[theme].chatColumn, display:'flex', flexDirection:'column', width: '300px', flexShrink: 0}}>
              <div style={{...themeStyles[theme].chatHeader, backgroundColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', borderTopLeftRadius: '16px', borderTopRightRadius: '16px'}}>
                <Languages size={20} color="#4ade80" />
                <h3 style={{margin: 0, marginLeft: '0.5rem'}}>Translator</h3>
              </div>
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#94a3b8' : '#64748b', margin: 0 }}>
                  Type in <strong>{userData?.nativeLanguage || 'English'}</strong>. It will be translated to <strong>{userData?.learningLanguage || 'Target'}</strong> and sent to the chat.
                </p>
                
                <textarea 
                  value={translatorInput}
                  onChange={(e) => setTranslatorInput(e.target.value)}
                  placeholder={`Type your message in ${userData?.nativeLanguage || 'English'}...`}
                  style={{
                    flex: 1,
                    resize: 'none',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #cbd5e1',
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    marginBottom: translatorOutput ? '0' : 'auto'
                  }}
                />

                {translatorOutput && (
                  <div style={{
                    padding: '1rem', 
                    borderRadius: '12px', 
                    backgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                    color: theme === 'dark' ? 'white' : 'black',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.2rem'}}>Original:</div>
                    <div style={{marginBottom: '0.5rem'}}>{translatorOutput.original}</div>
                    <div style={{fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.2rem'}}>Translated:</div>
                    <div style={{fontWeight: 'bold', color: '#4ade80'}}>{translatorOutput.translated}</div>
                  </div>
                )}
                
                <button 
                  onClick={handleTranslate}
                  disabled={isTranslating || !translatorInput.trim()}
                  style={{
                    ...styles.primaryBtn,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: (isTranslating || !translatorInput.trim()) ? 0.6 : 1,
                    cursor: (isTranslating || !translatorInput.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isTranslating ? <><RefreshCw size={18} className="spin" /> Translating...</> : <><Globe size={18} /> Translate</>}
                </button>
              </div>
            </div>

          </div>
          
        </div>
      )}
    </div>
  );
}

const styles = {
  pulseContainer: { position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' },
  cardsColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '320px', flexShrink: 0 },
  speakingGlow: { border: '2px solid #4ade80', boxShadow: '0 0 15px rgba(74, 222, 128, 0.5)' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color:'white' },
  avatarP: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color:'white' },
  muteIcon: { position: 'absolute', left: '20px', top: '20px' },
  speakingIcon: { position: 'absolute', right: '20px', top: '20px' },
  iconBtn: { width: '50px', height: '50px', borderRadius: '50%', border: 'none', backgroundColor: '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  chatSendBtn: { padding: '0.75rem 1.5rem', borderRadius: '24px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
  primaryBtn: { padding: '1rem 2rem', borderRadius: '30px', backgroundColor: '#2563eb', color: 'white', border: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' },
  subtitleBox: { background:'rgba(0,0,0,0.7)', borderRadius:'8px', padding:'0.5rem 1rem', color:'white', fontSize:'0.9rem', marginTop:'1rem', fontStyle:'italic' },
  subtitleBoxRemote: { background:'rgba(0,0,0,0.7)', borderRadius:'8px', padding:'0.5rem 1rem', color:'#4ade80', fontSize:'0.9rem', marginTop:'1rem', fontStyle:'italic' },
  xpBox: { margin: '1rem 0', padding: '1.5rem', backgroundColor: '#10b98120', border: '2px dashed #10b981', borderRadius: '16px', color: '#10b981', textAlign:'center' }
};

const themeStyles = {
  dark: {
    container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: '#f8fafc' },
    header: { display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #334155' },
    matchmakingPane: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    activeSessionGrid: { display: 'flex', gap: '1.5rem', flex: 1, flexDirection: 'row', '@media(max-width: 1024px)':{flexDirection:'column'} },
    panel: { backgroundColor: '#1e293b', borderRadius: '16px' },
    userCard: { position: 'relative', backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s ease', border: '2px solid transparent' },
    controls: { display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '16px' },
    chatColumn: { backgroundColor: '#1e293b', borderRadius: '16px', minHeight: '500px' },
    chatHeader: { padding: '1rem 1.5rem', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', borderBottom: '1px solid #334155', borderTopLeftRadius:'16px', borderTopRightRadius:'16px' },
    chatHistory: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
    chatInputArea: { padding: '1rem', display: 'flex', gap: '0.5rem', backgroundColor: '#0f172a', borderTop: '1px solid #334155', borderBottomLeftRadius:'16px', borderBottomRightRadius:'16px' },
    chatInput: { flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: 'none', backgroundColor: '#334155', color: 'white', outline: 'none' },
    summaryCard: { backgroundColor: '#1e293b', padding: '3rem', borderRadius: '20px', width: '100%', maxWidth: '900px', margin: 'auto' },
    feedPanel: { background: '#0f172a', padding:'1.5rem', borderRadius: '12px' }
  },
  light: {
    container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#0f172a' },
    header: { display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #cbd5e1' },
    matchmakingPane: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    activeSessionGrid: { display: 'flex', gap: '1.5rem', flex: 1, flexDirection: 'row' },
    panel: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' },
    userCard: { position: 'relative', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s ease', border: '1px solid #e2e8f0' },
    controls: { display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' },
    chatColumn: { backgroundColor: '#ffffff', borderRadius: '16px', minHeight: '500px', border: '1px solid #e2e8f0' },
    chatHeader: { padding: '1rem 1.5rem', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', borderTopLeftRadius:'16px', borderTopRightRadius:'16px' },
    chatHistory: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
    chatInputArea: { padding: '1rem', display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius:'16px', borderBottomRightRadius:'16px' },
    chatInput: { flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#000', outline: 'none' },
    summaryCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '3rem', borderRadius: '20px', width: '100%', maxWidth: '900px', margin: 'auto' },
    feedPanel: { background: '#f1f5f9', padding:'1.5rem', borderRadius: '12px' }
  }
};
