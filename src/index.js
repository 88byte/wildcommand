// src/index.js
import React from 'react';           // Import React for JSX syntax
import ReactDOM from 'react-dom';    // Import ReactDOM to render React components to the DOM
import './index.css';                // Import global CSS (optional)
import App from './App';             // Import the root App component

// Render the App component inside the 'root' element in index.html
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
