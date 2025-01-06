import React from 'react';
import './BarChart.css';

const BarChart = ({ data, min = 5 }) => {
  return (
    <div className="bar-chart">
      {Object.entries(data)
        .filter(([key, value]) => value >= min)  // Filter out values below min
        .map(([key, value]) => {
          const percentage = (value / 10) * 100;  // Scale to 100 based on max 10

          return (
            <div key={key} className="bar-container">
              <div className="bar-label">{key.toUpperCase()}</div>
              <div className="bar">
                <div
                  className={`bar-fill ${key}`}
                  style={{
                    width: `${percentage}%`
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