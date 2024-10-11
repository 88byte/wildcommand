import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css'; // For custom styling

const localizer = momentLocalizer(moment);

const HuntCalendar = ({ hunts }) => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH); // Track the current view (Month by default)
  const [dropdownOpen, setDropdownOpen] = useState(false); // Track dropdown state

  useEffect(() => {
    if (hunts && hunts.length > 0) {
      const formattedEvents = hunts.map((hunt) => ({
        title: hunt.name || 'Hunt',
        start: new Date(hunt.startTime),
        end: new Date(hunt.endTime),
        allDay: false,
      }));
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
        style={{
          height: '100%',
          minHeight: '500px',
          width: '100%',
          maxWidth: '1200px',
          minWidth: '300px',
          margin: '0 auto',
        }}
      />
    </div>
  );
};

export default HuntCalendar;
