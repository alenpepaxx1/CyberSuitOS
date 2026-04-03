import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

// Fallback config for local development if firebase-applet-config.json is missing or placeholder
const isPlaceholder = !config || config.apiKey === "TODO_KEYHERE";

const firebaseConfig = isPlaceholder ? {
  apiKey: "MOCK_API_KEY",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-MOCKID"
} : config;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    if (isPlaceholder) {
      console.log("Offline mode: Simulating login...");
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { user: { uid: 'mock-user-123', displayName: 'Offline Operator', email: 'offline@cybersuite.os' } };
    }
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export type { FirebaseUser };
