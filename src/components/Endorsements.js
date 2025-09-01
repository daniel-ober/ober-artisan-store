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
        <div className="tier-card legacy">
          <div className="tier-ribbon">
            <div className="tier-title">
              <div>TIER 1</div>
              <div>PRESTIGE ARTIST</div>
            </div>
          </div>
          <ul>
            <li>50% off up to 2 builds/yr</li>
            <li>Priority Scheduling</li>
            <li>Roster + Full Marketing</li>
            <li>Deliverables: 6 posts, 4 photos, 2 videos/yr</li>
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
          <ul>
            <li>35% off up to 2 builds/yr</li>
            <li>Roster Listing</li>
            <li>Social Shoutouts</li>
            <li>Deliverables: 4 posts, 2 photos, 1 video/yr</li>
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
          <ul>
            <li>20% off up to 2 builds/yr</li>
            <li>Social mentions</li>
            <li>Growth to higher tiers</li>
            <li>Deliverables: 3 posts, 1 photos, 1 video/yr</li>
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
