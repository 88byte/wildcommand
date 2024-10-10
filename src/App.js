import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { Route, Routes, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Hunters from "./components/Hunters";
import DashboardLayout from "./components/DashboardLayout";
import HunterProfileSetup from './components/HunterProfileSetup';
import wildLogo from './images/wildlogo.png';
import { db } from "./firebase"; // Firestore database import
import { doc, getDoc } from "firebase/firestore"; // Firestore imports

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
    const urlParams = new URLSearchParams(new URL(url).hash.split("?")[1]);
    return {
      outfitterId: urlParams.get("outfitterId"),
      hunterId: urlParams.get("hunterId"),
    };
  };

  // Check for magic link and handle sign-in
  useEffect(() => {
    const url = window.location.href;
    console.log("Checking for magic link in URL:", url);

    if (isSignInWithEmailLink(auth, url)) {
      let email = window.localStorage.getItem("emailForSignIn");

      if (!email) {
        email = window.prompt("Please provide your email for confirmation");
      }

      signInWithEmailLink(auth, email, url)
        .then(async (result) => {
          console.log("Sign in with email link successful:", result);

          // Clear the email from local storage
          window.localStorage.removeItem("emailForSignIn");

          // Force refresh token to fetch updated claims (ensure claims are updated post-sign-in)
          const tokenResult = await result.user.getIdTokenResult(true);

          // Extract outfitterId and hunterId from the URL or use claims
          const { outfitterId: urlOutfitterId, hunterId: urlHunterId } = extractIdsFromUrl(url);
          const fetchedOutfitterId = tokenResult.claims.outfitterId || urlOutfitterId;
          const fetchedHunterId = tokenResult.claims.hunterId || urlHunterId || result.user.uid;

          console.log("Extracted outfitterId:", fetchedOutfitterId, "hunterId:", fetchedHunterId);

          setOutfitterId(fetchedOutfitterId);
          setHunterId(fetchedHunterId);

          // Handle the redirect based on profile completion
          // Do NOT navigate to the dashboard yet until you verify profile setup
        })
        .catch((error) => {
          console.error("Error signing in with email link:", error.message);
        });
    }
  }, [location, navigate]);

  // Handle authentication state and fetch user claims
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(false);
      if (currentUser) {
        setUser(currentUser);

        // Force refresh token to fetch updated claims
        const token = await currentUser.getIdTokenResult(true);
        const claims = token.claims;

        setUserRole(claims.role || null);
        setOutfitterId(claims.outfitterId || null);

        // Fetch hunter profile from Firestore only after outfitterId is available
        if (claims.role === "hunter") {
          if (outfitterId) {
            try {
              const hunterDocRef = doc(db, `outfitters/${outfitterId}/hunters`, currentUser.uid);
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
                console.log("No such hunter document!");
                setAccountSetupComplete(false);
                navigate("/profile-setup");
              }
            } catch (error) {
              console.error("Error fetching hunter data:", error);
              setAccountSetupComplete(false);
              navigate("/profile-setup");
            }
          } else {
            console.log("OutfitterId not found, cannot fetch hunter data.");
            setAccountSetupComplete(false);
            navigate("/profile-setup");
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
        setAccountSetupComplete(false);
        setOutfitterId(null);
      }
    });
    return () => unsubscribe();
  }, [location, outfitterId, navigate]);

  if (loading) {
    return <div>Loading...</div>; // Optionally show a loading screen while checking authentication
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

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

        {/* Protected Routes for non-hunters */}
        {user && userRole !== "hunter" && (
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hunters" element={<Hunters />} />
          </Route>
        )}

        {/* Hunter Profile Setup Route */}
        {user && userRole === "hunter" && !accountSetupComplete && (
          <Route path="/profile-setup" element={<HunterProfileSetup />} />
        )}

        {/* Hunter Dashboard */}
        {user && userRole === "hunter" && accountSetupComplete && (
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

export default App;






