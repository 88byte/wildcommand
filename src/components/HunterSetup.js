import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth';

const HunterSetup = () => {
  const { hunterId } = useParams();
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState(''); // Add email for authentication
  const [error, setError] = useState(null); // Handle errors
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHunterData = async () => {
      try {
        const docRef = doc(db, 'outfitters', 'outfitterId', 'hunters', hunterId); // Make sure to pass the outfitterId correctly
        const hunterDoc = await getDoc(docRef);
        if (hunterDoc.exists()) {
          setEmail(hunterDoc.data().email); // Assuming the hunter's email is in Firestore
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
      // Sign in the hunter using their email and a default password
      await signInWithEmailAndPassword(auth, email, password);

      // Update hunter details in Firestore
      await updateDoc(doc(db, 'outfitters', 'outfitterId', 'hunters', hunterId), {
        address,
        city,
        state,
        country,
        licenseNumber,
        accountSetupComplete: true,
      });

      // Update hunter password in Firebase Auth
      const user = auth.currentUser;
      await updatePassword(user, password);

      // Redirect to hunter's dashboard
      navigate('/hunter-dashboard');
    } catch (error) {
      setError('Error updating your account. Please try again.');
      console.error('Error updating hunter info:', error);
    }
  };

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
