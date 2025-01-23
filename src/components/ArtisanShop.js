import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the path to your Firebase config
import './ArtisanShop.css';

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
    <div className="artisan-shop">
      {/* Base Hero Image */}
      <div
        className="image-layer base"
        style={{
          backgroundImage: "url('/artisan-shop/artisan-showroom-bottom.png')",
        }}
      />

      {/* Highlighted Images */}
      {Object.keys(drumDetails).map((drumKey) => (
        <div
          key={drumKey}
          className={`image-layer ${
            hoveredDrum === drumKey ? 'visible' : ''
          }`}
          style={{
            backgroundImage: `url('${drumDetails[drumKey]?.overlayImageUrl}')`,
          }}
        />
      ))}

      {/* Hover Zones */}
      <div className="hover-zones">
        {Object.keys(drumDetails).map((drumKey) => (
          <div
            key={drumKey}
            className={`hover-zone ${drumKey.toLowerCase()}`}
            role="button"
            tabIndex="0"
            onMouseEnter={() => handleHover(drumKey)}
            onMouseLeave={() => setHoveredDrum(null)}
          />
        ))}
      </div>

      {/* Popup Section */}
      <div className="popup-container">
        {hoveredDrum && drumDetails[hoveredDrum] && (
          <div className="info-popup">
            <img
              src={drumDetails[hoveredDrum].imageUrl}
              alt={`${hoveredDrum} Drum`}
              className="popup-image"
            />
            <h2>{hoveredDrum}</h2>
            <p>{drumDetails[hoveredDrum].description}</p>
            <p className="popup-price">{drumDetails[hoveredDrum].price}</p>
            <button
              className="more-info"
              onClick={() =>
                (window.location.href = `/products/${drumDetails[hoveredDrum].id}`)
              }
            >
              More Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtisanShop;