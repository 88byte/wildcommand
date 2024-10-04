import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for back navigation

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate for back navigation

  const handleLogin = async () => {
    try {
      // Step 1: Attempt to log in the user
      await signInWithEmailAndPassword(auth, email, password);

      // Step 2: After successful login, navigate to the dashboard
      navigate('/dashboard');
    } catch (err) {
      // Handle any login errors
      setError('Failed to log in: ' + err.message);
    }
  };

  return (
    <div className="page-container"> {/* This centers the form */}
      <div className="form-container">
        <h2 className="form-title">Log In</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email" className="label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button className="submit-btn" onClick={handleLogin}>
          Log In
        </button>

        {/* Back button */}
        <button className="back-btn" onClick={() => navigate('/')}>
          Back
        </button> {/* Navigate back to the homepage */}
      </div>
    </div>
  );
};

export default Login;
