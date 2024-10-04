// src/components/BookingList.js
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../authContext';

const BookingList = () => {
  const { user } = useAuth(); // Ensure user is retrieved from context
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (user && user.outfitterId) {
        const querySnapshot = await getDocs(collection(db, `outfitters/${user.outfitterId}/bookings`));
        setBookings(querySnapshot.docs.map((doc) => doc.data()));
      }
    };

    fetchBookings();
  }, [user]);

  if (!user) {
    return <div>Loading...</div>; // Handle the case where user is not yet available
  }

  return (
    <div className="container">
      <h2 className="heading">Booked Hunts</h2>
      <div className="card-list">
        {bookings.map((booking, index) => (
          <div className="card" key={index}>
            <h3 className="card-title">{booking.clientName}</h3>
            <p>Date: {booking.huntDate}</p>
            <p>Location: {booking.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingList;
