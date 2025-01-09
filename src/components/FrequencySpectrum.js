import React, { useRef, useEffect, useState } from 'react';
import { Chart } from 'chart.js';

function FrequencySpectrum({ drumSpecs, frequencyResponse }) {
  const chartRef = useRef(null);
  const [spectrumChart, setSpectrumChart] = useState(null);

  useEffect(() => {
    if (spectrumChart) spectrumChart.destroy();  // Destroy previous chart

    const ctx = chartRef.current.getContext('2d');

    const freqData = calculateFrequencies(drumSpecs, frequencyResponse);

    // Create a new chart with the updated frequency response data
    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: freqData.frequencies,
        datasets: [{
          label: 'Frequency Response',
          data: freqData.levels,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: true,
        }]
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            min: 20,
            max: 20000,
            title: {
              display: true,
              text: 'Frequency (Hz)'
            }
          },
          y: {
            min: 0,
            max: 1,
            title: {
              display: true,
              text: 'Relative Volume (0-1)'
            }
          }
        }
      }
    });

    setSpectrumChart(newChart);

    return () => {
      if (newChart) newChart.destroy();  // Cleanup when the component unmounts or updates
    };
  }, [drumSpecs, frequencyResponse]);

  function calculateFrequencies(specs, frequencyResponse) {
    const frequencies = [];
    const levels = [];
  
    // Calculate the frequency spectrum using the frequencyResponse data
    for (let i = 20; i <= 20000; i += 100) {
      let volume = 0;
  
      // Low frequencies: Weighting based on frequency response for low range
      if (i <= 500) {
        volume += frequencyResponse.low * (Math.log(i) / Math.log(500));  // Logarithmic for better low-end behavior
      }
      // Low-mid frequencies
      else if (i <= 1500) {
        volume += frequencyResponse.lowMid * (Math.log(i) / Math.log(1500));  // Logarithmic scaling
      }
      // Mid frequencies
      else if (i <= 5000) {
        volume += frequencyResponse.mid * (Math.log(i) / Math.log(5000));  // Logarithmic scaling
      }
      // Mid-high frequencies
      else if (i <= 10000) {
        volume += frequencyResponse.midHigh * (Math.log(i) / Math.log(10000));  // Logarithmic scaling
      }
      // High frequencies
      else {
        volume += frequencyResponse.high * (Math.log(i) / Math.log(20000));  // Logarithmic scaling
      }
  
      // Push the frequency and its corresponding volume
      frequencies.push(i);
      levels.push(Math.min(volume, 1));  // Limit the max value to 1 for normalization
    }
  
    return { frequencies, levels };
  }

  return (
    <div>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default FrequencySpectrum;