/**
 * Firebase Configuration and Initialization
 * Supports both production Firebase and local emulator for development
 */

import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  Firestore,
  getFirestore,
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
let db: Firestore;

export const initializeFirebase = (): { app: FirebaseApp; db: Firestore } => {
  // Only initialize if not already initialized
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Firestore
  if (!db) {
    db = getFirestore(app);

    // Connect to Firestore emulator in development
    const useEmulator =
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
    const emulatorHost =
      process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8080';

    if (useEmulator && typeof window !== 'undefined') {
      try {
        // Only connect to emulator on client-side and if not already connected
        const [host, port] = emulatorHost.split(':');
        connectFirestoreEmulator(db, host, parseInt(port));
        console.log('Connected to Firestore emulator at', emulatorHost);
      } catch (error) {
        console.warn('Failed to connect to Firestore emulator:', error);
      }
    }
  }

  return { app, db };
};

// Export initialized instances
export const { app: firebaseApp, db: firestore } = initializeFirebase();

// Export the database instance for use throughout the app
export default firestore;
