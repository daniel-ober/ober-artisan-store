import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './OriginalArtisanShop.css';

const ArtisanShop = () => {
  const [hoveredDrum, setHoveredDrum] = useState(null);
  const [drumDetails, setDrumDetails] = useState({});

  useEffect(() => {
    const fetchDrumDetails = async () => {
      try {
        const productsCollection = collection(db, 'products');
        const snapshot = await getDocs(productsCollection);
        const fetchedDrumDetails = {};

        snapshot.forEach((doc) => {
          const product = doc.data();
          if (['HERITAGE', 'ONE', 'VAPRE'].includes(product.name.toUpperCase())) {
            fetchedDrumDetails[product.name.toUpperCase()] = {
              description: product.description,
              price: `$${product.price.toFixed(2)}`,
              status: product.status || 'available',
              imageUrl: product.images?.[0] || '/fallback-images/image-coming-soon.png',
              overlayImageUrl: `/artisan-shop/artisan-showroom-option-${product.name.toLowerCase()}.png`,
              id: doc.id,
            };
          }
        });

        setDrumDetails(fetchedDrumDetails);
      } catch (error) {
        console.error('Error fetching drum details:', error);
      }
    };

    fetchDrumDetails();
  }, []);

  const handleHover = (drum) => {
    setHoveredDrum(drum);
  };

  return (
    <div className="original-artisan-shop">
      {/* Base Hero Image */}
      <div
        className="original-image-layer base"
        style={{
          backgroundImage: "url('/artisan-shop/artisan-showroom-bottom.png')",
        }}
      />

      {/* Highlighted Images */}
      {Object.keys(drumDetails).map((drumKey) => (
        <div
          key={drumKey}
          className={`original-image-layer ${
            hoveredDrum === drumKey ? 'visible' : ''
          }`}
          style={{
            backgroundImage: `url('${drumDetails[drumKey]?.overlayImageUrl}')`,
          }}
        />
      ))}

      {/* Hover Zones */}
   {/* Hover Zones */}
<div className="original-hover-zones">
  {Object.keys(drumDetails).map((drumKey) => (
    <div
      key={drumKey}
      className={`original-hover-zone ${drumKey.toLowerCase()}`}
      role="button"
      tabIndex="0"
      onMouseEnter={() => handleHover(drumKey)}
      onMouseLeave={() => setHoveredDrum(null)}
      onClick={() => handleHover(drumKey)} // For touch devices
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleHover(drumKey);
        }
      }}
    />
  ))}
</div>

      {/* Popup Section */}
      {hoveredDrum && drumDetails[hoveredDrum] && (
        <div className="original-popup-container">
          <div className="original-info-popup">
            <img
              src={drumDetails[hoveredDrum].imageUrl}
              alt={`${hoveredDrum} Drum`}
              className="original-popup-image"
            />
            <h2>{hoveredDrum}</h2>
            <p>{drumDetails[hoveredDrum].description}</p>
            <p className="original-popup-price">{drumDetails[hoveredDrum].price}</p>
            <button
              className="original-more-info"
              onClick={() =>
                (window.location.href = `/products/${drumDetails[hoveredDrum].id}`)
              }
            >
              More Info
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtisanShop;