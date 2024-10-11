import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../authContext';
import './Hunters.css';

const Hunters = () => {
  const { user } = useAuth();
  const [hunters, setHunters] = useState([]);
  const [filteredHunters, setFilteredHunters] = useState([]);
  const [newHunter, setNewHunter] = useState({ name: '', email: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentHunterId, setCurrentHunterId] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [emailSent, setEmailSent] = useState(false);

  // Fetch hunters data on load
  const fetchHunters = async () => {
    if (user && user.outfitterId) {
      const huntersCollection = collection(db, `outfitters/${user.outfitterId}/hunters`);
      const hunterSnapshot = await getDocs(huntersCollection);
      const huntersData = hunterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHunters(huntersData);
      setFilteredHunters(huntersData);
    }
  };

  useEffect(() => {
    fetchHunters();
  }, [user]);

  // Handle adding a new hunter
  const handleAddHunter = async () => {
    try {
      if (!user || !user.outfitterId) {
        console.error("Outfitter ID is missing.");
        return;
      }

      // Prepare the data to send to the Cloud Function
      const hunterData = {
        hunterName: newHunter.name,
        hunterEmail: newHunter.email,
        hunterPhone: newHunter.phone,
      };

      // Call the Cloud Function
      const addHunterFunction = httpsCallable(functions, 'addHunter');
      const result = await addHunterFunction(hunterData);

      console.log(result.data.message); // "Hunter added successfully."

      // Fetch the updated list of hunters
      fetchHunters();

      setNewHunter({ name: '', email: '', phone: '' }); // Reset the input fields

      // Show the "email sent" status
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error) {
      console.error('Error adding hunter:', error);
    }
  };

  // Real-time filter logic
  useEffect(() => {
    const filtered = hunters.filter((hunter) => {
      const name = hunter.name ? hunter.name.toLowerCase() : '';
      const email = hunter.email ? hunter.email.toLowerCase() : '';
      const phone = hunter.phone ? hunter.phone.toLowerCase() : '';

      return (
        name.includes(filterText.toLowerCase()) ||
        email.includes(filterText.toLowerCase()) ||
        phone.includes(filterText.toLowerCase())
      );
    });
    setFilteredHunters(filtered);
  }, [filterText, hunters]);

  const handleEditHunter = async (id) => {
    const hunterDocRef = doc(db, `outfitters/${user.outfitterId}/hunters`, id);
    try {
      const updatedFields = {
        name: newHunter.name,
        email: newHunter.email,
        phone: newHunter.phone,
      };
      await updateDoc(hunterDocRef, updatedFields);
      const updatedHunters = hunters.map(h => (h.id === id ? { ...h, ...updatedFields } : h));
      setHunters(updatedHunters);
      setFilteredHunters(updatedHunters);
      setIsEditing(false);
      setNewHunter({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error updating hunter:', error);
    }
  };

  const handleDeleteHunter = async (id) => {
    try {
      await deleteDoc(doc(db, `outfitters/${user.outfitterId}/hunters`, id));
      const remainingHunters = hunters.filter(hunter => hunter.id !== id);
      setHunters(remainingHunters);
      setFilteredHunters(remainingHunters);
    } catch (error) {
      console.error('Error deleting hunter:', error);
    }
  };

  const handleEditClick = (hunter) => {
    setNewHunter(hunter);
    setCurrentHunterId(hunter.id);
    setIsEditing(true);
  };

  const handleSortChange = (e) => {
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    const sortedHunters = [...filteredHunters].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return newSortOrder === 'asc' ? comparison : -comparison;
    });
    setFilteredHunters(sortedHunters);
  };

  return (
    <div className="hunters-page">
      {/* Interaction Section */}
      <div className="interaction-section">
        <div className="interaction-header">
          <h2 className="interaction-title">{isEditing ? 'Edit Hunter' : 'Add New Hunter'}</h2>
        </div>
        <div className="hunter-form-container">
          <input
            type="text"
            placeholder="Hunter Name"
            value={newHunter.name}
            onChange={(e) => setNewHunter({ ...newHunter, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Hunter Email"
            value={newHunter.email}
            onChange={(e) => setNewHunter({ ...newHunter, email: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Hunter Phone"
            value={newHunter.phone}
            onChange={(e) => setNewHunter({ ...newHunter, phone: e.target.value })}
          />
          {isEditing ? (
            <button className="update-hunter-btn" onClick={() => handleEditHunter(currentHunterId)}>
              Update
            </button>
          ) : (
            <button className="add-hunter-btn" onClick={handleAddHunter}>
              Add
            </button>
          )}
        </div>
        {emailSent && <p className="email-sent-message">Welcome email sent to hunter!</p>}
      </div>
      
      {/* Filter and Sort Section */}
      <div className="filter-sort-section">
        <input
          type="text"
          placeholder="Filter by name, email, or phone"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="filter-input"
        />
        <select value={sortOrder} onChange={handleSortChange} className="sort-select">
          <option value="asc">Sort by Name (A-Z)</option>
          <option value="desc">Sort by Name (Z-A)</option>
        </select>
        <button className="clear-filter-btn" onClick={() => setFilterText('')}>
          Clear
        </button>
      </div>

      {/* Hunter List */}
      <div className="hunter-list-section">
        <table className="hunter-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Profile Complete</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHunters.map((hunter) => (
              <tr key={hunter.id}>
                <td>{hunter.name || 'N/A'}</td>
                <td>{hunter.email || 'N/A'}</td>
                <td>{hunter.phone || 'N/A'}</td>
                <td>{hunter.accountSetupComplete ? "Yes" : "No"}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEditClick(hunter)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteHunter(hunter.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Hunters;


