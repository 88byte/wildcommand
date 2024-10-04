import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './authContext'; // Import AuthProvider

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider> {/* Wrap the app inside AuthProvider */}
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
