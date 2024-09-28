// Import the Firebase SDK and functions
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Optional: If you're using Firebase Analytics, keep this, otherwise remove it.
// import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJ9lppao0l8xyqeH6_eHPOqzFZ1o6l-7A",
  authDomain: "wild-command.firebaseapp.com",
  projectId: "wild-command",
  storageBucket: "wild-command.appspot.com",
  messagingSenderId: "1029998806639",
  appId: "1:1029998806639:web:9fb7c4a234f57cb9f9ef9a",
  measurementId: "G-C174163MVY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Uncomment the following line if you want to use Firebase Analytics
// const analytics = getAnalytics(app);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services for use in other parts of the app
export { auth, db };
