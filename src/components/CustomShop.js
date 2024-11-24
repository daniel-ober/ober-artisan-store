import React, { useState } from 'react';
import './CustomShop.css';

const CustomShop = () => {
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState({
        material: '',
        size: '',
        finish: '',
        extra: '',
    });

    const handleNextStep = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            alert('Thank you! Your custom order details have been submitted. We will get in touch with you shortly.');
        }
    };

    const handlePreviousStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPreferences((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="custom-shop">
            <h1>Custom Shop: Build Your Dream Drum</h1>
            <p>Create a drum that's as unique as your music with our custom shop experience.</p>

            <div className="steps-container">
                {step === 1 && (
                    <div className="step">
                        <h2>Step 1: Choose Your Drum Material</h2>
                        <select name="material" value={preferences.material} onChange={handleInputChange}>
                            <option value="" disabled>Select a material</option>
                            <option value="maple">Maple</option>
                            <option value="oak">Oak</option>
                            <option value="birch">Birch</option>
                            <option value="walnut">Walnut</option>
                            <option value="hybrid">Hybrid (stave + steam-bent)</option>
                        </select>
                    </div>
                )}

                {step === 2 && (
                    <div className="step">
                        <h2>Step 2: Select Your Drum Size</h2>
                        <select name="size" value={preferences.size} onChange={handleInputChange}>
                            <option value="" disabled>Select a size</option>
                            <option value="14x6.5">14 x 6.5 (Standard Snare)</option>
                            <option value="14x8">14 x 8 (Deep Snare)</option>
                            <option value="13x6">13 x 6 (Pop Snare)</option>
                            <option value="custom">Custom Size</option>
                        </select>
                    </div>
                )}

                {step === 3 && (
                    <div className="step">
                        <h2>Step 3: Select Your Finish</h2>
                        <select name="finish" value={preferences.finish} onChange={handleInputChange}>
                            <option value="" disabled>Select a finish</option>
                            <option value="natural">Natural</option>
                            <option value="stained">Stained</option>
                            <option value="burnt">Burnt</option>
                            <option value="painted">Painted</option>
                            <option value="exotic">Exotic Veneer</option>
                        </select>
                        <p className="additional-options">
                            Want something extra? Add notes for AI assistance:
                        </p>
                        <textarea
                            name="extra"
                            placeholder="Describe any special requests or preferences..."
                            value={preferences.extra}
                            onChange={handleInputChange}
                        />
                    </div>
                )}
            </div>

            <div className="buttons-container">
                <button
                    className="step-btn"
                    onClick={handlePreviousStep}
                    disabled={step === 1}
                >
                    Previous
                </button>
                <button className="step-btn" onClick={handleNextStep}>
                    {step < 3 ? 'Next' : 'Submit'}
                </button>
            </div>

            {step === 3 && (
                <div className="summary">
                    <h3>Your Custom Drum Summary</h3>
                    <ul>
                        <li><strong>Material:</strong> {preferences.material || 'Not selected'}</li>
                        <li><strong>Size:</strong> {preferences.size || 'Not selected'}</li>
                        <li><strong>Finish:</strong> {preferences.finish || 'Not selected'}</li>
                        <li><strong>Extras:</strong> {preferences.extra || 'None'}</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomShop;
