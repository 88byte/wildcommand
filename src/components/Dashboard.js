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


  // Fetch hunts from Firestore
  const fetchHunts = async () => {
    try {
      const currentUser = auth.currentUser || user;

      if (currentUser) {
        const token = await currentUser.getIdTokenResult();
        const outfitterId = token.claims.outfitterId || token.claims.uid;

        const huntsCollectionRef = collection(db, `outfitters/${outfitterId}/bookings`);
        const huntsSnapshot = await getDocs(huntsCollectionRef);

        const huntData = huntsSnapshot.docs.map((doc) => {
          const data = doc.data();
          const date = data.date; // Should be in YYYY-MM-DD format
          const startTime = data.startTime; // Should be a valid time string

          if (date && startTime) {
            const dateTimeString = `${date}T${startTime}`;
            const startDateTime = new Date(dateTimeString);

            if (!isNaN(startDateTime.getTime())) {
              const endDateTime = new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000);

              return {
                id: doc.id,
                name: data.huntType,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
                location: data.location,
                notes: data.notes || '',
                outfitterId,
                startTime: startTime, // Keep it simple if you need to display it
                endTime: endDateTime.toISOString(), // Save this if needed
              };
            } else {
              console.error(`Invalid Date object created for booking with ID: ${doc.id}`);
            }
          } else {
            console.error(`Missing or invalid date/startTime for booking with ID: ${doc.id}`, { date, startTime });
          }

          return null;
        });

        const validHuntData = huntData.filter((hunt) => hunt !== null);
        setHunts(validHuntData); // Store only valid hunts
      }
    } catch (error) {
      console.error('Error fetching hunts:', error);
    }
  };

  // Call fetchHunts inside useEffect when the component loads
  useEffect(() => {
    fetchHunts();
  }, [user]);





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
                  {hunts.length === 0 ? (
                    <p>No upcoming hunts. Start booking now!</p>
                  ) : (
                    hunts.map((hunt, index) => (
                      <div key={index} className="hunt-card-item">
                        <p><strong>{hunt.name}</strong></p>
                        <p>{new Date(hunt.startTime).toLocaleString()}</p>
                      </div>
                    ))
                  )}
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





  // Delete hunt logic
  const handleDeleteHunt = (huntId) => {
    // Logic to delete the hunt (e.g., delete from Firestore)
    setHunts((prevHunts) => prevHunts.filter((hunt) => hunt.id !== huntId));
    console.log('Hunt deleted:', huntId);
  };

  return (
    <div className="main-content">
      <h1>Dashboard</h1>
      <HuntCalendar
        hunts={hunts}
        onHuntSave={handleSaveHunt} // Pass the save function as a prop
        onHuntDelete={handleDeleteHunt} // Pass the delete function as a prop
        fetchHunts={fetchHunts} // Pass fetchHunts as a prop
      />
    </div>
  );
};

export default Dashboard;


