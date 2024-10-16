import React, { useState } from 'react';
import './HuntModal.css'; // Add custom styles
import { doc, updateDoc } from 'firebase/firestore'; // Firebase Firestore functions
import { db } from '../firebase'; // Import your Firebase instance
import Select from 'react-select'; // For the dropdown

const HuntModal = ({ hunt, onClose, fetchHunts, outfitterId, onDelete, onSave, availableGuides }) => {
  const startDate = typeof hunt.start === 'string' ? new Date(hunt.start) : hunt.start;
  const endDate = typeof hunt.end === 'string' ? new Date(hunt.end) : hunt.end;

  // Initialize formData with hunt details
  const [formData, setFormData] = useState({
    name: hunt.name || '',
    location: hunt.location || '',
    date: startDate ? startDate.toISOString().substring(0, 10) : '', // Format date for input field
    startTime: startDate ? startDate.toTimeString().substring(0, 5) : '', // Format start time (HH:MM)
    endTime: endDate ? endDate.toTimeString().substring(0, 5) : '', // Format end time (HH:MM)
    notes: hunt.notes || '',
    selectedGuide: hunt.guides ? { label: hunt.guides[0], value: hunt.guides[0] } : null,
  });

  // Update form data on field change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle guide change
  const handleGuideChange = (selectedOption) => {
    setFormData({
      ...formData,
      selectedGuide: selectedOption,
    });
  };

  const handleSave = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      alert('Please provide valid date, start time, and end time.');
      return;
    }

    // Don't convert startTime and endTime to ISO format, keep them as 'HH:MM'
    const updatedHunt = {
      ...hunt,
      name: formData.name,
      location: formData.location,
      date: formData.date, // Store date as 'YYYY-MM-DD'
      startTime: formData.startTime, // Store time as 'HH:MM'
      endTime: formData.endTime, // Store time as 'HH:MM'
      notes: formData.notes,
      guides: [formData.selectedGuide?.label], // Store the guide's name
    };

	  console.log('Updated Hunt:', updatedHunt);

	  if (!updatedHunt.outfitterId || !updatedHunt.id) {
	    console.error('Missing outfitterId or huntId');
	    return;
	  }

	  try {
	    const huntRef = doc(db, 'outfitters', updatedHunt.outfitterId, 'bookings', updatedHunt.id);
	      await updateDoc(huntRef, {
	        huntType: updatedHunt.name,
	        location: updatedHunt.location,
	        date: updatedHunt.date,
	        startTime: updatedHunt.startTime,
	        endTime: updatedHunt.endTime,
	        notes: updatedHunt.notes,
	        guides: updatedHunt.guides,
	      });

	    console.log('Calling fetchHunts after save');
	    if (fetchHunts) {
	        fetchHunts(); // Call the fetchHunts prop after saving
	      }
	      onClose(); // Close the modal after saving
	    } catch (error) {
	      console.error('Error updating hunt in Firestore:', error);
	    }
	  };



  // Ensure `onDelete` is passed and used
  const handleDelete = () => {
    if (onDelete && hunt.id) {
      onDelete(hunt.id); // Call onDelete passed as a prop
    }
    onClose(); // Close the modal after deletion
  };

  return (
    <div className="hunt-modal-overlay">
      <div className="hunt-modal">
        <h2>Edit Hunt</h2>

        <label>Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} />

        <label>Location</label>
        <input type="text" name="location" value={formData.location} onChange={handleChange} />

        <label>Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} />

        <label>Start Time</label>
        <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} />

        <label>End Time</label>
        <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} />

        <label>Hunters</label>
        <div className="hunters-list">
          {hunt.hunters && hunt.hunters.length > 0 ? hunt.hunters.map((hunter, index) => (
            <p key={index}>{hunter}</p>
          )) : <p>No hunters assigned</p>}
        </div>

        <label>Guide</label>
        <Select
          value={formData.selectedGuide}
          onChange={handleGuideChange}
          options={availableGuides}
          className="select-container"
          placeholder="Select Guide"
        />

        <label>Notes</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} />

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



