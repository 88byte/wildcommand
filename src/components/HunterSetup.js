import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import './HunterSetup.css';

const HunterSetup = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const outfitterId = queryParams.get('outfitterId');
  const hunterId = queryParams.get('hunterId');

  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch hunter data and allow updating their profile
  useEffect(() => {
    const fetchHunterData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("User not authenticated");
        }

        const docRef = doc(db, 'outfitters', outfitterId, 'hunters', hunterId);
        const hunterDoc = await getDoc(docRef);

        if (hunterDoc.exists()) {
          const hunterData = hunterDoc.data();
          setAddress(hunterData.address || '');
          setCity(hunterData.city || '');
          setState(hunterData.state || '');
          setCountry(hunterData.country || '');
          setLicenseNumber(hunterData.licenseNumber || '');
        } else {
          setError('Hunter not found.');
        }
      } catch (err) {
        setError('Failed to load hunter data.');
      }
      setIsLoading(false);
    };

    fetchHunterData();
  }, [outfitterId, hunterId]);

  const handleSubmit = async () => {
	  try {
	    const user = auth.currentUser;
	    if (!user) throw new Error("User not authenticated");

	    // Update hunter's details in Firestore
	    const docRef = doc(db, 'outfitters', outfitterId, 'hunters', hunterId);
	    await updateDoc(docRef, {
	      address, city, state, country, licenseNumber,
	      accountSetupComplete: true // Mark account setup as complete
	    });

	    // Set the new password
	    await updatePassword(user, password);

	    // Redirect to the hunter's dashboard
	    navigate('/hunter-dashboard');
	  } catch (error) {
	    setError("Failed to complete setup");
	    console.error("Error during setup:", error);
	  }
	};


  if (isLoading) return <p>Loading...</p>;

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

