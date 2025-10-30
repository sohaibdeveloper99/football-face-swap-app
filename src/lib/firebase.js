import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw9C1poEuk3AonrkVwQf65THxXI2F5uK4",
  authDomain: "rivalkit-85fd6.firebaseapp.com",
  projectId: "rivalkit-85fd6",
  storageBucket: "rivalkit-85fd6.firebasestorage.app",
  messagingSenderId: "838507185057",
  appId: "1:838507185057:web:f45f09812a04e8ae0881e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;

