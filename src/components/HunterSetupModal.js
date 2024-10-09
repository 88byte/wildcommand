import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import './HunterSetupModal.css'; // Optional: Add custom CSS for the modal

const HunterSetupModal = ({ outfitterId, hunterId, onClose }) => {
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission state

  const handleSubmit = async () => {
    setIsSubmitting(true); // Set submitting state
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

      // Close the modal after successful setup
      onClose();
    } catch (error) {
      setError("Failed to complete setup. Please try again.");
      console.error("Error during setup:", error);
    } finally {
      setIsSubmitting(false); // Stop submission state
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Complete Your Hunter Setup</h2>
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
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting} // Disable button during submission
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default HunterSetupModal;
