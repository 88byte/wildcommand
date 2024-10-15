import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from './firebase'; // Import Firestore
import { query, collection, where, getDocs, getDoc, doc } from "firebase/firestore";

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
          const q = query(collection(db, 'outfitters'), where('email', '==', email));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error('No account found. Please contact your outfitter to create an account.');
          }

          const result = await signInWithEmailLink(auth, email, url);
          window.localStorage.removeItem('emailForSignIn');

          const tokenResult = await getIdTokenResult(result.user);
          const userClaims = tokenResult.claims;

          // Check if the guide is active
          if (userClaims.role === 'guide') {
            const guideRef = doc(db, `outfitters/${userClaims.outfitterId}/guides/${result.user.uid}`);
            const guideSnap = await getDoc(guideRef);

            if (guideSnap.exists() && guideSnap.data().active === false) {
              await auth.signOut(); // Log out the user if inactive
              alert('Your account has been deactivated. Please contact your outfitter.');
              setLoading(false);
              return;
            }
          }

          setUser({
            ...result.user,
            ...tokenResult.claims,
          });

        } catch (error) {
          console.error('Error signing in with email link:', error);
          alert(error.message);
        }
      }
    };

    handleEmailLinkSignIn();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const tokenResult = await getIdTokenResult(currentUser);
          const claims = tokenResult.claims;

          if (claims.role === 'guide') {
            const guideRef = doc(db, `outfitters/${claims.outfitterId}/guides/${currentUser.uid}`);
            const guideSnap = await getDoc(guideRef);

            if (guideSnap.exists() && guideSnap.data().active === false) {
              await auth.signOut();
              alert('Your account has been deactivated. Please contact your outfitter.');
              setLoading(false);
              return;
            }
          }

          setUser({
            ...currentUser,
            ...claims,
          });
        } catch (error) {
          console.error('Error fetching token claims:', error);
        }
      } else {
        setUser(null);
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
  