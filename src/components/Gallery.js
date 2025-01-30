import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './Gallery.css';

const categories = [
  "Wood Selection",
  "Planning & Concepting",
  "Mockup Designs",
  "Cutting Process",
  "Finishing",
  "Drilling",
  "Assembly",
  "Finished Product",
  "Behind the Scenes"
];

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const galleryCollection = collection(db, 'galleryImages');
        const q = query(galleryCollection, orderBy('galleryOrder'));
        const querySnapshot = await getDocs(q);

        const images = querySnapshot.docs
          .map((doc) => doc.data())
          .filter((image) => image.visible);

        setImages(images);
        setFilteredImages(images.filter(img => img.category === selectedCategory));
      } catch (err) {
        setError('Failed to load gallery images.');
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    setFilteredImages(images.filter(img => img.category === selectedCategory));
  }, [selectedCategory, images]);

  // Handle keyboard accessibility for clicking images
  const handleKeyPress = (event, image) => {
    if (event.key === "Enter" || event.key === " ") {
      setLightboxImage(image.url);
    }
  };

  if (loading) return <p>Loading gallery...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="gallery-container">
      <div className="story-container">
        <h2>The Journey of Craftsmanship</h2>
        <p>Explore each step of the drum-building process, from raw wood to a finished masterpiece.</p>
      </div>

      {/* Category Selector */}
      <div className="category-tabs">
        {categories.map((category, index) => (
          <button
            key={index}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      <div className="image-grid">
        {filteredImages.map((image, index) => (
          <div
            key={index}
            className="image-item"
            role="button"  // Accessibility improvement
            tabIndex="0"  // Allows tab navigation
            onClick={() => setLightboxImage(image.url)}
            onKeyDown={(event) => handleKeyPress(event, image)}
          >
            <img src={image.url} alt={image.category} />
          </div>
        ))}
      </div>

      {/* Lightbox View */}
      {lightboxImage && (
        <div
          className="lightbox"
          role="button"  // Accessibility improvement
          tabIndex="0"  // Allows tab navigation
          onClick={() => setLightboxImage(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              setLightboxImage(null);
            }
          }}
        >
          <img src={lightboxImage} alt="Expanded View" />
        </div>
      )}
    </div>
  );
};

export default Gallery;