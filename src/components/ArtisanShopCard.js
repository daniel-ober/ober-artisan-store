import React from 'react';

import { useNavigate } from 'react-router-dom';

import './ArtisanShopCard.css';

const ARTISAN_COPY = {

  soundlegend: {

    logo: '/v2logo-large/soundlegend-black.png',

    subheader: 'Built Around Your Voice',

    shortDescription:

      'A true custom-shop experience shaped around your sound, style, and story.',

    bullets: [

      '1-on-1 design collaboration',

      'Signature finish and shell direction',

      'Mockups and guided refinement',

      'Built from the ground up in Nashville',

      'Direct feedback throughout the process',

      'A one-of-a-kind instrument with identity',

    ],

  },

  heritage: {

    logo: '/v2logo-large/heritage-black.png',

    subheader: 'Tradition Reimagined',

    shortDescription:

      'A handcrafted stave snare rooted in warmth, resonance, and timeless character.',

    bullets: [

      'Stave shell construction',

      'Torch-tuned for depth and response',

      'Classic voice with modern refinement',

      'Rich visual grain and scorched character',

      'Built for studio and stage alike',

      'Made one at a time in Nashville',

    ],

  },

  feuzon: {

    logo: '/v2logo-large/feuzon-black.png',

    subheader: 'Hybrid Shell Fusion',

    shortDescription:

      'A modern hybrid snare balancing warmth, articulation, and dynamic range.',

    bullets: [

      'Hybrid shell architecture',

      'Warmth with controlled resonance',

      'Bold attack and rich harmonics',

      'Responsive across playing styles',

      'Torch-tuned for tonal complexity',

      'A modern voice with handcrafted soul',

    ],

  },

  'founders-toast': {

    subheader: 'Artisan Wood Conditioning Wax',

    shortDescription:

      'A small-batch conditioning wax made to nourish, protect, and elevate the wood.',

    bullets: [

      'Handcrafted in small batches',

      'Natural oils and hand-melted beeswax',

      'Brings out depth in raw and satin woods',

      'Helps reduce friction at bearing edges',

      'Soft smoky-vanilla character',

      'Built to support feel, clarity, and care',

    ],

  },

};

const getButtonText = (product) => {

  if (product.currentQuantity === 0) return 'Out of Stock';

  if (product.id === 'soundlegend') return 'Start Your Build';

  if (

    product.id === 'founders-toast' ||

    product.id === 'heritage' ||

    product.id === 'feuzon'

  ) {

    return 'Order Today';

  }

  return 'Pre-Order Yours';

};

const ArtisanShopCard = ({ product }) => {

  const navigate = useNavigate();

  const isArtisan = ['heritage', 'feuzon', 'soundlegend', 'founders-toast'].includes(

    product.id

  );

  const productUrl = isArtisan ? `/artisan-shop/${product.id}` : `/merch/${product.id}`;

  const buttonText = getButtonText(product);

  const buttonClass =

    product.currentQuantity === 0

      ? 'preorder-card-out-of-stock-button'

      : 'preorder-card-preorder-button';

  const content = ARTISAN_COPY[product.id] || {

    logo: '',

    subheader: '',

    shortDescription: product.description || '',

    bullets: [],

  };

  const handleNavigate = () => {

    navigate(productUrl, { replace: false });

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        const scrollContainer =

          document.querySelector('.app-container') ||

          document.querySelector('.ourcraft-container') ||

          document.documentElement ||

          document.body;

        scrollContainer.scrollTo({ top: 0, behavior: 'auto' });

      });

    });

  };

  return (

    <div className="preorder-card">

      <div

        className="preorder-image-container"

        onClick={handleNavigate}

        onKeyDown={(e) => {

          if (e.key === 'Enter' || e.key === ' ') {

            handleNavigate();

          }

        }}

        role="button"

        tabIndex={0}

        aria-label={`View details of ${product.name}`}

      >

        <img

          src={product.thumbnail || product.images?.[0] || '/fallback.jpg'}

          alt={product.name}

          className="preorder-image"

          loading="lazy"

        />

      </div>

      {product.id !== 'founders-toast' ? (

        <div className="preorder-brand-block">

          <img

            src={content.logo}

            alt={`${product.name} logo`}

            className="preorder-header-logo"

          />

          <p className="preorder-subheader">{content.subheader}</p>

        </div>

      ) : (

        <div className="preorder-brand-block preorder-brand-block--toast">

          <h3 className="preorder-toast-title">FOUNDER’S TOAST</h3>

          <p className="preorder-subheader">{content.subheader}</p>

        </div>

      )}

      <div className="preorder-info">

        <p className="preorder-short-description">{content.shortDescription}</p>

        {content.bullets?.length > 0 && (

          <ul className="preorder-bullet-list">

            {content.bullets.map((bullet, index) => (

              <li key={`${product.id}-bullet-${index}`} className="preorder-bullet-item">

                {bullet}

              </li>

            ))}

          </ul>

        )}

        <div className="preorder-card-bottom">

          <div className="preorder-button-container">

            <button

              className={buttonClass}

              onClick={handleNavigate}

              disabled={product.currentQuantity === 0}

            >

              {buttonText}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

};

export default ArtisanShopCard;