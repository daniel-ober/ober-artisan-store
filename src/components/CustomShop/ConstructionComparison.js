import React from 'react';
import constructionTypes from '../../data/profiles/constructionTypes';

const ConstructionComparison = () => (
    <table className="comparison-table">
        <thead>
            <tr>
                <th>Construction Type</th>
                <th>Attack</th>
                <th>Sustain</th>
                <th>Warmth</th>
                <th>Projection</th>
                <th>Brightness</th>
            </tr>
        </thead>
        <tbody>
            {constructionTypes.map((item) => (
                <tr key={item.constructionType}>
                    <td>{item.constructionType}</td>
                    <td>{item.soundProfile.attack}</td>
                    <td>{item.soundProfile.sustain}</td>
                    <td>{item.soundProfile.warmth}</td>
                    <td>{item.soundProfile.projection}</td>
                    <td>{item.soundProfile.brightness}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default ConstructionComparison;