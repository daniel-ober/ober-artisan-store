import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Snackbar, Alert } from '@mui/material';
import './SiteSettings.css';

const SiteSettings = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [features, setFeatures] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch navbarLinks sub-collection
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const navbarLinks = navbarLinksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        navbarLinks.sort((a, b) => b.enabled - a.enabled); // Enabled links first

        // Fetch features sub-collection
        const featuresCollection = collection(db, 'settings', 'site', 'features');
        const featuresSnapshot = await getDocs(featuresCollection);
        const featuresData = {};
        featuresSnapshot.forEach((doc) => {
          featuresData[doc.id] = doc.data();
        });

        setNavbarLinks(navbarLinks);
        setFeatures(featuresData);
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleFeature = (featureId) => {
    setFeatures((prev) => ({
      ...prev,
      [featureId]: { ...prev[featureId], enabled: !prev[featureId].enabled },
    }));
    setUnsavedChanges(true);
  };

  const handleToggleNavbarLink = (id) => {
    const updatedLinks = navbarLinks.map((link) =>
      link.id === id ? { ...link, enabled: !link.enabled } : link
    );
    updatedLinks.sort((a, b) => b.enabled - a.enabled); // Reprioritize enabled links at the top
    setNavbarLinks(updatedLinks);
    setUnsavedChanges(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedLinks = Array.from(navbarLinks);
    const [moved] = reorderedLinks.splice(result.source.index, 1);
    reorderedLinks.splice(result.destination.index, 0, moved);

    setNavbarLinks(reorderedLinks);
    setUnsavedChanges(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
      navbarLinks.forEach(async (link) => {
        const linkRef = doc(navbarLinksCollection, link.id);
        await updateDoc(linkRef, { enabled: link.enabled, order: navbarLinks.indexOf(link) });
      });

      setUnsavedChanges(false);
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: 'Error saving settings.', severity: 'error' });
    }
  };

  return (
    <div className="site-settings-container">
      <h1>Site Settings</h1>
      <form onSubmit={handleSave}>
        <h3>Features</h3>
        <div className="features-container">
          {Object.entries(features).map(([key, feature]) => (
            <div key={key} className="feature-item">
              <span>{feature.label}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={feature.enabled}
                  onChange={() => handleToggleFeature(key)}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        <h3>Navbar Links</h3>
        <div className="navbar-preview-container">
          <div className="navbar-preview">
            {navbarLinks.map((link) => link.enabled && <div key={link.id}>{link.label}</div>)}
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="navbar-links">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="navbar-links-list">
                {navbarLinks.map((link, index) => (
                  <Draggable key={link.id} draggableId={link.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="navbar-link-item"
                      >
                        <span className="drag-indicator">⋮</span>
                        <span className="link-name">{link.label}</span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={link.enabled}
                            onChange={() => handleToggleNavbarLink(link.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <button type="submit" className="settings-save-btn" disabled={!unsavedChanges}>
          Save Changes
        </button>
      </form>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default SiteSettings;
