import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase'; // Assuming you're importing Firestore
import { doc, getDoc } from 'firebase/firestore';

const HunterSetup = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hunterId = queryParams.get('hunterId');  // Extract the hunterId from the URL
  const [hunterData, setHunterData] = useState(null);
  const [error, setError] = useState(null);

  console.log("Hunter ID from URL:", hunterId);  // Log the hunterId to verify it's being captured

  useEffect(() => {
    const fetchHunterData = async () => {
      try {
        const docRef = doc(db, 'outfitters', 'outfitterId', 'hunters', hunterId); // Make sure the path is correct
        const hunterDoc = await getDoc(docRef);
        if (hunterDoc.exists()) {
          setHunterData(hunterDoc.data());
        } else {
          setError('Hunter not found.');
        }
      } catch (err) {
        setError('Failed to load hunter data.');
      }
    };

    if (hunterId) {
      fetchHunterData();
    }
  }, [hunterId]);

  if (!hunterId) {
    return <p>Invalid hunter ID. Please check the link.</p>;
  }

  return (
    <div className="hunter-setup-container">
      <h1>Hunter Setup Page</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {hunterData ? (
        <div>
          <p>Welcome, {hunterData.name}</p>
          {/* Add your form to update the hunter information here */}
        </div>
      ) : (
        <p>Loading hunter information...</p>
      )}
    </div>
  );
};

export default HunterSetup;
