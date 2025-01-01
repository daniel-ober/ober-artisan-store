import React from 'react';
import './BarChart.css';

const BarChart = ({ data }) => {
  return (
    <div className="bar-chart">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="bar-container">
          <div className="bar-label">{key.toUpperCase()}</div>
          <div className="bar">
            <div
              className={`bar-fill ${key}`}
              style={{ width: `${value * 10}%` }}  // Scale to 100
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarChart;