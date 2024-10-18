import React, { useEffect, useState } from 'react';
import './ImageSequence.css';

const ImageSequence = () => {
    // Updated array of local image URLs
    const imageUrls = [
        "/imagesequence/DSC00986.png",
        "/imagesequence/DSC00987.png",
        "/imagesequence/DSC00988.png",
        "/imagesequence/DSC00989.png",
        "/imagesequence/DSC00990.png",
        "/imagesequence/DSC00991.png",
        "/imagesequence/DSC00992.png",
        "/imagesequence/DSC00993.png",
        "/imagesequence/DSC00994.png",
        "/imagesequence/DSC00995.png",
        "/imagesequence/DSC00996.png",
        "/imagesequence/DSC00997.png",
        "/imagesequence/DSC00998.png",
        "/imagesequence/DSC00999.png",
        "/imagesequence/DSC01000.png",
        "/imagesequence/DSC01001.png",
        "/imagesequence/DSC00986.png",
        "/imagesequence/DSC00987.png",
        "/imagesequence/DSC00988.png",
        "/imagesequence/DSC00989.png",
        "/imagesequence/DSC00990.png",
        "/imagesequence/DSC00991.png",
        "/imagesequence/DSC00992.png",
        "/imagesequence/DSC00993.png",
        "/imagesequence/DSC00994.png",
        "/imagesequence/DSC00995.png",
        "/imagesequence/DSC00996.png",
        "/imagesequence/DSC00997.png",
        "/imagesequence/DSC00998.png",
        "/imagesequence/DSC00999.png",
        "/imagesequence/DSC01000.png",
        "/imagesequence/DSC01001.png",
        "/imagesequence/DSC00986.png",
        "/imagesequence/DSC00987.png",
        "/imagesequence/DSC00988.png",
        "/imagesequence/DSC00989.png",
        "/imagesequence/DSC00990.png",
        "/imagesequence/DSC00991.png",
        "/imagesequence/DSC00992.png",
        "/imagesequence/DSC00993.png",
        "/imagesequence/DSC00994.png",
        "/imagesequence/DSC00995.png",
        "/imagesequence/DSC00996.png",
        "/imagesequence/DSC00997.png",
        "/imagesequence/DSC00998.png",
        "/imagesequence/DSC00999.png",
        "/imagesequence/DSC01000.png",
        "/imagesequence/DSC01001.png",        "/imagesequence/DSC00986.png",
        "/imagesequence/DSC00987.png",
        "/imagesequence/DSC00988.png",
        "/imagesequence/DSC00989.png",
        "/imagesequence/DSC00990.png",
        "/imagesequence/DSC00991.png",
        "/imagesequence/DSC00992.png",
        "/imagesequence/DSC00993.png",
        "/imagesequence/DSC00994.png",
        "/imagesequence/DSC00995.png",
        "/imagesequence/DSC00996.png",
        "/imagesequence/DSC00997.png",
        "/imagesequence/DSC00998.png",
        "/imagesequence/DSC00999.png",
        "/imagesequence/DSC01000.png",
        "/imagesequence/DSC01001.png"
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState([]); // Store preloaded images here

    // Function to preload images
    const preloadImages = (urls) => {
        const loaded = urls.map((url) => {
            const img = new Image();
            img.src = url;
            return img;
        });
        setLoadedImages(loaded);
    };

    useEffect(() => {
        // Preload all images once the component mounts
        preloadImages(imageUrls);
    }, []); // Empty dependency array to only run this effect once

    const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const totalHeight = document.body.scrollHeight - window.innerHeight;

        // Adjust this factor to change speed
        const sensitivityFactor = 0.5; // Lower values make it slower, higher values make it faster

        const index = Math.floor((scrollPosition / totalHeight) * imageUrls.length * sensitivityFactor);
        setCurrentIndex(Math.min(index, imageUrls.length - 1)); // Ensure the index doesn't exceed the array length
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []); // Empty array so this effect runs only once on mount

    return (
        <div className="image-sequence">
            {loadedImages.length > 0 && (
                <img 
                    src={loadedImages[currentIndex]?.src || ""} 
                    alt={`Frame ${currentIndex + 1} of the animation`}
                    className={currentIndex === currentIndex ? "show" : ""}
                />
            )}
        </div>
    );
};

export default ImageSequence;
