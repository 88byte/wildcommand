import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Import getDoc to fetch existing data
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage
import { useAuth } from '../authContext';
import { useNavigate } from 'react-router-dom';
import './HunterProfileSetup.css';

const HunterProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const storage = getStorage(); // Initialize Firebase Storage

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [huntingLicense, setHuntingLicense] = useState('');
  const [profilePicture, setProfilePicture] = useState(null); // Profile picture
  const [profilePictureURL, setProfilePictureURL] = useState(''); // URL of the uploaded profile picture
  const [error, setError] = useState('');
  const [outfitterId, setOutfitterId] = useState(null);

  useEffect(() => {
    if (user) {
      const claimOutfitterId = user.outfitterId || null; // Use the claims directly from the user object

      if (claimOutfitterId) {
        setOutfitterId(claimOutfitterId);

        // Fetch existing hunter profile data from Firestore using UID
        const fetchHunterData = async () => {
          try {
            const hunterDocRef = doc(db, `outfitters/${claimOutfitterId}/hunters`, user.uid); // Use UID
            const hunterDocSnap = await getDoc(hunterDocRef);

            if (hunterDocSnap.exists()) {
              const hunterData = hunterDocSnap.data();
              setName(hunterData.name || '');
              setPhone(hunterData.phone || '');
              setAddress(hunterData.address || '');
              setCity(hunterData.city || '');
              setState(hunterData.state || '');
              setHuntingLicense(hunterData.huntingLicense || '');
              setProfilePictureURL(hunterData.profilePictureURL || ''); // Fetch existing profile picture URL if present
            } else {
              console.log("Hunter document does not exist");
            }
          } catch (err) {
            console.error('Error fetching hunter data:', err);
          }
        };

        fetchHunterData();
      } else {
        console.error("Outfitter ID not found.");
      }
    }
  }, [user]);


  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone || !address || !city || !state || !huntingLicense) {
      setError('Please fill in all required fields');
      return;
    }

    if (!outfitterId) {
      setError("Outfitter ID is missing. Cannot save profile.");
      return;
    }

    try {
      const hunterDocRef = doc(db, `outfitters/${outfitterId}/hunters`, user.uid);

      // Ensure the document already exists to avoid creating a duplicate
      const hunterDocSnap = await getDoc(hunterDocRef);
      if (!hunterDocSnap.exists()) {
        setError("Hunter document not found, cannot update profile.");
        return;
      }

      // Upload profile picture if selected
      let downloadURL = profilePictureURL; // Use existing URL if no new picture is uploaded
      if (profilePicture) {
        const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePicture.name}`);
        const snapshot = await uploadBytes(storageRef, profilePicture);
        downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Profile picture uploaded to:", downloadURL);
      }

      // Save the hunter's data to Firestore and merge with existing data
      const hunterData = {
        name,
        phone,
        address,
        city,
        state,
        huntingLicense,
        profilePictureURL: downloadURL, // Save picture URL in Firestore
        accountSetupComplete: true,
        updatedAt: new Date(),
      };

      // Use merge: true to add these fields to the existing hunter doc without overwriting existing fields
      await setDoc(hunterDocRef, hunterData, { merge: true });

      console.log("Profile successfully updated with accountSetupComplete: true");
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error saving profile: ' + err.message);
    }
  };

  return (
    <div className="profile-setup-container">
      <h2>Complete Your Hunter Profile</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Address */}
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* City */}
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* State */}
        <div className="form-group">
          <label htmlFor="state">State</label>
          <input
            type="text"
            id="state"
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Hunting License */}
        <div className="form-group">
          <label htmlFor="huntingLicense">Hunting License #</label>
          <input
            type="text"
            id="huntingLicense"
            name="huntingLicense"
            value={huntingLicense}
            onChange={(e) => setHuntingLicense(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Profile Picture Upload */}
        <div className="form-group">
          <label htmlFor="profilePicture">Upload Profile Picture (Optional)</label>
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            accept="image/*"
            onChange={handleProfilePictureChange}
          />
        </div>

        <button type="submit" className="submit-btn">Complete Profile</button>
      </form>
    </div>
  );
};

export default HunterProfileSetup;


