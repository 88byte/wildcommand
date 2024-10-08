import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'; // Import all needed auth methods
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Add password state for standard login
  const [error, setError] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(false); // Toggle between magic link and password login
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

  // Handle sending magic link
  const handleSendMagicLink = async () => {
    try {
      const actionCodeSettings = {
        url: 'https://wildcommand.com/#/hunter-setup', // Redirect to hunter setup or dashboard if already setup
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email); // Store email for sign-in link flow
      alert('Magic link sent! Check your email.');
    } catch (err) {
      setError('Failed to send sign-in link: ' + err.message);
    }
  };

  // Handle magic link login if user clicks the link
  const handleMagicLinkLogin = async () => {
    try {
      const storedEmail = window.localStorage.getItem('emailForSignIn');
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const emailToUse = storedEmail || window.prompt('Please provide your email for confirmation');
        const result = await signInWithEmailLink(auth, emailToUse, window.location.href);
        window.localStorage.removeItem('emailForSignIn'); // Clean up local storage
        setEmail(result.user.email);
        navigate('/dashboard'); // Redirect after successful login
      }
    } catch (err) {
      setError('Failed to sign in with magic link: ' + err.message);
    }
  };

  // Toggle login mode between email/password and magic link
  const toggleLoginMode = () => setIsMagicLink(!isMagicLink);

  return (
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">{isMagicLink ? 'Magic Link Login' : 'Email/Password Login'}</h2>
        {error && <p className="error-message">{error}</p>}
        
        {/* Common email input field */}
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

        {!isMagicLink && (
          <>
            {/* Password input for standard login */}
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
          </>
        )}

        {isMagicLink && (
          <button className="submit-btn" onClick={handleSendMagicLink}>
            Send Magic Link
          </button>
        )}

        {/* Toggle between login methods */}
        <button className="toggle-btn" onClick={toggleLoginMode}>
          {isMagicLink ? 'Use Email/Password Login' : 'Use Magic Link Login'}
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

