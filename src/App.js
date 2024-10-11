import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, Link, useNavigate } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Hunters from "./components/Hunters";
import Profile from './components/Profile'; // Import the new Profile component
import Support from './components/Support'; // Import the new Support component
import DashboardLayout from "./components/DashboardLayout";
import HunterProfileSetup from './components/HunterProfileSetup';
import wildLogo from './images/wildlogo.png';
import { db } from "./firebase"; // Firestore database
import { doc, getDoc } from "firebase/firestore"; // Firestore imports
import { useAuth } from './authContext'; // Import useAuth to access the user from context

const App = () => {
  const { user } = useAuth(); // Get user from the AuthContext
  const [loading, setLoading] = useState(true); // General loading state
  const [accountSetupComplete, setAccountSetupComplete] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false); // Profile loading state for hunters
  const navigate = useNavigate();

  // Check if the hunter's profile setup is complete
  useEffect(() => {
    const checkProfileSetup = async () => {
      if (user && user.role === "hunter" && user.uid) {
        setProfileLoading(true);
        try {
          const hunterDocRef = doc(db, `outfitters/${user.outfitterId}/hunters`, user.uid);
          const hunterDocSnap = await getDoc(hunterDocRef);

          if (hunterDocSnap.exists()) {
            const hunterData = hunterDocSnap.data();
            setAccountSetupComplete(hunterData.accountSetupComplete || false);

            // Redirect based on account setup status
            if (hunterData.accountSetupComplete) {
              navigate("/dashboard");
            } else {
              navigate("/profile-setup");
            }
          } else {
            setAccountSetupComplete(false);
            navigate("/profile-setup");
          }
        } catch (error) {
          console.error("Error fetching hunter data:", error);
          setAccountSetupComplete(false);
          navigate("/profile-setup");
        } finally {
          setProfileLoading(false); // Stop profile loading
        }
      } else {
        setLoading(false); // Stop loading if user is not a hunter or user is null
      }
    };

    if (user && user.role === "hunter") {
      checkProfileSetup();
    } else {
      setLoading(false); // Stop loading when no user is found
    }
  }, [user, navigate]);

  // Adjust loading states based on conditions
  if (loading || profileLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Home page '/' */}
        {!user && (
          <Route
            path="/"
            element={
              <div className="hero-section">
                <div className="hero-content">
                  <img src={wildLogo} alt="Wild Command Logo" className="hero-logo" />
                  <h1 className="hero-title">Conquer the Wild</h1>
                  <h2 className="hero-subtitle">Command the Hunt......</h2>
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

        {/* Protected Routes for all roles */}
        {user && (
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hunters" element={<Hunters />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
          </Route>
        )}

        {/* Hunter Profile Setup Route */}
        {user && user.role === "hunter" && !accountSetupComplete && (
          <Route path="/profile-setup" element={<HunterProfileSetup />} />
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

export default App;














