import React from 'react';
import './AdminCard.css'; // Ensure this path is correct

const AdminCard = ({ title, icon, onClick, isSelected }) => {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick();
    }
  };

  return (
    <div 
      className={`admin-card ${isSelected ? 'selected' : ''}`} 
      onClick={onClick}
      onKeyPress={handleKeyPress} // Handle keyboard events
      role="button" // Indicate that this div is a button
      tabIndex={0} // Make the div focusable
      aria-pressed={isSelected} // Indicates the button's state
    >
      <div className="admin-card-icon">{icon}</div>
      <h2 className="admin-card-title">{title}</h2>
    </div>
  );
};

export default AdminCard;
