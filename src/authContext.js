// src/authContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      const url = window.location.href;

      if (isSignInWithEmailLink(auth, url)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }

        try {
          const result = await signInWithEmailLink(auth, email, url);
          window.localStorage.removeItem('emailForSignIn'); // Remove from storage

          const tokenResult = await getIdTokenResult(result.user);
          setUser({
            ...result.user,
            ...tokenResult.claims,
          });
          console.log('Signed in with email link:', {
            ...result.user,
            ...tokenResult.claims,
          });
        } catch (error) {
          console.error('Error signing in with email link:', error);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser);
        setUser({
          ...currentUser,
          ...tokenResult.claims,
        });

        console.log('Authenticated user in AuthContext:', {
          ...currentUser,
          ...tokenResult.claims,
        });
      } else {
        setUser(null);
        console.log('No authenticated user');
      }
      setLoading(false);
    });

    handleEmailLinkSignIn(); // Check for email link sign-in on page load

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
