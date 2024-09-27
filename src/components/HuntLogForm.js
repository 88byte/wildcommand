import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const HuntLogForm = () => {
  const [clientName, setClientName] = useState("");
  const [outcome, setOutcome] = useState("");
  const [location, setLocation] = useState("");

  const handleLog = async () => {
    try {
      const docRef = await addDoc(collection(db, "huntLogs"), {
        clientName: clientName,
        outcome: outcome,
        location: location,
      });
      console.log("Hunt log added with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding log: ", e);
    }
  };

  return (
    <div>
      <h2>Submit Hunt Log</h2>
      <input
        type="text"
        placeholder="Client Name"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />
      <input
        type="text"
        placeholder="