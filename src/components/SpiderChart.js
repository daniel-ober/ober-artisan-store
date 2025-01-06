import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './SpiderChart.css';

const SpiderChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
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
                    pointBackgroundColor: 'rgb(34, 202, 236)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(34, 202, 236, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: false,
                        suggestedMin: 4,
                        suggestedMax: 10,
                        ticks: {
                            stepSize: 1,
                            backdropColor: 'rgba(0,0,0,0)',
                            color: '#ffffff',
                            font: {
                                size: 0
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.3)'
                        },
                        pointLabels: {
                            color: '#ffffff',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return (
        <div className="chart-container">
            <h1>Drum Sound Profile</h1>
            <canvas ref={chartRef} width="400" height="400"></canvas>
        </div>
    );
};

export default SpiderChart;