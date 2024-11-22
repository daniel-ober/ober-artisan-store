import React, { useState } from 'react';
import './AdminSettings.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteMaintenance: false,
    enableChatSupport: true,
    enableUserRegistration: true,
    enableFeaturedProducts: true,
  });

  const toggleSetting = (key) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [key]: !prevSettings[key],
    }));
  };

  return (
    <div className="admin-settings">
      <h2>Admin Settings</h2>
      <div className="settings-list">
        {Object.keys(settings).map((key) => (
          <div className="setting-item" key={key}>
            <span className="setting-label">
              {key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())}
            </span>
            <button
              className={`toggle-button ${settings[key] ? 'enabled' : 'disabled'}`}
              onClick={() => toggleSetting(key)}
            >
              {settings[key] ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
