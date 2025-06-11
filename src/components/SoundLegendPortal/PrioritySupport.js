// src/components/SoundLegendPortal/PrioritySupport.js
import React from 'react';
import './PrioritySupport.css';

const PrioritySupport = () => {
  return (
    <div className="scope-section">
      <h2>Priority Support</h2>
      <p>
        As a SoundLegend client, you receive direct access to our priority support team.
        This section will soon offer:
      </p>
      <ul>
        <li>Live chat with our artisan support staff</li>
        <li>Real-time status updates on your build</li>
        <li>Dedicated follow-ups for your inquiries</li>
        <li>Expedited issue resolution</li>
      </ul>
      <p>
        Until this feature is live, please reach out via email at{' '}
        <a href="mailto:soundlegend@oberartisandrums.com">soundlegend@oberartisandrums.com</a> and mention your SoundLegend status.
      </p>
    </div>
  );
};

export default PrioritySupport;