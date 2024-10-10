import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../authContext';
import './Hunters.css'; // Updated CSS for new layout

const Hunters = () => {
  const { user } = useAuth();
  const [hunters, setHunters] = useState([]);
  const [filteredHunters, setFilteredHunters] = useState([]); // For filtering
  const [newHunter, setNewHunter] = useState({ name: '', email: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentHunterId, setCurrentHunterId] = useState(null);
  const [filterText, setFilterText] = useState(''); // Filter text
  const [sortOrder, setSortOrder] = useState('asc'); // Sorting state

  useEffect(() => {
    const fetchHunters = async () => {
      if (user && user.outfitterId) {
        const huntersCollection = collection(db, `outfitters/${user.outfitterId}/hunters`);
        const hunterSnapshot = await getDocs(huntersCollection);
        const huntersData = hunterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHunters(huntersData);
        setFilteredHunters(huntersData); // Initially, all hunters are shown
      }
    };
    fetchHunters();
  }, [user]);

  // Real-time filter logic
  useEffect(() => {
    const filtered = hunters.filter((hunter) =>
      hunter.name.toLowerCase().includes(filterText.toLowerCase()) ||
      hunter.email.toLowerCase().includes(filterText.toLowerCase()) ||
      hunter.phone.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredHunters(filtered);
  }, [filterText, hunters]);

  const handleAddHunter = async () => {
    try {
      // Make sure the outfitterId is available
      if (!user || !user.outfitterId) {
        console.error("Outfitter ID is missing.");
        return;
      }

      // Include the outfitterId in the hunter's data
      const hunterData = {
        name: newHunter.name,
        email: newHunter.email,
        phone: newHunter.phone,
        role: 'hunter',  // Setting the role as 'hunter'
        createdAt: new Date(),  // Optional: Track creation time
        outfitterId: user.outfitterId  // Save the outfitter ID
      };

      // Add the hunter to the Firestore under the outfitter's collection
      const docRef = await addDoc(collection(db, `outfitters/${user.outfitterId}/hunters`), hunterData);
      
      const addedHunter = { id: docRef.id, ...hunterData };
      setHunters([...hunters, addedHunter]);
      setFilteredHunters([...hunters, addedHunter]); // Update filtered list
      setNewHunter({ name: '', email: '', phone: '' }); // Reset the input fields
    } catch (error) {
      console.error('Error adding hunter:', error);
    }
  };

  const handleEditHunter = async (id) => {
    const hunterDocRef = doc(db, `outfitters/${user.outfitterId}/hunters`, id);
    try {
      await updateDoc(hunterDocRef, newHunter);
      const updatedHunters = hunters.map(h => (h.id === id ? { id, ...newHunter } : h));
      setHunters(updatedHunters);
      setFilteredHunters(updatedHunters); // Update filtered list
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
      setFilteredHunters(remainingHunters); // Update filtered list
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
        <div className="interaction-header"> {/* Added div for interaction-header */}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHunters.map((hunter) => (
              <tr key={hunter.id}>
                <td>{hunter.name}</td>
                <td>{hunter.email}</td>
                <td>{hunter.phone}</td>
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

