import React, { useState, useEffect } from 'react';
import './BookHunt.css';
import { auth, db, functions   } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Select from 'react-select';
import { sendHuntBookingEmails } from './emailService'; // Utility for sending emails

const BookHunt = () => {
  const [formData, setFormData] = useState({
    huntType: '',
    location: '',
    date: '',
    startTime: '', // New field for start time
    notes: '', // New field for notes
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // Change to a boolean for modal
  const [guides, setGuides] = useState([]);
  const [hunters, setHunters] = useState([]);
  const [selectedGuides, setSelectedGuides] = useState([{ guide: null }]);
  const [selectedHunters, setSelectedHunters] = useState([{ hunter: null }]);

  const huntTypes = ['Elk Hunt', 'Deer Hunt', 'Bear Hunt', 'Turkey Hunt', 'Pig Hunt'];
  const fishingTypes = ['Trout Fishing', 'Steelhead Fishing', 'Bass Fishing'];
  const allTypes = [...huntTypes, ...fishingTypes];

  useEffect(() => {
    const fetchGuidesAndHunters = async () => {
      try {
        const token = await auth.currentUser.getIdTokenResult();
        const outfitterId = token.claims.outfitterId;

        const guidesSnapshot = await getDocs(collection(db, `outfitters/${outfitterId}/guides`));
        const huntersSnapshot = await getDocs(collection(db, `outfitters/${outfitterId}/hunters`));

        const guidesData = guidesSnapshot.docs.map((doc) => ({
          label: `${doc.data().name} (${doc.data().email})`,
          value: doc.id,
        }));

        const huntersData = huntersSnapshot.docs.map((doc) => ({
          label: `${doc.data().name} (${doc.data().email})`,
          value: doc.id,
        }));

        setGuides(guidesData);
        setHunters(huntersData);
      } catch (error) {
        console.error('Error fetching guides and hunters:', error);
      }
    };

    fetchGuidesAndHunters();
  }, []);

  const handleAddGuide = () => {
    setSelectedGuides([...selectedGuides, { guide: null }]);
  };

  const handleRemoveGuide = (index) => {
    const updatedGuides = selectedGuides.filter((_, i) => i !== index);
    setSelectedGuides(updatedGuides);
  };

  const handleAddHunter = () => {
    setSelectedHunters([...selectedHunters, { hunter: null }]);
  };

  const handleRemoveHunter = (index) => {
    const updatedHunters = selectedHunters.filter((_, i) => i !== index);
    setSelectedHunters(updatedHunters);
  };

  const handleGuideChange = (index, selectedOption) => {
    const updatedGuides = [...selectedGuides];
    updatedGuides[index].guide = selectedOption;
    setSelectedGuides(updatedGuides);
  };

  const handleHunterChange = (index, selectedOption) => {
    const updatedHunters = [...selectedHunters];
    updatedHunters[index].hunter = selectedOption;
    setSelectedHunters(updatedHunters);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.huntType || !formData.location || !formData.date || !formData.startTime) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      const token = await auth.currentUser.getIdTokenResult();
      const outfitterId = token.claims.outfitterId;

      // Ensure date and startTime are stored in the correct format
      const huntDetails = {
        ...formData,
        date: formData.date, // Store date as a simple string (YYYY-MM-DD)
        startTime: formData.startTime, // Store startTime as a simple time string
        guides: selectedGuides.map((g) => g.guide?.label).filter(Boolean),
        hunters: selectedHunters.map((h) => h.hunter?.label).filter(Boolean),
        outfitterId,
      };

      await addDoc(collection(db, `outfitters/${outfitterId}/bookings`), huntDetails);

      // Send emails and show success modal
      const guideEmails = selectedGuides.map((g) => g.guide?.value).filter(Boolean);
      const hunterEmails = selectedHunters.map((h) => h.hunter?.value).filter(Boolean);

      const sendHuntBookingEmails = httpsCallable(functions, 'sendHuntBookingEmails');
      await sendHuntBookingEmails({
        huntDetails,
        guideEmails,
        hunterEmails,
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error booking hunt:', error);
      setError('An error occurred while booking the hunt.');
    }
  };







  const handleCloseModal = () => {
    setSuccess(false); // Close modal
  };


  const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#fff !important',
    padding: '8px !important',
    borderRadius: '5px !important',
    borderColor: state.isFocused ? '#d4af37 !important' : '#ddd !important',
    boxShadow: state.isFocused ? '0 0 5px rgba(212, 175, 55, 0.5) !important' : 'none !important',
    minHeight: '40px !important',
    width: '400px !important', // Widen the select box
    '&:hover': {
      borderColor: '#d4af37 !important',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#d4af37 !important'
      : state.isFocused
      ? '#f0f0f0 !important' // Subtle gray for hover color
      : '#fff !important',
    color: '#333 !important',
    padding: '10px !important',
    '&:hover': {
      backgroundColor: '#f0f0f0 !important', // Subtle gray for hover color
      color: '#333 !important',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#666 !important',
    paddingLeft: '10px !important', // Move placeholder text to the right
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#333 !important',
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '5px !important',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1) !important',
    width: '400px !important', // Ensure the dropdown is the same width as the control
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#d4af37 !important',
    '&:hover': {
      color: '#d4af37 !important',
    },
  }),
  indicatorSeparator: () => ({
    display: 'none !important',
  }),
};





  return (
    <div className="book-hunt-container">
      <h1>Book a Hunt or Fishing Trip</h1>

      {error && <p className="error-message">{error}</p>}

      <form className="book-hunt-form" onSubmit={handleSubmit}>
        {/* Date */}
        <div className="form-section">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />

          {/* Start Time */}
          <label htmlFor="startTime">Start Time</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
          />
        </div>

        <div className="form-section">
          {/* Hunt/Fishing Type */}
          <label htmlFor="huntType">Hunt/Fishing Type</label>
          <select
            id="huntType"
            name="huntType"
            value={formData.huntType}
            onChange={handleChange}
          >
            <option value="">Select Type</option>
            {allTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Location */}
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter location"
          />
        </div>

        <div className="form-section">
          {/* Guides */}
          <div className="label-btn-container">
            <label htmlFor="guides"></label>
            <button type="button" className="add-btn" onClick={handleAddGuide}>+</button>
          </div>
          {selectedGuides.map((guideObj, index) => (
            <div key={index} className="participant-row">
              <button type="button" className="remove-btn" onClick={() => handleRemoveGuide(index)}>
                −
              </button>
              <Select
                styles={customSelectStyles}
                options={guides}
                value={guideObj.guide}
                onChange={(selectedOption) => handleGuideChange(index, selectedOption)}
                placeholder="Select Guide"
              />
            </div>
          ))}

          <div className="divider"></div>

          {/* Hunters */}
          <div className="label-btn-container">
            <label htmlFor="hunters"></label>
            <button type="button" className="add-btn" onClick={handleAddHunter}>+</button>
          </div>
          {selectedHunters.map((hunterObj, index) => (
            <div key={index} className="participant-row">
              <button type="button" className="remove-btn" onClick={() => handleRemoveHunter(index)}>
                −
              </button>
              <Select
                styles={customSelectStyles}
                options={hunters}
                value={hunterObj.hunter}
                onChange={(selectedOption) => handleHunterChange(index, selectedOption)}
                placeholder="Select Hunter"
              />
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="form-section">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter additional details about the hunt (e.g., specific requests, gear needed, etc.)"
            className="notes-textarea"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn">
          Book Now
        </button>
      </form>

      {/* Success Modal */}
      {success && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Booking Completed</h2>
            <p>Your hunt has been successfully booked. Confirmation emails have been sent.</p>
            <button className="close-btn" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookHunt;