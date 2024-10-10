import React from 'react';
import './Dashboard.css'; // Custom CSS for dashboard styles

const Dashboard = () => {
  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      <div className="content-section">
        <h2>Profile</h2>
        <div className="profile-card">
          <p>Manage your profile and personal information.</p>
          <button>Update Profile</button> {/* Link this to profile update page */}
        </div>
      </div>

      <div className="content-section">
        <h2>Support</h2>
        <div className="support-card">
          <p>If you need help, contact our support team.</p>
          <button>Contact Support</button> {/* Link this to support page */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
