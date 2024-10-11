import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css'; // For any custom styling

// Initialize moment localizer
const localizer = momentLocalizer(moment);

const HuntCalendar = ({ hunts }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Map hunts data to calendar event format
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

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500, margin: '50px' }}
      />
    </div>
  );
};

export default HuntCalendar;
