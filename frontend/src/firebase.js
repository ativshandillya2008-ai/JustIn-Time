/**
 * src/firebase.js — Firebase Authentication setup
 * Provides real Google Auth via popup if config is present,
 * otherwise cleanly handles fallback to Guest mode.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'undefined' && 
  firebaseConfig.apiKey.length > 5
);

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log('%c[Auth] Firebase initialized — Google Sign-In is LIVE', 'color: #10b981; font-weight: bold;');
  } catch (err) {
    console.warn('[Auth] Firebase init failed, falling back to Guest Mode:', err);
  }
} else {
  console.log('%c[Auth] Running in Guest Mode with full interactive platform functionality', 'color: #fc8019; font-weight: bold;');
}

export { auth, googleProvider, signInWithPopup, fbSignOut };
