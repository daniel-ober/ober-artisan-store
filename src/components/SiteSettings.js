import React, { useState } from 'react';
import './SiteSettings.css'; // Style for SiteSettings

const SiteSettings = () => {
  const [settings, setSettings] = useState({
    siteName: '',
    contactEmail: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings updated:', settings);
  };

  return (
    <div className="site-settings-container">
      <h1>Site Settings</h1>
      <form onSubmit={handleSubmit}>
        <div className="settings-field">
          <label htmlFor="siteName">Site Name:</label>
          <input
            type="text"
            id="siteName"
            name="siteName"
            value={settings.siteName}
            onChange={handleChange}
          />
        </div>
        <div className="settings-field">
          <label htmlFor="contactEmail">Contact Email:</label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={settings.contactEmail}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="settings-save-btn">Save Changes</button>
      </form>
    </div>
  );
};

export default SiteSettings;
