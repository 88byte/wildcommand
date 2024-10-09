import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";  
import { doc, getDoc } from "firebase/firestore"; // Import Firestore methods
import { HashRouter as Router, Route, Routes, Navigate, Link, useLocation, useNavigate } from "react-router-dom"; 
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Hunters from "./components/Hunters";
import DashboardLayout from "./components/DashboardLayout";
import HunterSetupModal from "./components/HunterSetupModal"; // Modal for hunter setup
import wildLogo from './images/wildlogo.png';
import { db } from "./firebase"; // Import the Firestore database

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [accountSetupComplete, setAccountSetupComplete] = useState(false);
  const [outfitterId, setOutfitterId] = useState(null); // Store outfitterId from Firestore or claims
  const [hunterId, setHunterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false); // To show the modal

  const location = useLocation();
  const navigate = useNavigate();

  // Helper to extract outfitterId and hunterId from the URL
  const extractIdsFromUrl = (url) => {
    const queryParams = new URLSearchParams(new URL(url).search);
    return {
      outfitterId: queryParams.get('outfitterId'),
      hunterId: queryParams.get('hunterId'),
    };
  };

  // Handle sign-in link completion (if magic link is clicked)
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
          console.log("Token result:", tokenResult);

          // Check the token's claims to see if the account setup is complete
          const claims = tokenResult.claims;

          // Try to get outfitterId from claims first
          if (claims.role === 'hunter' && !claims.accountSetupComplete) {
            let fetchedOutfitterId = claims.outfitterId;
            let fetchedHunterId = result.user.uid;

            console.log("Claims-based outfitterId:", fetchedOutfitterId, "hunterId:", fetchedHunterId);

            // If outfitterId is still not available, extract it from the magic link URL
            if (!fetchedOutfitterId) {
              const { outfitterId: urlOutfitterId, hunterId: urlHunterId } = extractIdsFromUrl(url);
              fetchedOutfitterId = urlOutfitterId;
              fetchedHunterId = urlHunterId;
              console.log("URL-based outfitterId:", urlOutfitterId, "hunterId:", urlHunterId);
            }

            if (fetchedOutfitterId && fetchedHunterId) {
              setOutfitterId(fetchedOutfitterId);
              setHunterId(fetchedHunterId);
              setShowSetupModal(true);
              console.log("Showing setup modal");
            } else {
              console.error('outfitterId or hunterId is missing.');
            }
          } else {
            // Navigate to dashboard if the profile is complete
            console.log("Profile is complete, navigating to dashboard.");
            navigate("/dashboard");
          }
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

        console.log("Token claims:", claims);

        setUserRole(claims.role || null);
        setAccountSetupComplete(claims.accountSetupComplete || false);

        // Check if the account setup is incomplete and role is 'hunter'
        if (claims.role === 'hunter' && !claims.accountSetupComplete) {
          let fetchedOutfitterId = claims.outfitterId;
          let fetchedHunterId = currentUser.uid;

          if (!fetchedOutfitterId) {
            console.error("outfitterId is missing from claims.");
            setShowSetupModal(false); // Prevent modal from showing without valid outfitterId
            return;
          }

          setOutfitterId(fetchedOutfitterId);
          setHunterId(fetchedHunterId);
          setShowSetupModal(true);
          console.log("Displaying setup modal after auth state change.");
        }
      } else {
        console.log("No user authenticated, resetting states.");
        setUser(null);
        setUserRole(null);
        setAccountSetupComplete(false);
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

        {/* Hunter Setup Modal */}
        {user && (
          <>
            {/* Hunter Account Setup Modal if setup is not complete */}
            {showSetupModal && (
              <HunterSetupModal
                outfitterId={outfitterId}
                hunterId={hunterId}
                onClose={() => setShowSetupModal(false)} // Close the modal after setup
              />
            )}
          </>
        )}

        {/* Home page '/' displays the hero section */}
        {!user && (
          <Route
            path="/"
            element={
              <div className="hero-section">
                <div className="hero-content">
                  <img src={wildLogo} alt="Wild Command Logo" className="hero-logo" />
                  <h1 className="hero-title">Conquer the Wild.</h1>
                  <h2 className="hero-subtitle">Command the Hunt....</h2>
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
          <Route path="/hunter-dashboard" element={<Dashboard />} />
        )}

        {/* Redirect to login if trying to access protected routes */}
        {!user && (
          <>
            <Route path="/dashboard" element={<Navigate to="/login" />} />
            <Route path="/hunters" element={<Navigate to="/login" />} />
            <Route path="/hunter-dashboard" element={<Navigate to="/login" />} />
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

