// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";   // ✅ ADD THIS
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBxMjDpujf0SbdgClc5OnIaISyPQ-8gBFs",
  authDomain: "projectallocationsystem.firebaseapp.com",
  projectId: "projectallocationsystem",
  storageBucket: "projectallocationsystem.firebasestorage.app",
  messagingSenderId: "470259886295",
  appId: "1:470259886295:web:337cc098849003ebfaa892",
  measurementId: "G-KTWZP2L89X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ ADD THIS (IMPORTANT)
export const auth = getAuth(app);

// Optional
const analytics = getAnalytics(app);