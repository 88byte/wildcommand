import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import './HunterSetup.css'; // Import the custom CSS for styling

const HunterSetup = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hunterId = queryParams.get('hunterId');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHunterData = async () => {
      try {
        const docRef = doc(db, 'outfitters', 'outfitterId', 'hunters', hunterId);
        const hunterDoc = await getDoc(docRef);
        if (hunterDoc.exists()) {
          setEmail(hunterDoc.data().email);
        } else {
          setError('Hunter not found.');
        }
      } catch (err) {
        setError('Failed to load hunter data.');
      }
    };
    fetchHunterData();
  }, [hunterId]);

  const handleSubmit = async () => {
    if (!password || !address || !city || !state || !country || !licenseNumber) {
      setError('All fields are required.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateDoc(doc(db, 'outfitters', 'outfitterId', 'hunters', hunterId), {
        address,
        city,
        state,
        country,
        licenseNumber,
        accountSetupComplete: true,
      });

      await updatePassword(user, password);

      navigate('/hunter-dashboard');
    } catch (error) {
      setError('Error setting up your account. Please try again.');
      console.error('Error updating hunter info:', error);
    }
  };

  return (
    <div className="hunter-setup-container">
      <h1>Complete Your Account Setup</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="form-container">
        <input
          type="password"
          placeholder="Set Your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          placeholder="Home Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          type="text"
          placeholder="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <input
          type="text"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <input
          type="text"
          placeholder="Hunting License Number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
        />
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default HunterSetup;
