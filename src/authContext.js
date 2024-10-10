// src/authContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser);
        setUser({
          ...currentUser,
          ...tokenResult.claims, // Merge the token claims with the user
        });
        
        // Add the console log here to debug the user object
        console.log("Authenticated user in AuthContext:", {
          ...currentUser,
          ...tokenResult.claims,
        });
      } else {
        setUser(null);
        console.log("No authenticated user"); // Add this to log when no user is authenticated
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
