import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ImageGame from './pages/ImageGame';
import VoiceRoom from './pages/VoiceRoom';
import AITutor from './pages/AITutor';
import RoleplayArena from './pages/RoleplayArena';
import SayItRight from './pages/SayItRight';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/image-game" element={
          <PrivateRoute>
            <ImageGame />
          </PrivateRoute>
        } />
        
        <Route path="/voice-room" element={
          <PrivateRoute>
            <VoiceRoom />
          </PrivateRoute>
        } />

        <Route path="/ai-tutor" element={
          <PrivateRoute>
            <AITutor />
          </PrivateRoute>
        } />

        <Route path="/roleplay" element={
          <PrivateRoute>
            <RoleplayArena />
          </PrivateRoute>
        } />

        <Route path="/sayit-right" element={
          <PrivateRoute>
            <SayItRight />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
