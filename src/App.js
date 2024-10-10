import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { HashRouter as Router, Route, Routes, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Hunters from "./components/Hunters";
import DashboardLayout from "./components/DashboardLayout";
import wildLogo from './images/wildlogo.png';
import { db } from "./firebase"; // Import the Firestore database

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [accountSetupComplete, setAccountSetupComplete] = useState(false);
  const [outfitterId, setOutfitterId] = useState(null); // Store outfitterId from Firestore or claims
  const [hunterId, setHunterId] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Helper to extract outfitterId and hunterId from the URL or hash fragment
  const extractIdsFromUrl = (url) => {
    const hashFragment = url.split('#')[1]; // Get the part after the #
    if (hashFragment) {
      const queryParams = new URLSearchParams(hashFragment.split('?')[1]);
      return {
        outfitterId: queryParams.get('outfitterId'),
        hunterId: queryParams.get('hunterId'),
      };
    }
    return { outfitterId: null, hunterId: null };
  };

  // Remove the modal logic and streamline the flow
useEffect(() => {
  const url = window.location.href;
  console.log("Checking for magic link in URL:", url);

  if (isSignInWithEmailLink(auth, url)) {
    let email = window.localStorage.getItem('emailForSignIn');
    console.log("Email from localStorage:", email);

    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
      console.log("Email after prompt:", email);
    }

    signInWithEmailLink(auth, email, url)
      .then(async (result) => {
        console.log("Sign in with email link successful:", result);

        // Clear the email from local storage
        window.localStorage.removeItem('emailForSignIn');

        // Force refresh token to fetch updated claims (ensure claims are updated post-sign-in)
        const tokenResult = await result.user.getIdTokenResult(true);
        console.log("Token result after sign in:", tokenResult);

        // Check if outfitterId and hunterId are in the URL
        let fetchedOutfitterId = tokenResult.claims.outfitterId || null;
        let fetchedHunterId = tokenResult.claims.hunterId || result.user.uid;

        // Fallback to URL-based IDs
        if (!fetchedOutfitterId) {
          const urlParams = new URLSearchParams(new URL(url).search);
          fetchedOutfitterId = urlParams.get('outfitterId');
          fetchedHunterId = urlParams.get('hunterId');
        }

        console.log("URL-based outfitterId:", fetchedOutfitterId, "hunterId:", fetchedHunterId);

        // Navigate to the dashboard directly after successful sign-in
        navigate("/dashboard");
      })
      .catch((error) => {
        console.error("Error signing in with email link:", error.message);
      });
  }
}, [location, navigate]);


  // Handle authentication state and fetch user claims
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setLoading(false); // Stop loading when user is detected
    if (currentUser) {
      console.log("User authenticated:", currentUser);

      setUser(currentUser);

      // Force refresh token to fetch updated claims after login or verification
      const token = await currentUser.getIdTokenResult(true);
      const claims = token.claims;

      setUserRole(claims.role || null);

      // Fetch hunter profile from Firestore
      const hunterDocRef = doc(db, `outfitters/${claims.outfitterId}/hunters`, currentUser.uid);
      const hunterDoc = await getDoc(hunterDocRef);

      if (hunterDoc.exists()) {
        const hunterData = hunterDoc.data();

        // If the profile setup is not complete, redirect to Profile Setup page
        if (!hunterData.profileSetupComplete) {
          navigate("/profile-setup"); // Redirect to Profile Setup page
        } else {
          navigate("/dashboard"); // Redirect to Dashboard if profile is complete
        }
      }
    } else {
      setUser(null);
      setUserRole(null);
    }
  });
  return () => unsubscribe();
}, [location]);


  if (loading) {
    return <div>Loading...</div>; // Optionally show a loading screen while checking authentication
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<FadeInWrapper><Signup /></FadeInWrapper>} />
        <Route path="/login" element={<FadeInWrapper><Login /></FadeInWrapper>} />

        {/* Home page '/' displays the hero section */}
        {!user && (
          <Route
            path="/"
            element={
              <div className="hero-section">
                <div className="hero-content">
                  <img src={wildLogo} alt="Wild Command Logo" className="hero-logo" />
                  <h1 className="hero-title">Conquer the Wild.</h1>
                  <h2 className="hero-subtitle">Command the Hunt.....</h2>
                  <div className="hero-buttons">
                    <Link to="/signup">
                      <button className="signup-btn">Sign Up</button>
                    </Link>
                    <Link to="/login">
                      <button className="login-btn">Log In</button>
                    </Link>
                  </div>
                </div>
              </div>
            }
          />
        )}

        {/* Protected Routes */}
        {user && userRole !== 'hunter' && (
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hunters" element={<Hunters />} />
          </Route>
        )}

        {/* Hunter Dashboard */}
        {user && userRole === 'hunter' && accountSetupComplete && (
          <Route path="/dashboard" element={<Dashboard />} />
        )}

        {/* Redirect to login if trying to access protected routes */}
        {!user && (
          <>
            <Route path="/dashboard" element={<Navigate to="/login" />} />
            <Route path="/hunters" element={<Navigate to="/login" />} />
          </>
        )}

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
      </Routes>
    </div>
  );
};

// Fade-in wrapper to add animation
const FadeInWrapper = ({ children }) => {
  return <div className="fade-in">{children}</div>;
};

export default App;



