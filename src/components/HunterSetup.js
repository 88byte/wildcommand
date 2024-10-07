import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, onAuthStateChanged } from 'firebase/auth'; // Make sure to import onAuthStateChanged
import './HunterSetup.css';

const HunterSetup = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Get outfitterId and hunterId from URL query params
  const outfitterId = queryParams.get('outfitterId'); 
  const hunterId = queryParams.get('hunterId');

  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add a loading state
  const navigate = useNavigate();

  // Fetch hunter data using outfitterId and hunterId from the URL
  useEffect(() => {
    const fetchHunterData = async () => {
      try {
        if (!outfitterId || !hunterId) {
          setError('Outfitter ID or Hunter ID is missing.');
          return;
        }

        // Check if the user is authenticated
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const docRef = doc(db, 'outfitters', outfitterId, 'hunters', hunterId);
            const hunterDoc = await getDoc(docRef);

            if (hunterDoc.exists()) {
              const hunterData = hunterDoc.data();
              setEmail(hunterData.email);
            } else {
              setError('Hunter not found.');
            }
          } else {
            // If the user is not authenticated, redirect to login page
            navigate('/login');
          }
          setIsLoading(false); // Stop loading after authentication check
        });
      } catch (err) {
        setError('Failed to load hunter data.');
        setIsLoading(false);
      }
    };

    fetchHunterData();
  }, [outfitterId, hunterId, navigate]);

  const handleSubmit = async () => {
    if (!password || !address || !city || !state || !country || !licenseNumber) {
      setError('All fields are required.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated. Please log in.');
        return;
      }

      // Update hunter details in Firestore
      await updateDoc(doc(db, 'outfitters', outfitterId, 'hunters', hunterId), {
        address,
        city,
        state,
        country,
        licenseNumber,
        accountSetupComplete: true,
      });

      // Update hunter password in Firebase Auth
      await updatePassword(user, password);

      // Redirect to hunter's dashboard
      navigate('/hunter-dashboard');
    } catch (error) {
      setError('Error setting up your account. Please try again.');
      console.error('Error updating hunter info:', error);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">Complete Your Hunter Setup</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Set your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            placeholder="Home address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="state">State</label>
          <input
            type="text"
            id="state"
            name="state"
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input
            type="text"
            id="country"
            name="country"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="licenseNumber">Hunting License Number</label>
          <input
            type="text"
            id="licenseNumber"
            name="licenseNumber"
            placeholder="Hunting License Number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="input-field"
          />
        </div>
        <button className="submit-btn" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default HunterSetup;
