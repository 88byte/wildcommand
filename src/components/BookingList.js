// src/components/BookingList.js
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      setBookings(querySnapshot.docs.map((doc) => doc.data()));
    };

    fetchBookings();
  }, []);

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
