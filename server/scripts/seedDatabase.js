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
  
  const basicDeck = {
    title: "Basic Real-Life Objects",
    description: "Learn essential objects you encounter every day.",
    level: 1,
    words: [
      { word: "Apple", translation: "Manzana", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6bac6?w=400&q=80" },
      { word: "Car", translation: "Coche", imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80" },
      { word: "House", translation: "Casa", imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80" },
      { word: "Dog", translation: "Perro", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80" }
    ]
  };

  try {
    const deckRef = db.collection('vocabularyDecks').doc('basic_objects');
    await deckRef.set(basicDeck);
    console.log("Successfully seeded basic deck.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedVocabulary();
