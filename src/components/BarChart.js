import React from 'react';
import './BarChart.css';

const BarChart = ({ data, min = 4 }) => {
  return (
    <div className="bar-chart">
      {Object.entries(data).map(([key, value]) => {
        // Ensure minimum value logic
        const scaledValue = Math.max(value, min);
        const percentage = (scaledValue / 10) * 100; // Scale to 100 based on max 10

        return (
          <div key={key} className="bar-container">
            <div className="bar-label">{key.toUpperCase()}</div>
            <div className="bar">
              <div
                className={`bar-fill ${key}`}
                style={{
                  width: `${percentage}%`,
                  minWidth: '15%'  // Minimum width to prevent zero-width bars
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;