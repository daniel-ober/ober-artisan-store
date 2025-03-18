import React, { useState, useEffect } from 'react';
import { fetchGalleryImages, storage, db } from '../firebaseConfig';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  writeBatch,
  doc,
  query,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import './ManageGallery.css';

const ManageGallery = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const galleryCollection = collection(db, 'galleryImages');
        const q = query(galleryCollection, orderBy('galleryOrder'));
        const querySnapshot = await getDocs(q);

        const images = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            if (a.visible === b.visible) return a.galleryOrder - b.galleryOrder;
            return a.visible ? -1 : 1;
          });

        setGalleryImages(images);
      } catch (error) {
        console.error('Failed to load gallery images:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGalleryImages();
  }, []);

  const uploadImages = async (files) => {
    const uploadedImages = [];
    for (const file of files) {
      try {
        const storageRef = ref(storage, `Gallery/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        await uploadTask;
        const uploadedUrl = await getDownloadURL(storageRef);

        const imageDocRef = await addDoc(collection(db, 'galleryImages'), {
          url: uploadedUrl,
          galleryOrder: galleryImages.length,
          visible: true,
        });

        uploadedImages.push({
          id: imageDocRef.id,
          name: file.name,
          url: uploadedUrl,
          galleryOrder: galleryImages.length,
          visible: true,
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
    setGalleryImages((prevImages) =>
      [...prevImages, ...uploadedImages].sort((a, b) => {
        if (a.visible === b.visible) return a.galleryOrder - b.galleryOrder;
        return a.visible ? -1 : 1;
      })
    );
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    uploadImages(files);
  };

  const deleteImage = async (image) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${image.name || 'this image'}?`
    );
    if (!confirmDelete) return;

    try {
      if (!image.url) {
        throw new Error('Image URL is missing.');
      }

      const decodedUrl = decodeURIComponent(image.url);
      const fileName = decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1).split('?')[0];
      if (!fileName) {
        throw new Error('Unable to extract file name from URL.');
      }

      const imagePath = `Gallery/${fileName}`;
      const imageRef = ref(storage, imagePath);

      // Delete the file from Firebase Storage
      await deleteObject(imageRef);

      // Delete the document from Firestore
      await deleteDoc(doc(db, 'galleryImages', image.id));

      // Update the state to reflect the changes
      setGalleryImages((prevImages) =>
        prevImages.filter((img) => img.id !== image.id)
      );
    } catch (error) {
      console.error('Failed to delete image:', error.message);
      alert('Failed to delete the image. Please try again.');
    }
  };

  const toggleVisibility = async (image) => {
    const updatedVisibility = !image.visible;
    try {
      await updateDoc(doc(db, 'galleryImages', image.id), {
        visible: updatedVisibility,
      });

      setGalleryImages((prevImages) =>
        prevImages
          .map((img) =>
            img.id === image.id
              ? { ...img, visible: updatedVisibility }
              : img
          )
          .sort((a, b) => {
            if (a.visible === b.visible) return a.galleryOrder - b.galleryOrder;
            return a.visible ? -1 : 1;
          })
      );
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleDragStart = (index) => {
    setDragging(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragging === index) return;

    const updatedGallery = [...galleryImages];
    const [draggedItem] = updatedGallery.splice(dragging, 1);
    updatedGallery.splice(index, 0, draggedItem);

    updatedGallery.forEach((item, i) => (item.galleryOrder = i));
    setGalleryImages(updatedGallery);
    setDragging(index);
  };

  const handleDragEnd = () => {
    saveOrder();
    setDragging(null);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const batch = writeBatch(db);
      galleryImages.forEach((image) => {
        const imageRef = doc(db, 'galleryImages', image.id);
        batch.update(imageRef, { galleryOrder: image.galleryOrder });
      });
      try {
        await batch.commit();
        // console.log("✅ Firestore Batch Commit Successful!");
      } catch (err) {
        console.error("❌ Firestore Batch Commit Failed:", err.message);
      }
    } catch (error) {
      console.error('Failed to save order:', error);
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="manage-gallery">
      <h2>Manage Gallery</h2>
      {loading ? (
        <p>Loading gallery images...</p>
      ) : (
        <>
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          {savingOrder && <p>Saving order...</p>}
          <div className="gallery-list">
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`gallery-item ${
                  !image.visible ? 'hidden' : ''
                }`}
              >
                <img src={image.url} alt={image.name} />
                <div className="gallery-item-buttons">
                  <button
                    onClick={() => deleteImage(image)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => toggleVisibility(image)}
                    className={`toggle-visibility-btn ${
                      !image.visible ? 'show-button' : ''
                    }`}
                  >
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