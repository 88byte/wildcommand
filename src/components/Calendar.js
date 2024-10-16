import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css'; // For custom styling
import HuntModal from './HuntModal'; // Modal component for editing hunt details
import { doc, deleteDoc } from 'firebase/firestore'; // Import Firebase functions
import { db, auth} from '../firebase'; // Import the Firestore instance (db)

const localizer = momentLocalizer(moment);

// Update to accept `fetchHunts` as a prop
const HuntCalendar = ({ hunts, onHuntSave, onHuntUpdate, onHuntDelete, fetchHunts }) => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH); // Track the current view (Month by default)
  const [dropdownOpen, setDropdownOpen] = useState(false); // Track dropdown state
  const [selectedHunt, setSelectedHunt] = useState(null); // Selected hunt for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Track modal state

  useEffect(() => {
    if (hunts && hunts.length > 0) {
      const formattedEvents = hunts.map((hunt) => {
        console.log("Hunt Data:", hunt);

        if (!hunt.date || hunt.date.trim() === '' || !hunt.startTime || hunt.startTime.trim() === '') {
          console.warn(`Missing or invalid date/startTime for hunt: ${hunt.name}`);
          return null;
        }

        // Combine `date` and `startTime` to create a Date object
        const startTime = new Date(`${hunt.date}T${hunt.startTime}:00`);
        const endTime = hunt.endTime ? new Date(hunt.endTime) : new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // Default to 4 hours later if endTime not provided

        // Validate that both startTime and endTime are Date objects
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.error(`Invalid startTime/endTime for hunt: ${hunt.name}`);
          return null;
        }

        return {
          id: hunt.id,
          title: hunt.name || 'Hunt',
          start: startTime, // Ensure this is a Date object
          end: endTime, // Ensure this is a Date object
          allDay: false,
          ...hunt, // Include all other hunt details
        };
      }).filter((event) => event !== null);

      setEvents(formattedEvents);
    }
  }, [hunts]);











   // Toggle dropdown on mobile
  const toggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState);
  };

  // Handle view change from dropdown
  const handleViewChange = (e) => {
    const selectedView = e.target.value;
    setView(selectedView); // Update the view state based on dropdown selection
  };

  // Handle event (hunt) click to open the modal
  const handleSelectEvent = (event) => {
    setSelectedHunt(event); // Pass the selected hunt to the modal
    setIsModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setSelectedHunt(null); // Close the modal
  };

  const handleSaveHunt = (updatedHunt) => {
    onHuntSave(updatedHunt); // Call the parent function to save the updated hunt
    setSelectedHunt(null); // Close the modal after saving
  };

  const handleDeleteHunt = async (huntId) => {
    try {
      const currentUser = auth.currentUser; // Assuming `auth` is imported from Firebase auth
      const token = await currentUser.getIdTokenResult();
      const outfitterId = token.claims.outfitterId || token.claims.uid; // Retrieve the outfitterId from token claims

      const huntRef = doc(db, 'outfitters', outfitterId, 'bookings', huntId);
      await deleteDoc(huntRef);
      fetchHunts(); // Refresh hunts after deletion
    } catch (error) {
      console.error('Error deleting hunt:', error);
    }
  };


    <HuntModal
      hunt={selectedHunt}
      onClose={handleCloseModal}
      onSave={handleSaveHunt}
      onDelete={handleDeleteHunt} // Pass the delete function
      fetchHunts={fetchHunts}
    />

  return (
    <div className="calendar-container">
      <div className="rbc-toolbar">
        {/* Dropdown for mobile screens */}
        <select
          className="rbc-toolbar-dropdown"
          onChange={handleViewChange}
          value={view} // Sync the dropdown with the current view
        >
          <option value={Views.MONTH}>Month</option>
          <option value={Views.WEEK}>Week</option>
          <option value={Views.DAY}>Day</option>
          <option value={Views.AGENDA}>Agenda</option>
        </select>
      </div>

      {/* Calendar Component */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view} // Pass the current view to the calendar
        onView={(newView) => setView(newView)} // Update view when changed externally
        onSelectEvent={handleSelectEvent} // Open modal on event click
        popup // Enable popup for events to avoid clutter in month view
        style={{
          height: '100%',
          minHeight: '500px',
          width: '100%',
          maxWidth: '1200px',
          minWidth: '300px',
          margin: '0 auto',
        }}
      />

      {selectedHunt && (
        <HuntModal
          hunt={selectedHunt}
          onClose={handleCloseModal}
          onSave={handleSaveHunt}
          onDelete={handleDeleteHunt}
          fetchHunts={fetchHunts} // Pass fetchHunts as a prop
        />
      )}
    </div>
  );
};

export default HuntCalendar;

