import React, { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const storage = getStorage();
                const imagesRef = ref(storage, 'gallery/'); // Adjust path as needed
                const result = await listAll(imagesRef);
                const imageUrls = await Promise.all(
                    result.items.map((item) => getDownloadURL(item))
                );
                setImages(imageUrls);
            } catch (err) {
                console.error('Error fetching images:', err);
                setError('Failed to load gallery images. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    if (loading) return <p>Loading gallery...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="gallery">
            {images.map((url, index) => (
                <img
                    key={index}
                    src={url}
                    alt={`drum ${index + 1}`} // Meaningful alt text
                    className="gallery-image"
                />
            ))}
        </div>
    );
};

export default Gallery;
