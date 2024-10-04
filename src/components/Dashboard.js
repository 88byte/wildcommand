import React from 'react';
import './Dashboard.css'; // Custom CSS for dashboard styles

const Dashboard = () => {
  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      <div className="content-section">
        <h2>Upcoming Hunts</h2>
        <div className="hunt-card">
          <p>No upcoming hunts. Start booking now!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
