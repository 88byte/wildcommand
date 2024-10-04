// src/components/BookingForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const BookingForm = () => {
  const [clientName, setClientName] = useState('');
  const [huntDate, setHuntDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');  // Optional, use if needed

  const handleBooking = async () => {
    try {
      await addDoc(collection(db, 'bookings'), {
        clientName,
        huntDate,
        location
      });
      setClientName('');  // Clear form
      setHuntDate('');
      setLocation('');
    } catch (err) {
      setError(err.message);  // Capture and set error message if necessary
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Book a Hunt</h2>
        <div className="form-group">
          <input
            type="text"
            placeholder="Client Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <input
            type="date"
            value={huntDate}
            onChange={(e) => setHuntDate(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field"
          />
        </div>
        {error && <p className="error-message">{error}</p>} {/* Show error if exists */}
        <button className="submit-btn" onClick={handleBooking}>
          Book Hunt
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
