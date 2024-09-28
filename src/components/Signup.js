// src/components/Signup.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After signing up, write user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date()
      });

      console.log('User signed up and document created successfully');
    } catch (err) {
      setError(err.message);
      console.error('Error signing up:', err);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title heading">Create an Account</h2>
        {error && <p className="text-muted">{error}</p>}
        <div className="form-group">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button className="submit-btn" onClick={handleSignup}>
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Signup;
