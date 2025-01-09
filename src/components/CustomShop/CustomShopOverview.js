import React from 'react';

const CustomShopOverview = ({ setSelectedPath }) => {
    return (
        <div className="custom-shop-overview">
            <h1>Welcome to the Custom Shop</h1>
            <p>
                Create a drum as unique as your music. Whether you know exactly what you want 
                or need help discovering your perfect sound, we&apos;re here to guide you 
                through this journey.
            </p>
            <h2>What brought you here?</h2>
            <div className="path-options">
                <button onClick={() => setSelectedPath('know-what-i-want')}>
                    I know the specs I want.
                </button>
                <button onClick={() => setSelectedPath('need-guidance')}>
                    I have an idea, but I need help deciding.
                </button>
                <button onClick={() => setSelectedPath('unsure')}>
                    I don&apos;t know what I want or where to start.
                </button>
                <button onClick={() => setSelectedPath('artisan')}>
                    The true artisan experience.
                </button>
            </div>
        </div>
    );
};

export default CustomShopOverview;