import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../authContext';
import { useNavigate } from 'react-router-dom';
import './HunterProfileSetup.css';

const HunterProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [experience, setExperience] = useState('');
  const [preferences, setPreferences] = useState('');
  const [availability, setAvailability] = useState('');
  const [error, setError] = useState('');
  const [outfitterId, setOutfitterId] = useState(null);

  useEffect(() => {
    if (user) {
      const claimOutfitterId = user.outfitterId || null; // Use the claims directly from the user object

      if (claimOutfitterId) {
        setOutfitterId(claimOutfitterId);
      } else {
        const url = window.location.href;
        const urlParams = new URLSearchParams(new URL(url).search);
        const urlOutfitterId = urlParams.get('outfitterId');
        if (urlOutfitterId) {
          setOutfitterId(urlOutfitterId);
        } else {
          setError("Outfitter ID not found.");
        }
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!experience || !preferences || !availability) {
      setError('Please fill in all fields');
      return;
    }

    if (!outfitterId) {
      setError("Outfitter ID is missing. Cannot save profile.");
      return;
    }

    try {
      const hunterDocRef = doc(db, `outfitters/${outfitterId}/hunters`, user.uid);

      await setDoc(hunterDocRef, {
        experience,
        preferences,
        availability,
        accountSetupComplete: true,
        updatedAt: new Date(),
      }, { merge: true });

      navigate('/dashboard');
    } catch (err) {
      setError('Error saving profile: ' + err.message);
    }
  };

  return (
    <div className="profile-setup-container">
      <h2>Complete Your Hunter Profile</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="experience">Hunting Experience</label>
          <textarea
            id="experience"
            name="experience"
            placeholder="Describe your hunting experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="input-field"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="preferences">Hunting Preferences</label>
          <textarea
            id="preferences"
            name="preferences"
            placeholder="Describe your preferences (e.g., preferred hunting style, favorite game)"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            className="input-field"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="availability">Availability</label>
          <input
            type="text"
            id="availability"
            name="availability"
            placeholder="Enter your availability (e.g., weekends, specific dates)"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="input-field"
          />
        </div>

        <button type="submit" className="submit-btn">Complete Profile</button>
      </form>
    </div>
  );
};

export default HunterProfileSetup;


