// src/components/HuntLogForm.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const HuntLogForm = () => {
  const [clientName, setClientName] = useState('');
  const [outcome, setOutcome] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleLog = async () => {
    try {
      await addDoc(collection(db, 'huntLogs'), {
        clientName,
        outcome,
        location,
      });
      setClientName('');
      setOutcome('');
      setLocation('');
      console.log('Hunt log added successfully');
    } catch (err) {
      setError(err.message);
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
        placeholder="Outcome"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button onClick={handleLog}>Submit Log</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default HuntLogForm;
