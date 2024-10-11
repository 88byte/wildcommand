import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Only keeping the needed auth methods
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handle login with email/password
  const handleEmailPasswordLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">Email/Password Login</h2>
        {error && <p className="error-message">{error}</p>}
        
        {/* Email input field */}
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

        {/* Password input field */}
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

        <button className="submit-btn" onClick={handleEmailPasswordLogin}>
          Log In
        </button>

        {/* Back button */}
        <button className="back-btn" onClick={() => navigate('/')}>
          Back
        </button>
      </div>
    </div>
  );
};

export default Login;

