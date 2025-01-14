import React from 'react';
import './MaintenancePage.css';

const MaintenancePage = () => {
  return (
    <div className="maintenance-container">
      <div className="maintenance-icon">⚙️</div>
      <h1 className="maintenance-title">Site Under Maintenance</h1>
      <p className="maintenance-message">
        We’re currently making improvements to our site. Please check back later.
      </p>
    </div>
  );
};

export default MaintenancePage;