require('dotenv').config();
const admin = require('firebase-admin');

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

const seedVocabulary = async () => {
  console.log("Seeding Vocabulary data into Firestore...");
  
  const languages = ['Spanish', 'French', 'German', 'Italian', 'Portuguese'];
  
  const vocabularyData = {
    Spanish: [
      { word: "Apple", translation: "Manzana", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80" },
      { word: "Dog", translation: "Perro", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80" },
      { word: "Cat", translation: "Gato", imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80" },
      { word: "House", translation: "Casa", imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80" },
      { word: "Car", translation: "Coche", imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80" }
    ],
    French: [
      { word: "Apple", translation: "Pomme", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80" },
      { word: "Dog", translation: "Chien", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80" },
      { word: "Cat", translation: "Chat", imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80" },
      { word: "House", translation: "Maison", imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80" },
      { word: "Car", translation: "Voiture", imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80" }
    ],
    German: [
      { word: "Apple", translation: "Apfel", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80" },
      { word: "Dog", translation: "Hund", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80" },
      { word: "Cat", translation: "Katze", imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80" },
      { word: "House", translation: "Haus", imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80" },
      { word: "Car", translation: "Auto", imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80" }
    ],
    Italian: [
      { word: "Apple", translation: "Mela", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80" },
      { word: "Dog", translation: "Cane", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80" },
      { word: "Cat", translation: "Gato", imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80" },
      { word: "House", translation: "Casa", imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80" },
      { word: "Car", translation: "Auto", imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80" }
    ],
    Portuguese: [
      { word: "Apple", translation: "Maçã", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&q=80" },
      { word: "Dog", translation: "Cachorro", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80" },
      { word: "Cat", translation: "Gato", imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80" },
      { word: "House", translation: "Casa", imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80" },
      { word: "Car", translation: "Carro", imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80" }
    ]
  };

  try {
    for (const lang of languages) {
      const basicDeck = {
        title: `Basic Real-Life Objects (${lang})`,
        description: `Learn essential objects you encounter every day in ${lang}.`,
        level: 1,
        words: vocabularyData[lang]
      };
      const deckRef = db.collection('vocabularyDecks').doc(`basic_objects_${lang}`);
      await deckRef.set(basicDeck);
      console.log(`Successfully seeded ${lang} deck.`);
    }
    
    // Keep the old 'basic_objects' as a fallback to Spanish
    await db.collection('vocabularyDecks').doc('basic_objects').set({
      title: "Basic Real-Life Objects (Default)",
      description: "Learn essential objects you encounter every day.",
      level: 1,
      words: vocabularyData.Spanish
    });

    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedVocabulary();

