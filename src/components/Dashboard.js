import React, { useState, useEffect } from 'react';
import { useAuth } from '../authContext'; // Access user role from auth context
import './Dashboard.css'; // Custom CSS for dashboard styles

const Dashboard = () => {
  const { user } = useAuth(); // Get the authenticated user
  const [dashboardContent, setDashboardContent] = useState(null);

  useEffect(() => {
    if (user) {
      // Determine dashboard content based on the user's role
      switch (user.role) {
        case 'outfitter':
          setDashboardContent(
            <div className="content-section">
              <h2>Manage Your Outfit</h2>
              <div className="outfit-card">
                <p>View and manage your hunters, guides, and schedule hunts.</p>
                <button onClick={() => alert('Manage Outfit')}>Manage Outfit</button>
              </div>
              <div className="content-section">
                <h2>Upcoming Hunts</h2>
                <div className="hunt-card">
                  <p>No upcoming hunts. Start booking now!</p>
                </div>
              </div>
            </div>
          );
          break;
        case 'guide':
          setDashboardContent(
            <div className="content-section">
              <h2>Your Schedule</h2>
              <div className="schedule-card">
                <p>View your upcoming hunts and assigned tasks.</p>
                <button onClick={() => alert('View Schedule')}>View Schedule</button>
              </div>
              <div className="content-section">
                <h2>Log a Hunt</h2>
                <div className="log-card">
                  <p>Log hunt details for your recent trips.</p>
                  <button onClick={() => alert('Log Hunt')}>Log Hunt</button>
                </div>
              </div>
            </div>
          );
          break;
        case 'hunter':
          setDashboardContent(
            <div className="content-section">
              <h2>Upcoming Hunts</h2>
              <div className="hunt-card">
                <p>You have no upcoming hunts. Check back later!</p>
                <button onClick={() => alert('View Hunts')}>View Hunts</button>
              </div>
            </div>
          );
          break;
        default:
          setDashboardContent(<p>No dashboard content available for this role.</p>);
          break;
      }
    }
  }, [user]);

  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      {dashboardContent ? dashboardContent : <p>Loading...</p>}
    </div>
  );
};

export default Dashboard;
