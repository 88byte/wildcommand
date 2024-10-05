import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; // Ensure 'auth' is imported here
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import './HunterSetup.css'; // Import the CSS for styling

const HunterSetup = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Get hunterId and outfitterId from the URL query parameters
  const hunterId = queryParams.get('hunterId');
  const outfitterId = queryParams.get('outfitterId'); // Fetch outfitterId from the URL

  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch hunter data using hunterId and outfitterId from the URL
  useEffect(() => {
    const fetchHunterData = async () => {
      try {
        if (!outfitterId || !hunterId) {
          setError('Outfitter ID or Hunter ID is missing.');
          return;
        }

        // Fetch hunter data from Firestore using outfitterId and hunterId
        const docRef = doc(db, 'outfitters', outfitterId, 'hunters', hunterId); 
        const hunterDoc = await getDoc(docRef);

        if (hunterDoc.exists()) {
          const hunterData = hunterDoc.data();
          setEmail(hunterData.email); // Set hunter's email in the form
        } else {
          setError('Hunter not found.');
        }
      } catch (err) {
        setError('Failed to load hunter data.');
      }
    };

    fetchHunterData();
  }, [outfitterId, hunterId]);

  const handleSubmit = async () => {
    if (!password || !address || !city || !state || !country || !licenseNumber) {
      setError('All fields are required.');
      return;
    }

    try {
      const user = auth.currentUser; // Fetch the current authenticated user

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

      // Redirect to hunter's dashboard after setup completion
      navigate('/hunter-dashboard');
    } catch (error) {
      setError('Error setting up your account. Please try again.');
      console.error('Error updating hunter info:', error);
    }
  };

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
