import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const BookingForm = () => {
  const [clientName, setClientName] = useState("");
  const [huntDate, setHuntDate] = useState("");
  const [location, setLocation] = useState("");

  const handleBooking = async () => {
    try {
      const docRef = await addDoc(collection(db, "bookings"), {
        clientName: clientName,
        huntDate: huntDate,
        location: location,
      });
      console.log("Booking added with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding booking: ", e);
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
    </div>
  );
};

export default BookingForm;
