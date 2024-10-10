import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from './firebase'; // Import Firestore
import { query, collection, where, getDocs } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user role based on custom claims (useful if needed externally)
  const fetchUserRole = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdTokenResult();
      return token.claims.role; // Return the role from the custom claims
    }
    return null;
  };

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      const url = window.location.href;

      if (isSignInWithEmailLink(auth, url)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }

        try {
          // Step 1: Check if the email exists in Firestore under any outfitter
          const q = query(collection(db, 'outfitters'), where('email', '==', email));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            // No matching hunter in Firestore, deny login
            throw new Error('No account found. Please contact your outfitter to create an account.');
          }

          // Step 2: Email exists, proceed with signing in via magic link
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
          alert(error.message); // Inform the user that their account wasn't found
        }
      }
    };

    handleEmailLinkSignIn();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch token and claims
          const tokenResult = await getIdTokenResult(currentUser);
          const claims = tokenResult.claims;
          
          // Set the user object with the role
          setUser({
            ...currentUser,
            ...claims, // Merge the token claims with the user
          });

          console.log("Authenticated user in AuthContext:", {
            ...currentUser,
            ...claims,
          });
        } catch (error) {
          console.error('Error fetching token claims:', error);
        }
      } else {
        setUser(null);
        console.log("No authenticated user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, fetchUserRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
