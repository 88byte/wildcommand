import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { useAuth } from '../authContext';
import { useNavigate } from 'react-router-dom';
import './GuideProfileSetup.css';

const GuideProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const storage = getStorage(); 

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [guideId, setGuideId] = useState(''); // Guide ID field
  const [licenseValidDate, setLicenseValidDate] = useState(''); // License Valid Date field
  const [licenseState, setLicenseState] = useState(''); // License State field
  const [profilePicture, setProfilePicture] = useState(null); 
  const [profilePictureURL, setProfilePictureURL] = useState(''); 
  const [error, setError] = useState('');
  const [outfitterId, setOutfitterId] = useState(null);

  useEffect(() => {
    if (user) {
      const claimOutfitterId = user.outfitterId || null; 

      if (claimOutfitterId) {
        setOutfitterId(claimOutfitterId);

        // Fetch existing guide profile data from Firestore using UID
        const fetchGuideData = async () => {
          try {
            const guideDocRef = doc(db, `outfitters/${claimOutfitterId}/guides`, user.uid); 
            const guideDocSnap = await getDoc(guideDocRef);

            if (guideDocSnap.exists()) {
              const guideData = guideDocSnap.data();
              setName(guideData.name || '');
              setPhone(guideData.phone || '');
              setAddress(guideData.address || '');
              setGuideId(guideData.guideId || ''); // Pre-fill Guide ID if available
              setLicenseValidDate(guideData.licenseValidDate || ''); // Pre-fill License Valid Date if available
              setLicenseState(guideData.licenseState || ''); // Pre-fill License State if available
              setProfilePictureURL(guideData.profilePictureURL || ''); 
            } else {
              console.log("Guide document does not exist");
            }
          } catch (err) {
            console.error('Error fetching guide data:', err);
          }
        };

        fetchGuideData();
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

    // Check for required fields
    if (!name || !phone || !address || !guideId || !licenseValidDate || !licenseState) {
      setError('Please fill in all required fields');
      return;
    }

    if (!outfitterId) {
      setError("Outfitter ID is missing. Cannot save profile.");
      return;
    }

    try {
      const guideDocRef = doc(db, `outfitters/${outfitterId}/guides`, user.uid);

      const guideDocSnap = await getDoc(guideDocRef);
      if (!guideDocSnap.exists()) {
        setError("Guide document not found, cannot update profile.");
        return;
      }

      let downloadURL = profilePictureURL; 
      if (profilePicture) {
      // Update file path for profile pictures
      const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePicture.name}`);
      const snapshot = await uploadBytes(storageRef, profilePicture);
      downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Profile picture uploaded to:", downloadURL);
    }

      // Guide data with additional fields
      const guideData = {
        name,
        phone,
        address,
        guideId,
        licenseValidDate,
        licenseState,
        profilePictureURL: downloadURL, 
        accountSetupComplete: true,
        updatedAt: new Date(),
      };

      await setDoc(guideDocRef, guideData, { merge: true });

      console.log("Profile successfully updated with accountSetupComplete: true");
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error saving profile: ' + err.message);
    }
  };

  return (
    <div className="profile-setup-container">
      <h2>Complete Your Guide Profile</h2>
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

        {/* Guide ID */}
        <div className="form-group">
          <label htmlFor="guideId">Guide ID #</label>
          <input
            type="text"
            id="guideId"
            name="guideId"
            value={guideId}
            onChange={(e) => setGuideId(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* License Valid Date */}
        <div className="form-group">
          <label htmlFor="licenseValidDate">License Valid Date</label>
          <input
            type="date"
            id="licenseValidDate"
            name="licenseValidDate"
            value={licenseValidDate}
            onChange={(e) => setLicenseValidDate(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* License State */}
        <div className="form-group">
          <label htmlFor="licenseState">License State</label>
          <input
            type="text"
            id="licenseState"
            name="licenseState"
            value={licenseState}
            onChange={(e) => setLicenseState(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Profile Picture Upload */}
        <div className="form-group">
          <label htmlFor="profilePicture">Upload Profile Picture (Required)</label>
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            accept="image/*"
            onChange={handleProfilePictureChange}
            required
          />
        </div>

        <button type="submit" className="submit-btn">Complete Profile</button>
      </form>
    </div>
  );
};

export default GuideProfileSetup;

