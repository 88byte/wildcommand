import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { useAuth } from '../authContext';
import { db } from '../firebase';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth(); // Get the authenticated user
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setError('User not found');
        setLoading(false);
        return;
      }

      try {
        let userDocRef;

        // Fetch the correct profile data based on the user's role
        if (user.role === 'outfitter') {
          userDocRef = doc(db, `outfitters`, user.uid);
        } else if (user.role === 'guide') {
          userDocRef = doc(db, `outfitters/${user.outfitterId}/guides`, user.uid);
        } else if (user.role === 'hunter') {
          userDocRef = doc(db, `outfitters/${user.outfitterId}/hunters`, user.uid);
        } else {
          setError('Invalid user role');
          setLoading(false);
          return;
        }

        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setProfileData(userDocSnap.data());
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        setError('Failed to fetch profile');
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      {profileData ? (
        <div className="profile-info">
          <p><strong>Name:</strong> {profileData.name}</p>
          <p><strong>Email:</strong> {profileData.email}</p>
          <p><strong>Phone:</strong> {profileData.phone}</p>
          {/* Add more profile fields as needed */}
        </div>
      ) : (
        <p>No profile data available.</p>
      )}
    </div>
  );
};

export default Profile;

