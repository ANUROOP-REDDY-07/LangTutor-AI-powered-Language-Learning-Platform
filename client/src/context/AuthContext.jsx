import { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const signup = (email, password, language = 'Spanish') => {
    return createUserWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
      const user = userCredential.user;
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        xp: 0,
        level: 'Beginner',
        totalSessions: 0,
        totalMinutes: 0,
        messagesSent: 0,
        gamesPlayed: 0,
        learningLanguage: language,
        currentStreak: 0,
        lastLoginDate: new Date().toISOString().split('T')[0]
      });
      return userCredential;
    });
  };

  const updateUserLanguage = async (newLanguage) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    await setDoc(userRef, { learningLanguage: newLanguage }, { merge: true });
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userRef = doc(db, "users", user.uid);
        
        // Listen for real-time updates directly
        const unsubscribeData = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            
            // Streak Calculation Logic
            const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            let streak = data.currentStreak || 0;
            let lastLogin = data.lastLoginDate || '';
            
            if (lastLogin !== todayDate) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayDate = yesterday.toISOString().split('T')[0];
              
              if (lastLogin === yesterdayDate) {
                streak += 1;
              } else {
                streak = 1; // broken or first
              }
              
              // Push the streak securely to the database so we don't spam updates
              await setDoc(userRef, { currentStreak: streak, lastLoginDate: todayDate }, { merge: true });
            } else {
              setUserData(data);
            }
          } else {
            // Document might not exist if signup hasn't finished its setDoc yet
            // or if it was manually deleted. signup handles initial creation now.
            setUserData(null);
          }
        });
        
        setLoading(false);
        return () => unsubscribeData();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  const value = {
    currentUser,
    userData,
    theme,
    toggleTheme,
    login,
    signup,
    logout,
    updateUserLanguage
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
