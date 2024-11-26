import React from 'react';
import './SupportButton.css';

const SupportButton = ({ onClick }) => {
  return (
    <button className="support-button" onClick={onClick}>
      Support
    </button>
  );
};

export default SupportButton;
