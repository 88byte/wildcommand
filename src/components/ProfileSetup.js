import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import './ProfileSetup.css'; // Add your CSS here

const ProfileSetup = ({ outfitterId, hunterId }) => {
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [profilePic, setProfilePic] = useState(null); // Profile picture
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Update hunter's details in Firestore
      const docRef = doc(db, 'outfitters', outfitterId, 'hunters', hunterId);
      await updateDoc(docRef, {
        address,
        city,
        state,
        country,
        licenseNumber,
        profileSetupComplete: true, // Mark profile as complete
      });

      // Update password
      if (password) {
        await updatePassword(user, password);
      }

      // TODO: Handle profile picture upload to Firebase Storage if required

      // Redirect to the dashboard after successful setup
      window.location.href = '/dashboard';
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      console.error("Error during profile setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <h2>Complete Your Profile</h2>
      {error && <p className="error-message">{error}</p>}
      
      <input
        type="password"
        placeholder="Set your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="text"
        placeholder="Address"
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

      {/* Profile picture upload (Optional) */}
      <input
        type="file"
        onChange={(e) => setProfilePic(e.target.files[0])}
      />

      <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
};

export default ProfileSetup;
