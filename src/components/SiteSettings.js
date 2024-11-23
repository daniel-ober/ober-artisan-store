import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './SiteSettings.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const SiteSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    navbarLinks: [],
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = doc(db, 'settings', 'site');
        const snapshot = await getDoc(settingsDoc);
        if (snapshot.exists()) {
          setSettings(snapshot.data());
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
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving site settings:', error);
    }
  };

  const handleMaintenanceModeToggle = () => {
    if (!settings.maintenanceMode) {
      const confirm = window.confirm('Are you sure you want to enter Maintenance Mode?');
      if (!confirm) return;
    }
    setSettings((prev) => ({
      ...prev,
      maintenanceMode: !prev.maintenanceMode,
    }));
  };

  return (
    <div className="site-settings-container">
      <h1>Site Settings</h1>
      <form onSubmit={handleSubmit}>
        <h3>Navbar Links</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="navbar-links">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {settings.navbarLinks.map((link, index) => (
                  <Draggable key={link.name} draggableId={link.name} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="navbar-link-item"
                      >
                        <label
                          htmlFor={`navbar-link-${link.name}`}
                          className="link-name"
                          id={`navbar-link-label-${link.name}`}
                        >
                          {link.label}
                        </label>
                        <label className="toggle-switch" htmlFor={`navbar-link-${link.name}`}>
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
          <label htmlFor="maintenanceMode" className="maintenance-label">
            Enter Maintenance Mode:
          </label>
          <label className="toggle-switch" htmlFor="maintenanceMode">
            <input
              id="maintenanceMode"
              type="checkbox"
              aria-labelledby="maintenanceModeLabel"
              checked={settings.maintenanceMode}
              onChange={handleMaintenanceModeToggle}
            />
            <span className="slider"></span>
          </label>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;
