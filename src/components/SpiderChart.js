import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto'; // Ensure this is imported
import './SpiderChart.css';

const SpiderChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        // Destroy the previous chart instance if it exists
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Attack', 'Sustain', 'Warmth', 'Projection', 'Brightness'],
                datasets: [{
                    label: 'Drum Sound Profile',
                    data: data,
                    fill: true,
                    backgroundColor: 'rgba(34, 202, 236, 0.2)',
                    borderColor: 'rgba(34, 202, 236, 1)',
                    pointBackgroundColor: 'rgba(34, 202, 236, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(34, 202, 236, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        suggestedMin: 0,
                        suggestedMax: 10,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        pointLabels: {
                            color: '#fff',
                            font: {
                                size: 16
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    }
                }
            }
        });

        // Cleanup: Destroy the chart instance when the component unmounts or when the data changes
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);  // Re-run this effect when data changes

    return (
        <div className="chart-container">
            <h1>Drum Sound Profile</h1>
            <canvas ref={chartRef} width="500" height="500"></canvas>
        </div>
    );
};

export default SpiderChart;