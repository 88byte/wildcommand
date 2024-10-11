import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { auth } from '../firebase';
import wildLogo from '../images/wildlogo.png';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to toggle sidebar

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdTokenResult();
        setUserRole(token.claims.role);
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderNavigation = () => {
    switch (userRole) {
      case 'outfitter':
        return (
          <>
            <li onClick={() => navigate('/dashboard')}>Dashboard</li>
            <li onClick={() => navigate('/hunters')}>Hunters</li>
            <li>Guides</li>
            <li>Book Hunt</li>
            <li>Log Hunt</li>
            <li onClick={() => navigate('/profile')}>Profile</li>
            <li onClick={() => navigate('/support')}>Support</li>
          </>
        );
      case 'hunter':
        return (
          <>
            <li onClick={() => navigate('/dashboard')}>Dashboard</li>
            <li onClick={() => navigate('/profile')}>Profile</li>
            <li onClick={() => navigate('/support')}>Support</li>
          </>
        );
      case 'guide':
        return (
          <>
            <li onClick={() => navigate('/dashboard')}>Dashboard</li>
            <li>Calendar</li>
            <li>Book Hunt</li>
            <li>Log Hunt</li>
            <li onClick={() => navigate('/profile')}>Profile</li>
            <li onClick={() => navigate('/support')}>Support</li>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Toggle button for mobile sidebar */}
      <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <img src={wildLogo} alt="Wild Command Logo" className="sidebar-logo" />
        </div>
        <nav className="nav-menu">
          <ul>{renderNavigation()}</ul>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
