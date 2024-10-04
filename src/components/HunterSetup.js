import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';

const HunterSetup = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');  // Get hunterId from query param (acting as a token)

  const [hunterData, setHunterData] = useState(null); // Store hunter's data
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHunterData = async () => {
      try {
        const docRef = doc(db, 'outfitters', 'outfitterId', 'hunters', token);  // Fetch by hunterId (token)
        const hunterDoc = await getDoc(docRef);
        if (hunterDoc.exists()) {
          setHunterData(hunterDoc.data()); // Populate form with hunter data
        } else {
          setError('Hunter not found.');
        }
      } catch (err) {
        setError('Failed to load hunter data.');
      }
    };
    if (token) {
      fetchHunterData();
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!password || !address || !city || !state || !country || !licenseNumber) {
      setError('All fields are required.');
      return;
    }

    try {
      // Create a new Firebase Auth user using the hunter's email and their set password
      const userCredential = await createUserWithEmailAndPassword(auth, hunterData.email, password);

      // Update hunter details in Firestore
      await updateDoc(doc(db, 'outfitters', 'outfitterId', 'hunters', token), {
        address,
        city,
        state,
        country,
        licenseNumber,
        accountSetupComplete: true,
      });

      // Redirect to hunter's dashboard
      navigate('/hunter-dashboard');
    } catch (error) {
      setError('Error updating your account. Please try again.');
      console.error('Error updating hunter info:', error);
    }
  };

  if (!hunterData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="hunter-setup-container">
      <h1>Complete Your Account Setup</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="password" placeholder="Set Your Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="text" placeholder="Home Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
      <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
      <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
      <input type="text" placeholder="Hunting License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default HunterSetup;
