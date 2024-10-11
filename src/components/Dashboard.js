import React, { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import './Dashboard.css';
import HuntCalendar from './Calendar'; // Import the calendar component

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardContent, setDashboardContent] = useState(null);
  const [hunts, setHunts] = useState([]); // State to store hunts

  // Fetch hunts (you can replace this with your actual hunts fetching logic)
  useEffect(() => {
    const fetchHunts = async () => {
      // Simulate fetching hunts data
      const huntData = [
        {
          name: 'Elk Hunt',
          startTime: '2024-10-15T10:00:00',
          endTime: '2024-10-15T18:00:00',
        },
        {
          name: 'Deer Hunt',
          startTime: '2024-10-16T08:00:00',
          endTime: '2024-10-16T14:00:00',
        },
      ];
      setHunts(huntData); // Store the hunts in state
    };

    fetchHunts();
  }, []);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'outfitter':
          setDashboardContent(
            <div className="dashboard-content">
              {/* Upcoming Hunts Section */}
              <div className="content-section">
                <h2>Upcoming Hunts</h2>
                <div className="hunt-card">
                  <p>No upcoming hunts. Start booking now!</p>
                </div>
              </div>

              {/* Calendar Section */}
              <div className="content-section calendar-section">
                <h2>Calendar</h2>
                <HuntCalendar hunts={hunts} /> {/* Pass hunts to the calendar */}
              </div>
            </div>
          );
          break;

        case 'guide':
          setDashboardContent(
            <div className="dashboard-content">
              <div className="content-section">
                <h2>Your Schedule</h2>
                <button onClick={() => alert('View Schedule')}>View Schedule</button>
              </div>
              <div className="content-section">
                <h2>Log a Hunt</h2>
                <button onClick={() => alert('Log Hunt')}>Log Hunt</button>
              </div>
            </div>
          );
          break;

        case 'hunter':
          setDashboardContent(
            <div className="dashboard-content">
              <div className="content-section">
                <h2>Upcoming Hunts</h2>
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
  }, [user, hunts]);

  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      {dashboardContent ? dashboardContent : <p>Loading...</p>}
    </div>
  );
};

export default Dashboard;

