// src/authContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from './firebase'; // Import Firestore
import { doc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";

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
          // Sign in with email link
          const result = await signInWithEmailLink(auth, email, url);
          window.localStorage.removeItem('emailForSignIn'); // Remove from storage

          const tokenResult = await getIdTokenResult(result.user);
          const { email: userEmail } = result.user;

          // Query all outfitters for matching hunter by email
          const q = query(collection(db, 'outfitters'));
          const querySnapshot = await getDocs(q);

          let hunterFound = false;

          // Search through all outfitters to find the correct hunter document
          for (const outfitterDoc of querySnapshot.docs) {
            const outfitterId = outfitterDoc.id;

            // Query hunters within the outfitter for matching email
            const hunterQuery = query(
              collection(db, `outfitters/${outfitterId}/hunters`),
              where('email', '==', userEmail)
            );
            const hunterSnapshot = await getDocs(hunterQuery);

            // If the hunter document is found, update its `uid`
            if (!hunterSnapshot.empty) {
              hunterSnapshot.forEach(async (hunterDoc) => {
                const hunterDocRef = doc(db, `outfitters/${outfitterId}/hunters`, hunterDoc.id);
                await updateDoc(hunterDocRef, { uid: result.user.uid }); // Update hunter with `uid`
                console.log(`Hunter profile updated with UID: ${result.user.uid}`);
                hunterFound = true;
              });
            }
          }

          if (!hunterFound) {
            console.warn("No hunter document found matching the email:", userEmail);
          }

          // Set the user with the merged claims and user data
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
        console.log("Claims from token:", claims); // Log token claims
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
