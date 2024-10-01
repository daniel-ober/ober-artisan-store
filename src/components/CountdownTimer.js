// src/components/CountdownTimer.js
import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

// Helper function to find the last Friday of the current month
const getLastFridayOfMonth = (date) => {
    let lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of this month
    let lastFriday = lastDayOfMonth;

    while (lastFriday.getDay() !== 5) { // 5 = Friday
        lastFriday.setDate(lastFriday.getDate() - 1); // Move backward until we hit Friday
    }

    return lastFriday;
};

const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState({});
    
    useEffect(() => {
        const releaseDate = getLastFridayOfMonth(new Date());
        
        const calculateTimeLeft = () => {
            const difference = releaseDate - new Date();
            let timeLeft = {};

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return timeLeft;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer); // Cleanup interval on component unmount
    }, []);

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval]) {
            return;
        }

        timerComponents.push(
            <span key={interval}>
                {timeLeft[interval]} {interval}{" "}
            </span>
        );
    });

    return (
        <div>
            <h2>Next Artisan Drum Drop</h2>
            {timerComponents.length ? timerComponents : <span>Drop happening soon!</span>}
        </div>
    );
};

export default CountdownTimer;
