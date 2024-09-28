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
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Submit Hunt Log</h2>
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
            type="text"
            placeholder="Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
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
        <button className="submit-btn" onClick={handleLog}>
          Submit Log
        </button>
      </div>
    </div>
  );
};

export default HuntLogForm;
