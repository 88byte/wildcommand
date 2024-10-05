import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';

const HunterSetup = () => {
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!password || !address || !city || !state || !country || !licenseNumber) {
      setError('All fields are required.');
      return;
    }

    try {
      // Update hunter details in Firestore
      const user = auth.currentUser;
      await updateDoc(doc(db, 'outfitters', 'outfitterId', 'hunters', user.uid), {
        address,
        city,
        state,
        country,
        licenseNumber,
        accountSetupComplete: true,
      });

      // Optionally, update the password
      await updatePassword(user, password);

      navigate('/hunter-dashboard');
    } catch (error) {
      setError('Error updating your profile.');
    }
  };

  return (
    <div>
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
