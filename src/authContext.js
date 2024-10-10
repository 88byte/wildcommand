// src/authContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from './firebase'; // Import Firestore
import { doc, updateDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";

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
          const { email: userEmail } = result.user;

          // Find the corresponding hunter document based on email
          const q = query(
            collection(db, 'outfitters'),
            where('email', '==', userEmail)
          );
          const querySnapshot = await getDocs(q);

          // Ensure we found a matching document
          if (!querySnapshot.empty) {
            querySnapshot.forEach(async (docSnap) => {
              const hunterDocRef = doc(db, `outfitters/${docSnap.data().outfitterId}/hunters`, docSnap.id);

              // Update the hunter document with the authenticated user's UID
              await updateDoc(hunterDocRef, { uid: result.user.uid });
            });
          }

          setUser({
            ...result.user,
            ...tokenResult.claims,
          });

          console.log('Signed in with email link and updated hunter profile:', {
            ...result.user,
            ...tokenResult.claims,
          });
        } catch (error) {
          console.error('Error signing in with email link:', error);
        }
      }
    };

    handleEmailLinkSignIn();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser);
        const claims = tokenResult.claims;
        console.log("Claims from token:", claims); // Add this to inspect the claims
        setUser({
          ...currentUser,
          ...claims, // Merge the token claims with the user
        });
        
        console.log("Authenticated user in AuthContext:", {
          ...currentUser,
          ...claims,
        });
      } else {
        setUser(null);
        console.log("No authenticated user");
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
