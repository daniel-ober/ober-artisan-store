import React, { useState } from 'react';

const SoundProfileRecommendations = () => {
    const [soundProfile, setSoundProfile] = useState({
        Attack: 5,
        Sustain: 5,
        Warmth: 5,
        Projection: 5,
        Brightness: 5,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSoundProfile({
            ...soundProfile,
            [name]: parseInt(value),
        });
    };

    return (
        <div className="sound-profile-container">
            <h1>Choose Your Drum Sound Profile</h1>
            <div className="sound-slider">
                {Object.keys(soundProfile).map((key) => (
                    <div key={key} className="slider-container">
                        <label>{key}</label>
                        <input
                            type="range"
                            name={key}
                            min="0"
                            max="10"
                            value={soundProfile[key]}
                            onChange={handleInputChange}
                        />
                        <span>{soundProfile[key]}</span>
                    </div>
                ))}
            </div>

            <button className="calculate-button">Calculate Recommendations</button>
        </div>
    );
};

export default SoundProfileRecommendations;