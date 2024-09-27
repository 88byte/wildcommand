// src/App.js
import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Signup from "./components/Signup";
import Login from "./components/Login";
import BookingForm from "./components/BookingForm";
import BookingList from "./components/BookingList";
import HuntLogForm from "./components/HuntLogForm";

const App = () => {
  const [user, setUser] = useState(null);

  // Check authentication state (if the user is logged in or not)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Logout function
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Logged out successfully");
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  return (
    <div className="App">
      {user ? (
        <>
          <h1>Welcome, {user.email}</h1>
          <button onClick={handleLogout}>Log Out</button> {/* Logout button */}
          <BookingForm />
          <BookingList />
          <HuntLogForm />
        </>
      ) : (
        <>
          <Signup />
          <Login />
        </>
      )}
    </div>
  );
};

export default App;
