import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css'; // For custom styling

const localizer = momentLocalizer(moment);

const HuntCalendar = ({ hunts }) => {
  const [events, setEvents] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false); // Track dropdown state

  useEffect(() => {
    if (hunts && hunts.length > 0) {
      const formattedEvents = hunts.map((hunt) => ({
        title: hunt.name || 'Hunt', // Title of the hunt
        start: new Date(hunt.startTime), // Start time of the hunt
        end: new Date(hunt.endTime), // End time of the hunt
        allDay: false,
      }));
      setEvents(formattedEvents);
    }
  }, [hunts]);

  // Toggle dropdown on mobile
  const toggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState);
  };

  return (
    <div className="calendar-container">
      <div className="rbc-toolbar">
        <button className={`dropdown-toggle ${dropdownOpen ? 'active' : ''}`} onClick={toggleDropdown}>
          Menu
        </button>
        <div className={`rbc-toolbar-dropdown ${dropdownOpen ? 'open' : ''}`}>
          {/* Rest of the toolbar buttons will be here */}
        </div>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', minHeight: '500px', width: '100%' }}
      />
    </div>
  );
};

export default HuntCalendar;
