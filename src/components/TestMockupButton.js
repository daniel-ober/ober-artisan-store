// src/components/TestMockupButton.js
import React from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const TestMockupButton = () => {
  const handleClick = async () => {
    const app = getApp();
    const functions = getFunctions(app);
    const generateDrumMockup = httpsCallable(functions, 'generateDrumMockup');

    try {
      const result = await generateDrumMockup({
        veneer: 'mappa_burl',
        accentColor: 'turquoise',
        hardware: 'black nickel',
        diameter: '14',
        depth: '6.5',
        docId: 'test-mockup-doc', // <-- must match a real doc
      });
      console.log('✅ Image generated at:', result.data.url);
    } catch (err) {
      console.error('❌ Mockup error:', err.message);
    }
  };

  return <button onClick={handleClick}>Test Drum Mockup Generation</button>;
};

export default TestMockupButton;