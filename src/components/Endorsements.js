import React from 'react';
import { Link } from 'react-router-dom';
import './Endorsements.css';

const Endorsements = () => {
  return (
    <div className="endorsements-page">
      <div className="endorsements-header">
        <h2>Artist Endorsement Program</h2>
        <p className="endorsements-intro">
          We believe in celebrating artistry without restrictions. Endorsements
          with Ober are about partnership, respect, and building legacy
          instruments together — while honoring every brand’s unique
          contribution to music.
        </p>
      </div>

      <div className="endorsements-tiers">
        {/* TIER 1 */}
        <div className="tier-card prestige">
          <div className="tier-ribbon">
            <div className="tier-title">
              <div>TIER 1</div>
              <div>PRESTIGE ARTIST</div>
            </div>
          </div>
          <ul className="benefits-list">
            <li>Up to 50% off 1–2 custom builds per year</li>
            <li>Priority scheduling in our build queue</li>
            <li>Full roster placement + artist spotlight page</li>
            <li>Dedicated marketing campaigns & social pushes</li>
            <li>Access to special collaborations & prototype testing</li>
          </ul>
        </div>

        {/* TIER 2 */}
        <div className="tier-card endorsed">
          <div className="tier-ribbon">
            <div className="tier-title">
              <div>TIER 2</div>
              <div>SPOTLIGHT ARTIST</div>
            </div>
          </div>
          <ul className="benefits-list">
            <li>Up to 35% off 1–2 custom builds per year</li>
            <li>Official roster listing on our website</li>
            <li>Regular social media features & shoutouts</li>
            <li>Priority consideration for media/demo requests</li>
            <li>Opportunities to progress to Prestige tier</li>
          </ul>
        </div>

        {/* TIER 3 */}
        <div className="tier-card rising">
          <div className="tier-ribbon">
            <div className="tier-title">
              <div>TIER 3</div>
              <div>RISING ARTIST</div>
            </div>
          </div>
          <ul className="benefits-list">
            <li>Up to 20% off one custom build per year</li>
            <li>Recognition as an Ober Rising Artist</li>
            <li>Social mentions and new build highlights</li>
            <li>Community connection & growth opportunities</li>
            <li>Potential advancement to Spotlight & Prestige tiers</li>
          </ul>
        </div>
      </div>

      <div className="endorsements-cta">
        <p>Ready to apply?</p>
        <Link to="/endorsements/apply" className="apply-button">
          Apply Now
        </Link>
      </div>
    </div>
  );
};

export default Endorsements;