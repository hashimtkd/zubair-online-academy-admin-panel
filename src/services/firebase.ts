import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
export const IS_DEMO_MODE = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === 'demo' || 
  firebaseConfig.apiKey.startsWith('your_') ||
  firebaseConfig.apiKey === '';

let app;
let auth: any = null;
let db: any = null;

if (!IS_DEMO_MODE) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase. Falling back to Demo Mode.', error);
    (window as any).firebaseInitError = error;
  }
} else {
  console.log('Running in Zubair Online Academy Admin Panel Demo Mode (Local Storage DB).');
}

export { auth, db };
