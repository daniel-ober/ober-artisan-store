import React from 'react';
import woodSpecies from '../../data/profiles/woodSpecies';
import frequencyResponseValues from '../../data/distributions/frequencyResponseValues';
import './ComparisonTable.css';

const WoodSpeciesComparison = () => (
    <div>
        <table className="comparison-table">
            <thead>
                <tr>
                    <th>Wood Species</th>
                    <th>Attack</th>
                    <th>Sustain</th>
                    <th>Warmth</th>
                    <th>Projection</th>
                    <th>Brightness</th>
                </tr>
            </thead>
            <tbody>
                {woodSpecies.map((item) => (
                    <tr key={item.woodSpecies}>
                        <td>{item.woodSpecies.join(', ')}</td>
                        <td>{item.soundProfile.attack}</td>
                        <td>{item.soundProfile.sustain}</td>
                        <td>{item.soundProfile.warmth}</td>
                        <td>{item.soundProfile.projection}</td>
                        <td>{item.soundProfile.brightness}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <h3>Frequency Response Insights</h3>
        <ul>
            {frequencyResponseValues.map((value, index) => (
                <li key={index}>{value.label}: {value.value}</li>
            ))}
        </ul>
    </div>
);

export default WoodSpeciesComparison;