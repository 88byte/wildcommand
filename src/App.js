import React, { useState, useEffect, useRef } from "react";
import { Route, Routes, Navigate, Link, useNavigate } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Guides from "./components/Guides";
import GuideProfileSetup from './components/GuideProfileSetup';
import Hunters from "./components/Hunters";
import HunterProfileSetup from './components/HunterProfileSetup';
import Profile from './components/Profile';
import Support from './components/Support';
import DashboardLayout from "./components/DashboardLayout";
import BookHunt from './components/BookHunt';
import wildLogo from './images/wildlogo.png';
import { db, auth } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from './authContext';

const App = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accountSetupComplete, setAccountSetupComplete] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();
  
  // Timeout duration in milliseconds (e.g., 1000 seconds)
  const timeoutDuration = 1000000;
  const timeoutRef = useRef(null); // Reference to the timeout

  // Reset the timeout if the user is active
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to log the user out after inactivity
    timeoutRef.current = setTimeout(() => {
      console.error("Inactivity timeout exceeded, logging out.");
      handleLogout();
    }, timeoutDuration);
  };

  // Check if the profile setup for hunter or guide is complete
  useEffect(() => {
    const checkProfileSetup = async () => {
      if (user && user.uid) {
        setProfileLoading(true); // Start profile loading
        let docRef;
        try {
          if (user.role === "hunter") {
            docRef = doc(db, `outfitters/${user.outfitterId}/hunters`, user.uid);
          } else if (user.role === "guide") {
            docRef = doc(db, `outfitters/${user.outfitterId}/guides`, user.uid);
          }

          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setAccountSetupComplete(userData.accountSetupComplete || false);

            if (userData.accountSetupComplete) {
              setLoading(false); 
              navigate("/dashboard"); // Redirect to dashboard if profile is complete
            } else {
              setLoading(false); 
              if (user.role === "hunter") {
                navigate("/profile-setup");
              } else if (user.role === "guide") {
                navigate("/guide-profile-setup");
              }
            }
          } else {
            // Profile does not exist, logout and redirect to login
            setLoading(false);
            handleLogout(); // Log them out if the profile is not found
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          setLoading(false);
          handleLogout(); // Log them out in case of error
        } finally {
          setProfileLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (user && (user.role === "hunter" || user.role === "guide")) {
      checkProfileSetup();
    } else {
      setLoading(false);
    }

    // Set up event listeners for user activity
    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keydown", resetTimeout);
    window.addEventListener("click", resetTimeout);

    // Cleanup event listeners and timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keydown", resetTimeout);
      window.removeEventListener("click", resetTimeout);
    };
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Log out the user
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Show loading screen until profile loading is complete
  if (loading || profileLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {!user && (
          <Route
            path="/"
            element={
              <div className="hero-section">
                <div className="hero-content">
                  <img src={wildLogo} alt="Wild Command Logo" className="hero-logo" />
                  <h1 className="hero-title">Conquer the Wild</h1>
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

        {/* Protected Routes based on role */}
        {user && user.role === 'outfitter' && (
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hunters" element={<Hunters />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
            <Route path="/book-hunt" element={<BookHunt />} />
          </Route>
        )}

        {user && user.role === 'hunter' && accountSetupComplete && (
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
            <Route path="/book-hunt" element={<BookHunt />} />
          </Route>
        )}

        {user && user.role === 'guide' && accountSetupComplete && (
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
            <Route path="/book-hunt" element={<BookHunt />} />
          </Route>
        )}

        {/* Guide Profile Setup */}
        {user && user.role === "guide" && !accountSetupComplete && (
          <Route path="/guide-profile-setup" element={<GuideProfileSetup />} />
        )}

        {/* Hunter Profile Setup */}
        {user && user.role === "hunter" && !accountSetupComplete && (
          <Route path="/profile-setup" element={<HunterProfileSetup />} />
        )}

        {!user && (
          <>
            <Route path="/dashboard" element={<Navigate to="/login" />} />
            <Route path="/hunters" element={<Navigate to="/login" />} />
            <Route path="/profile" element={<Navigate to="/login" />} />
            <Route path="/support" element={<Navigate to="/login" />} />
          </>
        )}

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
      </Routes>
    </div>
  );
};

export default App;


















