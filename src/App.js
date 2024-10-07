import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";  // Import magic link methods
import { HashRouter as Router, Route, Routes, Navigate, Link, useLocation } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Hunters from "./components/Hunters";
import DashboardLayout from "./components/DashboardLayout";
import HunterSetup from "./components/HunterSetup";
import wildLogo from './images/wildlogo.png';

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [accountSetupComplete, setAccountSetupComplete] = useState(false);
  const [outfitterId, setOutfitterId] = useState(null);
  const [hunterId, setHunterId] = useState(null);
  const [email, setEmail] = useState(null); // Store the hunter's email for the magic link flow
  const [loading, setLoading] = useState(true); // Loading state for async operations

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Get outfitterId and hunterId from the URL
  useEffect(() => {
    setOutfitterId(queryParams.get('outfitterId'));
    setHunterId(queryParams.get('hunterId'));
  }, [location]);

  // Check if the user is being signed in using a magic link
  useEffect(() => {
    const checkMagicLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        // Get email from local storage or prompt user to provide it
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          // If email is not stored, prompt the user to provide it
          email = window.prompt('Please provide your email for confirmation');
        }
        
        try {
          // Sign in the user with the email link
          const result = await signInWithEmailLink(auth, email, window.location.href);
          setUser(result.user); // Set the authenticated user
          window.localStorage.removeItem('emailForSignIn'); // Clean up email from local storage
        } catch (error) {
          console.error("Error signing in with email link:", error);
        }
      }
    };
    checkMagicLink();
  }, []);

  // Handle authentication state and fetch user claims
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(false); // Stop loading when user is detected
      if (currentUser) {
        setUser(currentUser);
        const token = await currentUser.getIdTokenResult();
        const claims = token.claims;

        setUserRole(claims.role || null);
        setAccountSetupComplete(claims.accountSetupComplete || false);

        // Set outfitterId and hunterId from claims if not present in URL
        setOutfitterId(claims.outfitterId || queryParams.get('outfitterId'));
        setHunterId(claims.uid || queryParams.get('hunterId'));
      } else {
        setUser(null);
        setUserRole(null);
        setAccountSetupComplete(false);
      }
    });
    return () => unsubscribe();
  }, [location, queryParams]);

  // Redirect authenticated hunters to the setup page if their profile is incomplete
  if (user && userRole === 'hunter' && !accountSetupComplete && location.pathname !== '/hunter-setup') {
    return <Navigate to={`/hunter-setup?outfitterId=${outfitterId}&hunterId=${hunterId}`} />;
  }

  // Redirect if authenticated but on login/signup
  if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" />;
  }

  if (loading) {
    return <div>Loading...</div>; // Optionally show a loading screen while checking authentication
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<FadeInWrapper><Signup /></FadeInWrapper>} />
        <Route path="/login" element={<FadeInWrapper><Login /></FadeInWrapper>} />

        {/* Hunter Account Setup Route */}
        <Route path="/hunter-setup" element={<HunterSetup />} />

        {/* Home page '/' displays the hero section */}
        {!user && (
          <Route
            path="/"
            element={
              <div className="hero-section">
                <div className="hero-content">
                  <img src={wildLogo} alt="Wild Command Logo" className="hero-logo" />
                  <h1 className="hero-title">Conquer the Wild.</h1>
                  <h2 className="hero-subtitle">Command the Hunt.</h2>
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

