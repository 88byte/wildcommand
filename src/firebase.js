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


// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services for use in other parts of the app
export { auth, db };