import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { HashRouter as Router, Route, Routes, Link, Navigate, useLocation } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Hunters from "./components/Hunters";
import DashboardLayout from "./components/DashboardLayout";
import HunterSetup from "./components/HunterSetup"; // Import HunterSetup
import wildLogo from './images/wildlogo.png';

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // Store user role (outfitter, guide, hunter)
  const [accountSetupComplete, setAccountSetupComplete] = useState(false); // Store if hunter setup is complete
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check for custom claims to determine role and account setup status
        const token = await currentUser.getIdTokenResult();
        const claims = token.claims;

        setUserRole(claims.role || null);
        setAccountSetupComplete(claims.accountSetupComplete || false);
      } else {
        setUserRole(null);
        setAccountSetupComplete(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Ensure the redirect to dashboard only happens on the root path
  if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="App">
    <Router> {/* Use HashRouter */}
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<FadeInWrapper><Signup /></FadeInWrapper>} />
        <Route path="/login" element={<FadeInWrapper><Login /></FadeInWrapper>} />

        {/* Home page '/' displays the hero section if not logged in */}
        {!user && (
          <Route
            path="/"
            element={
              <div className="hero-section">
                <div className="hero-content">
                  <img src={wildLogo} alt="Wild Command Logo" className="hero-logo" />
                  <h1 className="hero-title">Conquer the Wild.</h1>
                  <h2 className="hero-subtitle">Command the Hunt.</h2>
                  <p className="hero-description">
                    Your ultimate outfitter tool for managing hunts, guiding, and client bookings. Stay ahead, stay sharp, stay in command.
                  </p>
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

        {/* Hunter Account Setup Route */}
        {userRole === 'hunter' && !accountSetupComplete && (
          <Route path="/hunter-setup" element={<HunterSetup />} />
        )}

        {/* Redirect hunters to setup if they haven't completed it */}
        {userRole === 'hunter' && !accountSetupComplete && location.pathname !== '/hunter-setup' && (
          <Navigate to="/hunter-setup" />
        )}

        {/* Protected Routes */}
        {user && userRole !== 'hunter' && (
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hunters" element={<Hunters />} />
          </Route>
        )}

        {/* Hunter Dashboard after setup is complete */}
        {user && userRole === 'hunter' && accountSetupComplete && (
          <Route path="/hunter-dashboard" element={<Dashboard />} />
        )}

        {/* If logged out and tries to access protected routes, redirect to login */}
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
      </Router>
    </div>
  );
};

// Fade-in wrapper to add animation when the form appears
const FadeInWrapper = ({ children }) => {
  return <div className="fade-in">{children}</div>;
};

export default App;
