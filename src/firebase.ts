import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDCRhui6PIRnxarW_FBpMCKilSBZuMO7TA",
  authDomain: "clea-health-checker.firebaseapp.com",
  projectId: "clea-health-checker",
  storageBucket: "clea-health-checker.firebasestorage.app",
  messagingSenderId: "665196336843",
  appId: "1:665196336843:web:e5196f7911c6c7b9d3ad4e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
