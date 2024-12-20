// ManageGallery.js
import React, { useState, useEffect } from 'react';
import { fetchGalleryImages } from '../firebaseConfig'; // Corrected import path
import './ManageGallery.css';

const ManageGallery = () => {
    const [galleryImages, setGalleryImages] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch current images from Firebase Storage
    useEffect(() => {
        const loadGalleryImages = async () => {
            try {
                const images = await fetchGalleryImages();
                setGalleryImages(images.map((url) => ({ url, name: url.split('/').pop(), visible: true })));
                setLoading(false);
            } catch (error) {
                console.error("Failed to load gallery images:", error);
                setLoading(false);
            }
        };
        loadGalleryImages();
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        uploadImages(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        uploadImages(files);
    };

    const uploadImages = async (files) => {
        const uploadedImages = [];
        for (const file of files) {
            try {
                // Logic for uploading files to Firebase
                console.log(`Uploading ${file.name} to /Gallery`);
                const uploadedUrl = `/Gallery/${file.name}`; // Replace this with the actual upload URL
                uploadedImages.push({ name: file.name, url: uploadedUrl, visible: true });
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }
        setGalleryImages((prevImages) => [...prevImages, ...uploadedImages]);
    };

    const toggleVisibility = (image) => {
        setGalleryImages((prevImages) =>
            prevImages.map((img) =>
                img.name === image.name ? { ...img, visible: !img.visible } : img
            )
        );
    };

    const updateOrder = (image, direction) => {
        const index = galleryImages.findIndex((img) => img.name === image.name);
        if (index === -1) return;
        const newGallery = [...galleryImages];
        const [removed] = newGallery.splice(index, 1);
        newGallery.splice(direction === 'up' ? index - 1 : index + 1, 0, removed);
        setGalleryImages(newGallery);
    };

    return (
        <div className="manage-gallery">
            <h2>Manage Gallery</h2>
            {loading ? (
                <p>Loading gallery images...</p>
            ) : (
                <>
                    <div
                        className={`upload-zone ${dragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        Drag and drop images here or
                        <input type="file" multiple accept="image/*" onChange={handleFileSelect} />
                    </div>
                    <div className="gallery-list">
                        {galleryImages.map((image, index) => (
                            <div key={index} className="gallery-item">
                                <img src={image.url} alt={image.name} />
                                <button onClick={() => toggleVisibility(image)}>
                                    {image.visible ? 'Hide' : 'Show'}
                                </button>
                                <button
                                    disabled={index === 0}
                                    onClick={() => updateOrder(image, 'up')}
                                >
                                    Move Up
                                </button>
                                <button
                                    disabled={index === galleryImages.length - 1}
                                    onClick={() => updateOrder(image, 'down')}
                                >
                                    Move Down
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ManageGallery;
