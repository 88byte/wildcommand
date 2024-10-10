import React from 'react';
import { useAuth } from '../authContext'; // Import to access the user's role
import './Support.css'; // Support-specific styles

const Support = () => {
  const { user } = useAuth(); // Get the authenticated user

  const handleContactSupport = () => {
    // Implement support contact logic, e.g., sending an email or opening a chat
    alert('Support request sent. Our team will contact you shortly.');
  };

  return (
    <div className="support-container">
      <h1>Support</h1>
      {user && user.role === 'outfitter' && (
        <>
          <p>As an outfitter, you can contact our dedicated team for business inquiries and account assistance.</p>
          <p>Please reach out for any questions related to managing your outfit, hunters, or guides.</p>
        </>
      )}

      {user && user.role === 'guide' && (
        <>
          <p>As a guide, you can contact support for help with scheduling, logging hunts, and accessing resources.</p>
          <p>Feel free to ask questions related to your role and responsibilities within the outfit.</p>
        </>
      )}

      {user && user.role === 'hunter' && (
        <>
          <p>As a hunter, you can reach out to support for help with your bookings, profiles, or general inquiries.</p>
          <p>Our team is here to help with any questions or issues you encounter during your hunting experience.</p>
        </>
      )}

      <button onClick={handleContactSupport} className="contact-support-btn">Contact Support</button>
    </div>
  );
};

export default Support;
