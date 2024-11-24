import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Snackbar, Alert } from '@mui/material';
import { FaCartPlus } from 'react-icons/fa';
import './SiteSettings.css';

const SiteSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    navbarLinks: [],
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = doc(db, 'settings', 'site');
        const snapshot = await getDoc(settingsDoc);
        if (snapshot.exists()) {
          const fetchedSettings = snapshot.data();
          fetchedSettings.navbarLinks.sort((a, b) => b.enabled - a.enabled); // Sort enabled first
          setSettings(fetchedSettings);
        } else {
          console.error('Site settings document does not exist.');
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleNavbarLink = (index) => {
    const updatedLinks = [...settings.navbarLinks];
    updatedLinks[index].enabled = !updatedLinks[index].enabled;

    // Re-sort links: enabled links at the top
    updatedLinks.sort((a, b) => b.enabled - a.enabled);

    setSettings((prev) => ({
      ...prev,
      navbarLinks: updatedLinks,
    }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedLinks = Array.from(settings.navbarLinks);
    const [removed] = reorderedLinks.splice(result.source.index, 1);
    reorderedLinks.splice(result.destination.index, 0, removed);
    setSettings((prev) => ({
      ...prev,
      navbarLinks: reorderedLinks,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const settingsDoc = doc(db, 'settings', 'site');
      await setDoc(settingsDoc, settings);
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error saving site settings:', error);
      setSnackbar({ open: true, message: 'Error saving settings. Please try again.', severity: 'error' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  return (
    <div className="site-settings-container">
      <h1>Site Settings</h1>
      <form onSubmit={handleSubmit}>
        <h3>Navbar Links</h3>

        {/* Navbar Preview */}
        <div className="navbar-preview-container">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="navbar-preview" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="navbar-preview"
                >
                  {settings.navbarLinks.map((link, index) => (
                    link.enabled && (
                      <Draggable
                        key={`navbar-${link.name}`}
                        draggableId={`navbar-${link.name}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="navbar-preview-tab"
                          >
                            {link.label}
                          </div>
                        )}
                      </Draggable>
                    )
                  ))}
                  <Draggable
                    key="cart"
                    draggableId="cart"
                    index={settings.navbarLinks.length} // Place Cart at the end
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="navbar-preview-tab cart-tab"
                      >
                        Cart <FaCartPlus />
                      </div>
                    )}
                  </Draggable>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="navbar-links-list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="navbar-links-list"
              >
                {settings.navbarLinks.map((link, index) => (
                  <Draggable
                    key={`link-${link.name}`}
                    draggableId={`link-${link.name}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="navbar-link-item"
                      >
                        <span className="drag-indicator">⋮</span>
                        <span className="link-name">{link.label}</span>
                        <label
                          className="toggle-switch"
                          htmlFor={`navbar-link-${link.name}`}
                        >
                          <input
                            id={`navbar-link-${link.name}`}
                            type="checkbox"
                            aria-labelledby={`navbar-link-label-${link.name}`}
                            checked={link.enabled}
                            onChange={() => handleToggleNavbarLink(index)}
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
        <button type="submit" className="settings-save-btn">
          Save Changes
        </button>

        <div className="settings-field maintenance-field">
          <label
            htmlFor="maintenanceMode"
            id="maintenance-mode-label"
          >
            Enter Maintenance Mode:
          </label>
          <label className="toggle-switch" htmlFor="maintenanceMode">
            <input
              type="checkbox"
              id="maintenanceMode"
              aria-labelledby="maintenance-mode-label"
              checked={settings.maintenanceMode}
              onChange={() => {
                setSettings((prev) => ({
                  ...prev,
                  maintenanceMode: !prev.maintenanceMode,
                }));
              }}
            />
            <span className="slider"></span>
          </label>
        </div>
      </form>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SiteSettings;
