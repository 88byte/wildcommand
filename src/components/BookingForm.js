// src/components/BookingForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const BookingForm = () => {
  const [clientName, setClientName] = useState('');
  const [huntDate, setHuntDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleBooking = async () => {
    try {
      await addDoc(collection(db, 'bookings'), {
        clientName,
        huntDate,
        location,
      });
      setClientName('');
      setHuntDate('');
      setLocation('');
      console.log('Booking added successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Book a Hunt</h2>
      <input
        type="text"
        placeholder="Client Name"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />
      <input
        type="date"
        value={huntDate}
        onChange={(e) => setHuntDate(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button onClick={handleBooking}>Book Hunt</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default BookingForm;
