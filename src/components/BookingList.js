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
    <div>
      <h2>Booked Hunts</h2>
      <ul>
        {bookings.map((booking, index) => (
          <li key={index}>
            {booking.clientName} - {booking.huntDate} - {booking.location}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingList;
