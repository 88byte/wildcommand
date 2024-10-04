// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions'; // Import getFunctions

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJ9lppao0l8xyqeH6_eHPOqzFZ1o6l-7A",
  authDomain: "wild-command.firebaseapp.com",
  projectId: "wild-command",
  storageBucket: "wild-command.appspot.com",
  messagingSenderId: "1029998806639",
  appId: "1:1029998806639:web:9fb7c4a234f57cb9f9ef9a",
  measurementId: "G-C174163MVY"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app); // Initialize Firebase Functions

// Export services for use throughout your app
export { auth, db, storage, functions };
