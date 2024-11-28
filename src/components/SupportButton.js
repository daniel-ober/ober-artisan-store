import React from 'react';
import './SupportButton.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const SupportButton = ({ onClick }) => {
  return (
    <button className="support-button" onClick={onClick}>
      <FontAwesomeIcon icon={faQuestionCircle} className="support-button-icon" />
    </button>
  );
};

export default SupportButton;