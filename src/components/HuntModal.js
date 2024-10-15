import React, { useState } from 'react';
import './HuntModal.css'; // Add custom styles
import { doc, updateDoc } from 'firebase/firestore'; // Firebase Firestore functions
import { db } from '../firebase'; // Import your Firebase instance


const HuntModal = ({ hunt, onClose, onSave, onDelete, fetchHunts }) => {

	const startDate = typeof hunt.start === 'string' ? new Date(hunt.start) : hunt.start;

  // Initialize formData with hunt details
  const [formData, setFormData] = useState({
    name: hunt.name,
    location: hunt.location,
    date: startDate ? startDate.toISOString().substring(0, 10) : '', // Format date for input field
    startTime: startDate ? startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '', // Handle time format
    notes: hunt.notes || '',
  });

  // Update form data on field change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle save operation
  const handleSave = async () => {
    if (!formData.date || !formData.startTime) {
      alert('Please provide a valid date and start time.');
      return;
    }

    // Construct a new start date-time using the date and startTime
    const updatedStartTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();

    // Calculate an end time 4 hours after the start time (you can adjust the duration)
    const updatedEndTime = new Date(new Date(updatedStartTime).getTime() + 4 * 60 * 60 * 1000).toISOString();

    const updatedHunt = {
      ...hunt,
      name: formData.name,
      location: formData.location,
      date: formData.date, // Explicitly include the updated date
      start: updatedStartTime, // Full date-time for start
      end: updatedEndTime, // Full date-time for end
      startTime: formData.startTime, // Store simple start time (optional)
      endTime: updatedEndTime, // Store simple end time (optional)
      notes: formData.notes,
    };

    await onSave(updatedHunt); // Save the updated hunt
    fetchHunts(); // Refresh hunts after saving
    onClose(); // Close the modal
  };


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









  // Handle delete operation
  const handleDelete = () => {
    onDelete(hunt.id); // Call onDelete function from props to delete the hunt
    onClose(); // Close the modal after deletion
  };

  return (
    <div className="hunt-modal-overlay">
      <div className="hunt-modal">
        <h2>Edit Hunt</h2>

        {/* Input for hunt name */}
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />

        {/* Input for hunt location */}
        <label>Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
        />

        {/* Input for hunt date */}
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />

        {/* Input for start time */}
        <label>Start Time</label>
        <input
          type="time"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
        />



        {/* Textarea for notes */}
        <label>Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />

        {/* Modal action buttons */}
        <div className="modal-actions">
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={handleDelete} className="delete-btn">Delete</button>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    </div>
  );
};

export default HuntModal;
