// src/components/admin/ArtisanTools.js
import React from 'react';
import './ArtisanTools.css';
import { useNavigate } from 'react-router-dom';
import StaveCalculator from './StaveCalculator';


const ArtisanTools = () => {
  const navigate = useNavigate();

  return (
    <div className="artisan-tools-container">
      <h2>Artisan Tools</h2>
      <div className="tool-cards-wrapper">
        <div className="tool-card" onClick={() => navigate('/admin/artisan-tools/stave-calculator')}>
          <span className="tool-icon">📐</span>
          <h3>Stave Calculator</h3>
          <p>Calculate stave angles, widths, and cut sizes.</p>
        </div>
        <div className="tool-card" onClick={() => navigate('/admin/artisan-tools/inventory-tracker')}>
          <span className="tool-icon">📦</span>
          <h3>Inventory Tracker</h3>
          <p>Track wood, glue, and material usage.</p>
        </div>
        <div className="tool-card" onClick={() => navigate('/admin/artisan-tools/finance-tracker')}>
          <span className="tool-icon">📊</span>
          <h3>Finance Tracker</h3>
          <p>Analyze cost, revenue, and build expenses.</p>
        </div>
      </div>
    </div>
  );
};

export default ArtisanTools;