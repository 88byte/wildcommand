import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../authContext';
import './Guides.css';
import ClipLoader from 'react-spinners/ClipLoader'; // Spinner for loading state

const Guides = () => {
  const { user } = useAuth();
  const [guides, setGuides] = useState([]);
  const [newGuide, setNewGuide] = useState({ name: '', email: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentGuideId, setCurrentGuideId] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For loading state

  // Fetch guides on load
  const fetchGuides = async () => {
    if (user && user.outfitterId) {
      const guidesCollection = collection(db, `outfitters/${user.outfitterId}/guides`);
      const guideSnapshot = await getDocs(guidesCollection);
      const guidesData = guideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGuides(guidesData);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [user]);


  // Handle toggling guide's active status
  const toggleActiveStatus = async (id, currentStatus) => {
    const guideDocRef = doc(db, `outfitters/${user.outfitterId}/guides`, id);
    try {
      await updateDoc(guideDocRef, { active: !currentStatus });
      const updatedGuides = guides.map(g => (g.id === id ? { ...g, active: !currentStatus } : g));
      setGuides(updatedGuides);
    } catch (error) {
      console.error('Error updating guide status:', error);
    }
  };



  // Handle adding a new guide
  const handleAddGuide = async () => {
    try {
      if (!user || !user.outfitterId) {
        console.error("Outfitter ID is missing.");
        return;
      }

      // Start loading state
      setIsLoading(true);

      // Data to send to the Cloud Function
      const guideData = {
        guideName: newGuide.name,
        guideEmail: newGuide.email,
        guidePhone: newGuide.phone,
      };

      // Call Cloud Function to add guide
      const addGuideFunction = httpsCallable(functions, 'addGuide');
      const result = await addGuideFunction(guideData);

      console.log(result.data.message); // "Guide added successfully."
      fetchGuides();

      setNewGuide({ name: '', email: '', phone: '' }); // Reset form
      setEmailSent(true); // Show success message
      setTimeout(() => setEmailSent(false), 5000);

      setIsLoading(false); // End loading state
    } catch (error) {
      console.error('Error adding guide:', error);
      setIsLoading(false); // Ensure loading state ends
    }
  };

  const handleEditGuide = async (id) => {
    const guideDocRef = doc(db, `outfitters/${user.outfitterId}/guides`, id);
    try {
      const updatedFields = {
        name: newGuide.name,
        email: newGuide.email,
        phone: newGuide.phone,
      };
      await updateDoc(guideDocRef, updatedFields);
      const updatedGuides = guides.map(g => (g.id === id ? { ...g, ...updatedFields } : g));
      setGuides(updatedGuides);
      setIsEditing(false);
      setNewGuide({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error updating guide:', error);
    }
  };

  const handleDeleteGuide = async (id) => {
    try {
      await deleteDoc(doc(db, `outfitters/${user.outfitterId}/guides`, id));
      const remainingGuides = guides.filter(guide => guide.id !== id);
      setGuides(remainingGuides);
    } catch (error) {
      console.error('Error deleting guide:', error);
    }
  };

  const handleEditClick = (guide) => {
    setNewGuide(guide);
    setCurrentGuideId(guide.id);
    setIsEditing(true);
  };

  return (
    <div className="guides-page">
      <div className="interaction-section">
        <div className="interaction-header">
          <h2 className="interaction-title">{isEditing ? 'Edit Guide' : 'Add New Guide'}</h2>
        </div>
        <div className="guide-form-container">
          <input
            type="text"
            placeholder="Guide Name"
            value={newGuide.name}
            onChange={(e) => setNewGuide({ ...newGuide, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Guide Email"
            value={newGuide.email}
            onChange={(e) => setNewGuide({ ...newGuide, email: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Guide Phone"
            value={newGuide.phone}
            onChange={(e) => setNewGuide({ ...newGuide, phone: e.target.value })}
          />
          {isEditing ? (
            <button className="update-guide-btn" onClick={() => handleEditGuide(currentGuideId)}>
              Update
            </button>
          ) : (
            <button className="add-guide-btn" onClick={handleAddGuide} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add'}
            </button>
          )}
          {isLoading && <ClipLoader color="#28a745" size={35} />}
        </div>
        {emailSent && <p className="email-sent-message">Welcome email sent to guide!</p>}
      </div>

      <div className="guide-list-section">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => (
              <tr key={guide.id}>
                <td>{guide.name || 'N/A'}</td>
                <td>{guide.email || 'N/A'}</td>
                <td>{guide.phone || 'N/A'}</td>
                <td>
                  <div className="toggle-container">
                    <label className="toggle-label">
                      {guide.active ? 'Active' : 'Inactive'}
                    </label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={guide.active}
                        onChange={() => toggleActiveStatus(guide.id, guide.active)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => handleEditClick(guide)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteGuide(guide.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Guides;
