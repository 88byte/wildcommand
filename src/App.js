import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { HashRouter as Router, Route, Routes, Link, Navigate, useLocation } from "react-router-dom";
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
  
  // Use location inside Router
  return (
    <div className="App">
      <Router>
        <AppRouter user={user} setUser={setUser} userRole={userRole} setUserRole={setUserRole} accountSetupComplete={accountSetupComplete} setAccountSetupComplete={setAccountSetupComplete} />
      </Router>
    </div>
  );
};

const AppRouter = ({ user, setUser, userRole, setUserRole, accountSetupComplete, setAccountSetupComplete }) => {
  const location = useLocation();

  // Handle authentication state
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
  }, [setUser, setUserRole, setAccountSetupComplete]);

  // Redirect if authenticated but on login/signup
  if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/signup" element={<FadeInWrapper><Signup /></FadeInWrapper>} />
      <Route path="/login" element={<FadeInWrapper><Login /></FadeInWrapper>} />

      {/* Home page */}
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
                  <Navigate to="/signup">
                    <button className="signup-btn">Sign Up</button>
                  </Navigate>
                  <Navigate to="/login">
                    <button className="login-btn">Log In</button>
                  </Navigate>
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* Hunter Account Setup Route */}
      <Route path="/hunter-setup" element={<HunterSetup />} />

      {/* Protected Routes */}
      {user && userRole !== 'hunter' && (
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hunters" element={<Hunters />} />
        </Route>
      )}

      {/* Hunter Dashboard after setup */}
      {user && userRole === 'hunter' && accountSetupComplete && (
        <Route path="/hunter-dashboard" element={<Dashboard />} />
      )}

      {/* Redirect if no user for protected routes */}
      {!user && (
        <>
          <Route path="/dashboard" element={<Navigate to="/login" />} />
          <Route path="/hunters" element={<Navigate to="/login" />} />
          <Route path="/hunter-dashboard" element={<Navigate to="/login" />} />
        </>
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
    </Routes>
  );
};

// Fade-in wrapper to add animation
const FadeInWrapper = ({ children }) => {
  return <div className="fade-in">{children}</div>;
};

export default App;
