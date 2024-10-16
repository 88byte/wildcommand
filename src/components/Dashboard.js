import React, { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import './Dashboard.css';
import { collection, getDocs, doc, updateDoc} from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ensure you import your Firebase auth instance
import HuntCalendar from './Calendar'; // Import the calendar component

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardContent, setDashboardContent] = useState(null);
  const [hunts, setHunts] = useState([]); // State to store hunts


  const fetchHunts = async () => {
    try {
      const currentUser = auth.currentUser || user;

      if (currentUser) {
        const token = await currentUser.getIdTokenResult();
        const outfitterId = token.claims.outfitterId || token.claims.uid;

        console.log("Outfitter ID:", outfitterId); // Check if outfitterId is being fetched correctly

        const huntsCollectionRef = collection(db, `outfitters/${outfitterId}/bookings`);
        const huntsSnapshot = await getDocs(huntsCollectionRef);

        if (huntsSnapshot.empty) {
          console.log("No hunts found for this outfitter.");
          return;
        }

        const huntData = huntsSnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Fetched hunt data:", data); // Log fetched hunt data

          const date = data.date || '';
          const startTime = data.startTime || '';
          const guides = data.guides || [];
          const hunters = data.hunters || [];

          if (date && startTime) {
            const startDateTimeString = `${date}T${startTime}:00`;
            const startDateTime = new Date(startDateTimeString);

            const endDateTimeString = data.endTime ? `${date}T${data.endTime}:00` : '';
            const endDateTime = endDateTimeString ? new Date(endDateTimeString) : new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000);

            if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
              return {
                id: doc.id,
                name: data.huntType,
                start: startDateTime, // Pass Date object
                end: endDateTime, // Pass Date object
                location: data.location,
                notes: data.notes || '',
                guides,
                hunters,
                outfitterId,
                date,
                startTime,
                endTime: endDateTime, // Store as Date object
              };
            } else {
              console.error(`Invalid Date object for booking with ID: ${doc.id}`);
            }
          } else {
            console.error(`Missing or invalid date/startTime for booking with ID: ${doc.id}`);
          }
          return null;
        });

        const validHuntData = huntData.filter((hunt) => hunt !== null);
        console.log("Valid hunts:", validHuntData); // Log the valid hunts fetched

        setHunts(validHuntData);
      }
    } catch (error) {
      console.error('Error fetching hunts:', error);
    }
  };






  // Call fetchHunts inside useEffect when the component loads
  useEffect(() => {
  if (user) {
    fetchHunts();
  }
}, [user]); // Fetch hunts once the user is loaded






  useEffect(() => {
    console.log("User role:", user?.role); // Check the user's role
    if (user && hunts.length > 0) {
      switch (user.role) {
        case 'outfitter':
          setDashboardContent(
            <div className="dashboard-content">
              {/* Upcoming Hunts Section */}
              <div className="content-section">
                <h2>Upcoming Hunts</h2>
                <div className="hunt-card">
                  {hunts.length === 0 ? (
                    <p>No upcoming hunts. Start booking now!</p>
                  ) : (
                    hunts.map((hunt, index) => (
                      <div key={index} className="hunt-card-item">
                        <p><strong>{hunt.name}</strong></p>
                        <p>{hunt.start.toLocaleString()}</p> {/* Use `hunt.start` as a Date object */}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Calendar Section */}
              <div className="content-section calendar-section">
                <h2>Calendar</h2>
                <HuntCalendar 
                  hunts={hunts}
                  fetchHunts={fetchHunts}
                   /> {/* Pass hunts to the calendar */}
              </div>
            </div>
          );
          break;

        // Handle other roles
        case 'guide':
          setDashboardContent(
            <div className="dashboard-content">
              <div className="content-section">
                <h2>Your Schedule</h2>
                <button onClick={() => alert('View Schedule')}>View Schedule</button>
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
  }, [user, hunts]); // Ensure that `hunts` is included in the dependency array


  // Save hunt logic
  const handleSaveHunt = async (updatedHunt) => {
    if (updatedHunt.id) {
      try {
        // Update the booking document in Firestore
        const huntRef = doc(db, 'outfitters', updatedHunt.outfitterId, 'bookings', updatedHunt.id);
        await updateDoc(huntRef, {
          huntType: updatedHunt.name, // Ensure you're updating the correct fields
          location: updatedHunt.location,
          date: updatedHunt.date, // Explicitly include the date field here
          startTime: updatedHunt.startTime,
          endTime: updatedHunt.endTime,
          notes: updatedHunt.notes,
        });
        console.log('Hunt successfully updated:', updatedHunt);

        // Refresh the hunts after saving
        fetchHunts(); // Fetch updated hunts data
      } catch (error) {
        console.error('Error updating hunt in Firestore:', error);
      }
    } else {
      console.error('Hunt ID is missing, unable to update');
    }
  };

  const fetchGuides = async () => {
  try {
    const currentUser = auth.currentUser || user;

    if (currentUser) {
      const token = await currentUser.getIdTokenResult();
      const outfitterId = token.claims.outfitterId || token.claims.uid;

      const guidesCollectionRef = collection(db, `outfitters/${outfitterId}/guides`);
      const guidesSnapshot = await getDocs(guidesCollectionRef);

      const guidesData = guidesSnapshot.docs.map((doc) => ({
        label: `${doc.data().name} (${doc.data().email})`,
        value: doc.id,
      }));

      return guidesData;
    }
  } catch (error) {
    console.error('Error fetching guides:', error);
    return [];
  }
};






  // Delete hunt logic
  const handleDeleteHunt = (huntId) => {
    // Logic to delete the hunt (e.g., delete from Firestore)
    setHunts((prevHunts) => prevHunts.filter((hunt) => hunt.id !== huntId));
    console.log('Hunt deleted:', huntId);
  };

  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      {dashboardContent ? dashboardContent : <p>Loading dashboard...</p>}
      
  
    </div>
  );
};

export default Dashboard;


