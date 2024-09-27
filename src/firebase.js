firebase.js// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJ9lppao0l8xyqeH6_eHPOqzFZ1o6l-7A",
  authDomain: "wild-command.firebaseapp.com",
  projectId: "wild-command",
  storageBucket: "wild-command.appspot.com",
  messagingSenderId: "1029998806639",
  appId: "1:1029998806639:web:9fb7c4a234f57cb9f9ef9a",
  measurementId: "G-C174163MVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services that you'll use in your app
const db = getFirestore(app);  // For Firestore (database)
const auth = getAuth(app);     // For Firebase Authentication

export { db, auth };