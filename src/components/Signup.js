import React, { useState } from 'react';
import { auth, db, storage, functions } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // For navigation after sign-up
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Use Firebase storage methods
import { httpsCallable } from 'firebase/functions'; // For Firebase functions

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [preferredCommunication, setPreferredCommunication] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate(); // Initialize useNavigate for back button

  const handleLogoChange = (e) => {
    setLogoFile(e.target.files[0]);
  };

  const signupOutfitter = async (email, password, outfitterData, logoFile) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const setRole = httpsCallable(functions, 'setUserRole');
      await setRole({
        uid: user.uid,
        role: 'outfitter',
        outfitterId: user.uid,
      });

      await user.getIdToken(true);

      let logoUrl = '';
      if (logoFile) {
        const storageRef = ref(storage, `outfitters/${user.uid}/logo.png`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const outfitterDataWithLogo = {
        email: user.email,
        createdAt: new Date(),
        logoUrl,
        contactDetails: outfitterData.contactDetails,
        customSettings: outfitterData.customSettings,
      };

      await setDoc(doc(db, 'outfitters', user.uid), outfitterDataWithLogo);

      // Navigate to dashboard after successful signup
      navigate('/dashboard');
    } catch (err) {
      console.error('Error during signup:', err.message);
      setError('Error during signup: ' + err.message);
    }
  };

  const handleSignup = async () => {
    const outfitterData = {
      contactDetails: {
        address,
        phone,
        website,
      },
      customSettings: {
        timeZone,
        preferredCommunication,
      },
    };

    try {
      await signupOutfitter(email, password, outfitterData, logoFile);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">Create an Outfitter Account</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email" className="label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Create a password"
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
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="text"
            id="phone"
            name="phone"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            placeholder="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="timeZone">Time Zone</label>
          <input
            type="text"
            id="timeZone"
            name="timeZone"
            placeholder="Time Zone"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="preferredCommunication">Preferred Communication</label>
          <input
            type="text"
            id="preferredCommunication"
            name="preferredCommunication"
            placeholder="Preferred Communication (Email, Phone)"
            value={preferredCommunication}
            onChange={(e) => setPreferredCommunication(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="logo">Upload Logo</label>
          <input
            type="file"
            id="logo"
            name="logo"
            accept="image/*"
            onChange={handleLogoChange}
            className="input-field"
          />
        </div>
        <button className="submit-btn" onClick={handleSignup}>
          Sign Up
        </button>

        <button className="back-btn" onClick={() => navigate('/')}>
          Back
        </button>
      </div>
    </div>
  );
};

export default Signup;
