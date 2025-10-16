import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Exporting the Firebase services
export { auth, firestore, storage };
export default app;
