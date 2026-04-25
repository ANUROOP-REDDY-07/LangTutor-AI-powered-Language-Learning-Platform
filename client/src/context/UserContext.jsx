import { createContext, useContext, useEffect, useState } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";

const UserContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserData(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const createProfile = async (uid, email, name, targetLanguage) => {
    await setDoc(doc(db, "users", uid), {
      name,
      email,
      targetLanguage,
      xp: 0,
      level: 1,
      progress: {
        totalSessions: 0,
        totalMinutes: 0,
        messagesSent: 0,
        gamesPlayed: 0
      }
    });
  };

  const value = {
    userData,
    loading,
    createProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
