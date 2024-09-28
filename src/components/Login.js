// src/components/Login.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title heading">Log In</h2>
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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button className="submit-btn" onClick={handleLogin}>
          Log In
        </button>
      </div>
    </div>
  );
};

export default Login;
