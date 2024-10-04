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
  const [userRole, setUserRole] = useState(null);
  const [accountSetupComplete, setAccountSetupComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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

  if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="App">
      <Router>
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

          {/* Hunter Account Setup Route */}
          <Route path="/hunter-setup" element={<HunterSetup />} />

          {/* Redirect hunters to setup if not complete */}
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
      </Router>
    </div>
  );
};

// Fade-in wrapper to add animation
const FadeInWrapper = ({ children }) => {
  return <div className="fade-in">{children}</div>;
};

export default App;