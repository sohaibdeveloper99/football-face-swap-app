// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDZ4bCNOgliRHavNz-TAJhtoWTnePiCd64",
  authDomain: "ajak-medical.firebaseapp.com",
  projectId: "ajak-medical",
  storageBucket: "ajak-medical.firebasestorage.app",
  messagingSenderId: "453380637327",
  appId: "1:453380637327:web:9782d5b338d1e3d7ad66fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
