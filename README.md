# 🌍 LangTutor: AI-Powered Language Learning Platform

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Groq](https://img.shields.io/badge/Groq_Cloud-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)

**LangTutor** is a state-of-the-art, full-stack web application designed to revolutionize how people learn languages through immersive AI interaction, gamified practice, and real-time social learning.

---

## 🚀 Key Features

### 🎮 Gamified Learning Modules
*   **SayIt Right**: A voice-based translation game. Listen to a sentence in your native language, speak the translation, and get instant AI feedback on meaning, grammar, and fluency.
*   **Roleplay Arena**: Step into real-world scenarios (Job Interview, Hotel Check-in, Coffee Shop) and converse with AI characters powered by Llama 3.3.
*   **Image Quiz**: Practice vocabulary with dynamic image-based challenges.

### 🏆 XP & Progression System
*   **High-Reward Gamification**: Earn XP for every activity.
*   **8-Level Journey**: Progress from **Beginner** to **Expert**.
*   **Motivational Soft-Locks**: Advanced content unlocks as you level up, keeping you motivated and focused.

### 🎙️ Social & Real-time Interaction
*   **Voice Rooms**: Match with other learners worldwide for real-time voice practice.
*   **AI Chat Assistant**: Get instant translations, grammar corrections, and "what to say next" suggestions during live conversations.

### 🌐 Multi-Language Support
*   Native support for **German, Spanish, French, Italian, Japanese,** and more.
*   Intelligent locale mapping for both Speech-to-Text and Text-to-Speech.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Framer Motion (Animations), Lucide React (Icons).
*   **Backend**: Node.js, Express, Socket.io (Signaling).
*   **AI Engine**: Groq Cloud SDK (Llama-3.3-70b-versatile).
*   **Database & Auth**: Firebase (Authentication, Firestore).
*   **Communication**: WebRTC for peer-to-peer voice rooms.

---

## 📦 Project Structure

```text
├── client/              # React frontend (Vite)
│   ├── src/pages/       # Core game and UI components
│   ├── src/utils/       # Progression and language logic
│   └── src/context/     # Auth and User state management
├── server/              # Node.js Express server
│   ├── routes/ai.js     # AI evaluation and chat logic
│   └── index.js         # Socket.io signaling and server config
└── package.json         # Root scripts for project management
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
*   Node.js (v18+)
*   A Firebase Project
*   A Groq Cloud API Key

### 2. Environment Configuration
Create `.env` files based on the `.env.example` templates provided:

**In `/client/.env`**:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_BACKEND_URL=http://localhost:5000
```

**In `/server/.env`**:
```env
GROQ_API_KEY=...
FIREBASE_PROJECT_ID=...
FRONTEND_URL=http://localhost:5173
```

### 3. Installation & Run
From the root directory:
```bash
# Install all dependencies
npm run install:all

# Run development mode (Client + Server)
npm run dev
```

---

## ⚖️ License
Distributed under the ISC License. See `LICENSE` for more information.

---

Created with ❤️ by [Anuroop Reddy](https://github.com/ANUROOP-REDDY-07)
