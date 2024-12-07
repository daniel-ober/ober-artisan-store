import React, { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import './Gallery.css';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const story = [
    "The journey begins with carefully sourced wood, hand-selected for its tonal and aesthetic qualities.",
    "Crafted with precision, each drum shell is shaped using traditional and modern techniques.",
    "The finishing touches: hand-applied stains, custom hardware, and meticulous assembly.",
    "The final masterpiece, ready to inspire musicians and tell its story through sound."
  ];

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const storage = getStorage();
        const imagesRef = ref(storage, 'Gallery/'); // Adjust path as needed
        const result = await listAll(imagesRef);
        const imageUrls = await Promise.all(
          result.items.map((item) => getDownloadURL(item))
        );
        setImages(imageUrls);
      } catch (err) {
        setError('Failed to load gallery images.');
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) return <p>Loading gallery...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="gallery-container">
      <div className="story-container">
        <h2>The Journey of Craftsmanship</h2>
        <p>Discover the lifecycle of a drum, from raw wood to a masterpiece of sound and design.</p>
      </div>
      <div className="image-slider">
        {images.map((url, index) => (
          <div key={index} className="image-slide">
            <img src={url} alt={`Slide ${index + 1}`} />
            <div className="caption">{story[index % story.length]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
