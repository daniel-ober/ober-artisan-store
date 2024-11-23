import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './SiteMaintenance.css';

const SiteMaintenance = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = doc(db, 'settings', 'site');
        const snapshot = await getDoc(settingsDoc);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setIsMaintenanceMode(data.maintenanceMode || false);
        }
      } catch (err) {
        console.error('Error fetching settings:', err.message);
        setError('Failed to load site settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const toggleMaintenanceMode = async () => {
    setLoading(true);
    setError('');

    try {
      const settingsDoc = doc(db, 'settings', 'site');
      await updateDoc(settingsDoc, { maintenanceMode: !isMaintenanceMode });
      setIsMaintenanceMode((prev) => !prev);
    } catch (err) {
      console.error('Error updating settings:', err.message);
      setError('Failed to update site settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="site-maintenance">
      <h2>Site Maintenance</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="toggle-container">
        <span className="toggle-label">Maintenance Mode</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={isMaintenanceMode}
            onChange={toggleMaintenanceMode}
            disabled={loading}
          />
          <span className="slider round"></span>
        </label>
        <span className="status">
          {isMaintenanceMode ? 'On' : 'Off'}
        </span>
      </div>
      {loading && <div className="loading-message">Updating...</div>}
    </div>
  );
};

export default SiteMaintenance;
