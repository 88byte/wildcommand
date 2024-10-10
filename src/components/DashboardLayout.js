import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { auth } from '../firebase';
import wildLogo from '../images/wildlogo.png';
import './DashboardLayout.css'; // Custom CSS for DashboardLayout

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null); // Track the user role

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        // Get user token and custom claims
        const token = await user.getIdTokenResult();
        setUserRole(token.claims.role); // Set the role based on the custom claim
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

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <img src={wildLogo} alt="Wild Command Logo" className="sidebar-logo" />
        </div>
        <nav className="nav-menu">
          <ul>
            <li onClick={() => navigate('/dashboard')}>Dashboard</li>

            {/* Render different navigation items based on user role */}
            {userRole === 'outfitter' && (
              <>
                <li onClick={() => navigate('/hunters')}>Hunters</li>
                <li>Guides</li>
                <li>Book Hunt</li>
                <li>Log Hunt</li>
              </>
            )}

            {userRole === 'hunter' && (
              <>
                <li onClick={() => navigate('/profile')}>Profile</li>
                <li onClick={() => navigate('/support')}>Support</li>
              </>
            )}

            {userRole === 'guide' && (
              <>
                <li>Calendar</li>
                <li>Book Hunt</li>
                <li>Log Hunt</li>
              </>
            )}

            {/* Common items for all roles */}
            <li>Support</li>
          </ul>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Use the Outlet component here to render nested routes */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;

