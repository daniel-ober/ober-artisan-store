import React, { useState } from 'react';
import CustomShopOverview from './CustomShopOverview';
import ConstructionComparison from './ConstructionComparison';
import WoodSpeciesComparison from './WoodSpeciesComparison';
import ShellDepthComparison from './ShellDepthComparison';

const CustomShop = () => {
    const [selectedPath, setSelectedPath] = useState(null);
    const [step, setStep] = useState(1);

    if (!selectedPath) {
        return <CustomShopOverview setSelectedPath={setSelectedPath} />;
    }

    return (
        <div className="custom-shop">
            <h1>Custom Shop</h1>
            {selectedPath === 'know-what-i-want' && <p>Streamlined form will go here.</p>}
            {selectedPath === 'need-guidance' && (
                <>
                    {step === 1 && (
                        <>
                            <h2>Step 1: Shell Construction</h2>
                            <ConstructionComparison />
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <h2>Step 2: Wood Species</h2>
                            <WoodSpeciesComparison />
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <h2>Step 3: Shell Depth</h2>
                            <ShellDepthComparison />
                        </>
                    )}
                    <div>
                        <button onClick={() => setStep(step - 1)} disabled={step === 1}>
                            Previous
                        </button>
                        <button onClick={() => setStep(step + 1)} disabled={step === 3}>
                            Next
                        </button>
                    </div>
                </>
            )}
            {selectedPath === 'unsure' && <p>Walkthrough guide will go here.</p>}
            {selectedPath === 'artisan' && (
                <p>The artisan experience will involve a personalized process here.</p>
            )}
        </div>
    );
};

export default CustomShop;