import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
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
        // Fetch navbar links from Firebase
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const navbarLinks = navbarLinksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Sort navbar links by the 'order' field (only for enabled links)
        navbarLinks.sort((a, b) => a.order - b.order);

        // Fetch feature toggles from Firebase
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
    updatedLinks.sort((a, b) => a.order - b.order); // Maintain the correct order for active links
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
      // Save updated navbar links to Firebase
      const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
      navbarLinks.forEach(async (link) => {
        const linkRef = doc(navbarLinksCollection, link.id);
        await updateDoc(linkRef, { enabled: link.enabled, order: navbarLinks.indexOf(link) }); // Save order
      });

      // Save updated features to Firebase
      const featuresCollection = collection(db, 'settings', 'site', 'features');
      Object.entries(features).forEach(async ([key, feature]) => {
        const featureRef = doc(featuresCollection, key);
        await updateDoc(featureRef, { enabled: feature.enabled }); // Save feature state
      });

      setUnsavedChanges(false);
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: 'Error saving settings.', severity: 'error' });
    }
  };

  // Separate active and inactive navbar links
  const activeNavbarLinks = navbarLinks.filter((link) => link.enabled);
  const inactiveNavbarLinks = navbarLinks.filter((link) => !link.enabled);

  // Sort inactive links alphabetically by label
  inactiveNavbarLinks.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="site-settings-container">
      <h2>Site Settings</h2>
      <form onSubmit={handleSave}>
        <h3>Features</h3>
        <div className="features-container">
          {Object.entries(features).map(([key, feature]) => (
            <div key={key} className="feature-item">
              <span>{feature.label}</span>
              <label className="toggle-switch" htmlFor={`feature-${key}`} aria-label={`Toggle ${feature.label}`}>
                <input
                  type="checkbox"
                  checked={feature.enabled}
                  onChange={() => handleToggleFeature(key)}
                  id={`feature-${key}`}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        <h3>Manage Navbar</h3>
        <div className="navbar-preview-container">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="navbar-preview" direction="horizontal">
              {(provided) => (
                <div
                  className="navbar-preview"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {activeNavbarLinks
                    .map((link, index) => (
                      <Draggable key={link.id} draggableId={link.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="navbar-preview-item"
                          >
                            {link.label}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Display list of all navbar links with toggle buttons */}
        <div className="navbar-links-container">
          {/* Active Navbar Links */}
          <h4>Active Navbar Links</h4>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="active-navbar-links">
              {(provided) => (
                <div
                  className="navbar-links-list"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {activeNavbarLinks.map((link, index) => (
                    <Draggable key={link.id} draggableId={link.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="navbar-link-item"
                        >
                          <span>{link.label}</span>
                          <label className="toggle-switch" htmlFor={`navbar-link-${link.id}`} aria-label={`Toggle ${link.label}`}>
                            <input
                              type="checkbox"
                              checked={link.enabled}
                              onChange={() => handleToggleNavbarLink(link.id)}
                              id={`navbar-link-${link.id}`}
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

          {/* Inactive Navbar Links */}
          <h4>Inactive Navbar Links</h4>
          {inactiveNavbarLinks.map((link) => (
            <div key={link.id} className="navbar-link-item">
              <span>{link.label}</span>
              <label className="toggle-switch" htmlFor={`navbar-link-${link.id}`} aria-label={`Toggle ${link.label}`}>
                <input
                  type="checkbox"
                  checked={link.enabled}
                  onChange={() => handleToggleNavbarLink(link.id)}
                  id={`navbar-link-${link.id}`}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

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
