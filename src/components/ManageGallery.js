import React, { useState, useEffect } from 'react';
import { fetchGalleryImages, storage, db } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'; // Added deleteObject import
import { collection, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import './ManageGallery.css';

const ManageGallery = () => {
    const [galleryImages, setGalleryImages] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGalleryImages = async () => {
            try {
                const images = await fetchGalleryImages();
                setGalleryImages(images.map((url) => ({
                  url,
                  name: url.split('/').pop(),
                  visible: true
                })));
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
                // Uploading file to Firebase Storage
                const storageRef = ref(storage, `Gallery/${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);
                await uploadTask;

                // Get the download URL of the uploaded image
                const uploadedUrl = await getDownloadURL(storageRef);
                
                // Add image metadata to Firestore
                const imageDocRef = await addDoc(collection(db, "galleryImages"), {
                    url: uploadedUrl,
                    galleryOrder: galleryImages.length, // Set the order based on current images count
                    visible: true,
                });

                uploadedImages.push({
                    name: file.name,
                    url: uploadedUrl,
                    visible: true
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }
        setGalleryImages((prevImages) => [...prevImages, ...uploadedImages]);
    };

    const deleteImage = async (image) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete ${image.name}?`);
        if (!confirmDelete) return;

        try {
            // Decode the URL and extract the storage path
            const imagePath = decodeURIComponent(image.url.split('?')[0].split('Gallery/')[1]);
            const imageRef = ref(storage, `Gallery/${imagePath}`);

            await deleteObject(imageRef);
            setGalleryImages((prevImages) => prevImages.filter((img) => img.name !== image.name));
            alert('Image deleted successfully!');
        } catch (error) {
            console.error('Failed to delete image:', error);
            alert('Failed to delete image. Please try again.');
        }
    };

    const toggleVisibility = async (image) => {
        const updatedVisibility = !image.visible;
        setGalleryImages((prevImages) =>
            prevImages.map((img) =>
                img.name === image.name ? { ...img, visible: updatedVisibility } : img
            )
        );

        try {
            // Get the reference to the Firestore document
            const galleryDocRef = collection(db, 'galleryImages');
            const querySnapshot = await getDocs(galleryDocRef);
            const docToUpdate = querySnapshot.docs.find(doc => doc.data().url === image.url);
            if (docToUpdate) {
                // Update the visible field in Firestore
                await updateDoc(docToUpdate.ref, {
                    visible: updatedVisibility
                });
            }
        } catch (error) {
            console.error('Failed to update visibility in Firestore:', error);
            alert('Failed to update visibility. Please try again.');
        }
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
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && document.querySelector('input[type="file"]').click()}
                    >
                        Drag and drop images here or
                        <input type="file" multiple accept="image/*" onChange={handleFileSelect} />
                    </div>
                    <div className="gallery-list">
                        {galleryImages.map((image) => (
                            <div key={image.name} className="gallery-item">
                                <img src={image.url} alt={image.name} />
                                <div className="gallery-item-buttons">
                                    <button onClick={() => deleteImage(image)} className="delete-btn">Delete</button>
                                    <button onClick={() => toggleVisibility(image)}>
                                        {image.visible ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ManageGallery;