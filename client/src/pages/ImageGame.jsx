import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Multi-language fallback vocabulary
const FALLBACK_VOCABULARY = [
  { word: "Apple", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80", translations: { Spanish: "Manzana", French: "Pomme", German: "Apfel", Italian: "Mela", Portuguese: "Maçã" } },
  { word: "Dog", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80", translations: { Spanish: "Perro", French: "Chien", German: "Hund", Italian: "Cane", Portuguese: "Cachorro" } },
  { word: "Cat", imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80", translations: { Spanish: "Gato", French: "Chat", German: "Katze", Italian: "Gatto", Portuguese: "Gato" } },
  { word: "House", imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80", translations: { Spanish: "Casa", French: "Maison", German: "Haus", Italian: "Casa", Portuguese: "Casa" } },
  { word: "Car", imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80", translations: { Spanish: "Coche", French: "Voiture", German: "Auto", Italian: "Auto", Portuguese: "Carro" } },
  { word: "Tree", imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&q=80", translations: { Spanish: "Árbol", French: "Arbre", German: "Baum", Italian: "Albero", Portuguese: "Árvore" } },
  { word: "Book", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80", translations: { Spanish: "Libro", French: "Livre", German: "Buch", Italian: "Libro", Portuguese: "Livro" } },
  { word: "Sun", imageUrl: "https://images.unsplash.com/photo-1533628635777-112b2239b1c7?w=400&q=80", translations: { Spanish: "Sol", French: "Soleil", German: "Sonne", Italian: "Sole", Portuguese: "Sol" } },
  { word: "Water", imageUrl: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400&q=80", translations: { Spanish: "Agua", French: "Eau", German: "Wasser", Italian: "Acqua", Portuguese: "Água" } },
  { word: "Bread", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80", translations: { Spanish: "Pan", French: "Pain", German: "Brot", Italian: "Pane", Portuguese: "Pão" } },
  { word: "Coffee", imageUrl: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80", translations: { Spanish: "Café", French: "Café", German: "Kaffee", Italian: "Caffè", Portuguese: "Café" } },
  { word: "Milk", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80", translations: { Spanish: "Leche", French: "Lait", German: "Milch", Italian: "Latte", Portuguese: "Leite" } }
];

export default function ImageGame() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { userData } = useAuth();

  useEffect(() => {
    const initGame = async () => {
      if (!userData) return; // Wait for auth to load
      
      try {
        setLoading(true);
        const lang = userData.learningLanguage || 'Spanish';
        let dbWords = [];
        
        try {
          // Try to fetch language-specific deck
          const deckRef = doc(db, 'vocabularyDecks', `basic_objects_${lang}`);
          const snap = await getDoc(deckRef);
          if (snap.exists() && snap.data().words) {
            dbWords = snap.data().words;
          } else {
            // Fallback to default deck
            const defaultRef = doc(db, 'vocabularyDecks', 'basic_objects');
            const defaultSnap = await getDoc(defaultRef);
            if (defaultSnap.exists() && defaultSnap.data().words) {
              dbWords = defaultSnap.data().words;
            }
          }
        } catch (e) {
          console.error("Firestore read error, using fallback:", e);
        }

        // Map fallback vocabulary to the correct language
        const mappedFallback = FALLBACK_VOCABULARY.map(v => ({
          word: v.word,
          imageUrl: v.imageUrl,
          translation: v.translations[lang] || v.translations['Spanish'] || v.word
        }));

        // Combine DB words with fallback
        const combinedPool = [...dbWords, ...mappedFallback].filter((v, i, a) => a.findIndex(t => (t.word === v.word)) === i);
        
        const totalQuestions = Math.min(20, combinedPool.length);
        let selectedQuestions = [];
        
        // Randomly sample questions
        const shuffledPool = [...combinedPool].sort(() => 0.5 - Math.random());
        selectedQuestions = shuffledPool.slice(0, totalQuestions);

        // Format questions
        const formatted = selectedQuestions.map((w, idx) => {
          const possibleDistractors = combinedPool.filter(ow => ow.word !== w.word);
          const shuffledDistractors = possibleDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
          
          const options = [w.translation, ...shuffledDistractors.map(d => d.translation)].sort(() => 0.5 - Math.random());
          
          return {
            id: idx,
            image: w.imageUrl,
            options: options,
            correctAnswer: w.translation
          };
        });
        
        setQuestions(formatted);
        setCurrentQuestionIndex(0);
        setScore(0);
        setMistakes(0);
        setStreak(0);
        
        // Preload first few images
        formatted.slice(0, 5).forEach(q => {
          const img = new Image();
          img.src = q.image;
        });
      } catch (error) {
        console.error("Error setting up questions:", error);
      } finally {
        setLoading(false);
      }
    };
    initGame();
  }, [userData?.learningLanguage, userData?.uid]);

  useEffect(() => {
    setImageLoaded(false);
    // Preload next image to keep UX fast
    if (questions.length > currentQuestionIndex + 1) {
      const img = new Image();
      img.src = questions[currentQuestionIndex + 1].image;
    }
  }, [currentQuestionIndex, questions]);

  const handleSelect = (option) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    setIsAnswered(true);

    if (option === question.correctAnswer) {
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      
      // Auto advance on correct
      setTimeout(() => {
        handleNext();
      }, 1200);
    } else {
      setStreak(0);
      setMistakes(prev => prev + 1);
      
      // Still auto advance on wrong, but give slightly more time to see the right answer
      setTimeout(() => {
        handleNext();
      }, 1800);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      alert(`Game Complete!\\nScore: ${score}\\nMistakes: ${mistakes}\\nMax Streak: ${streak}`);
      // Return to dashboard or reset
      window.location.href = '/dashboard';
    }
  };

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="spinner" style={{ width: '48px', height: '48px' }}></div>
    </div>
  );
  
  if (!questions.length) return (
    <div className="page-container" style={{ textAlign:'center' }}>
      <h2>Failed to load vocabulary!</h2>
      <Link to="/dashboard" className="btn btn-primary">Return to Dashboard</Link>
    </div>
  );

  const question = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  // Animation variants for Framer Motion
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.95 },
    correct: { 
      scale: [1, 1.05, 1],
      transition: { duration: 0.4 }
    },
    wrong: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      {/* Top Section: Progress & Stats */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          ✖
        </Link>
        <div className="progress-bar-container" style={{ flex: 1 }}>
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontWeight: 'bold' }}>
          <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            🔥 {streak}
          </span>
          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ❤️ {5 - mistakes < 0 ? 0 : 5 - mistakes}
          </span>
        </div>
      </header>

      {/* Middle & Bottom: Question & Options */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '600px' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestionIndex}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>Select the correct word</h2>
            
            {/* Image Display */}
            <div className="glass-card" style={{ padding: '0.5rem', width: '100%', maxWidth: '400px', height: '300px', margin: '0 auto 2rem', borderRadius: '1.5rem', backgroundColor: 'var(--surface-color)' }}>
              {!imageLoaded && (
                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div className="spinner"></div>
                </div>
              )}
              <img 
                src={question.image} 
                alt="Vocabulary" 
                onLoad={() => setImageLoaded(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem', opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }} 
              />
            </div>
            
            {/* Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '600px' }}>
              {question.options.map(option => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === question.correctAnswer;
                
                // Determine state class
                let btnClass = "btn btn-secondary";
                let animateState = "initial";
                
                if (isAnswered) {
                  if (isSelected && isCorrectAnswer) {
                    btnClass += " bg-success";
                    animateState = "correct";
                  } else if (isSelected && !isCorrectAnswer) {
                    btnClass += " bg-danger";
                    animateState = "wrong";
                  } else if (isCorrectAnswer) {
                    // Reveal the right answer if they got it wrong
                    btnClass += " bg-success";
                  } else {
                    btnClass += " opacity-50";
                  }
                }

                return (
                  <motion.button 
                    key={option} 
                    variants={buttonVariants}
                    initial="initial"
                    whileHover={!isAnswered ? "hover" : ""}
                    whileTap={!isAnswered ? "tap" : ""}
                    animate={animateState}
                    onClick={() => handleSelect(option)}
                    className={btnClass}
                    disabled={isAnswered}
                    style={{
                      height: '80px',
                      fontSize: '1.25rem',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid',
                      borderColor: 'var(--border-color)',
                      backgroundColor: isAnswered ? undefined : 'var(--surface-color)',
                      boxShadow: isAnswered ? 'none' : '0 4px 0 var(--border-color)' // Duolingo style button depth
                    }}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
