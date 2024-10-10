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
        try {
          // Get token result to include claims like role, outfitterId, etc.
          const tokenResult = await getIdTokenResult(currentUser);
          
          // Ensure that role and outfitterId are present in the user context
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            role: tokenResult.claims.role || null,  // Include role claim
            outfitterId: tokenResult.claims.outfitterId || null,  // Include outfitterId claim
            ...tokenResult.claims,  // Spread the rest of the claims
          });
        } catch (error) {
          console.error('Error fetching token result:', error);
        }
      } else {
        setUser(null);  // No user is signed in
      }
      setLoading(false);  // Stop loading once we have user data or no user
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
