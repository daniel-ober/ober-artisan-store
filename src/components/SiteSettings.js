import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Snackbar, Alert } from '@mui/material';
import './SiteSettings.css';

const ROLES = ['soundlegend', 'admin'];

const SiteSettings = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [features, setFeatures] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const navbarLinksSnapshot = await getDocs(
          collection(db, 'settings', 'site', 'navbarLinks')
        );
        const navbarLinks = navbarLinksSnapshot.docs.map((doc) => ({
          id: doc.id,
          access: ['public'],
          ...doc.data(),
        }));
        navbarLinks.sort((a, b) => a.order - b.order);

        const featuresSnapshot = await getDocs(
          collection(db, 'settings', 'site', 'features')
        );
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

  const handleAccessChange = (id, role) => {
    setNavbarLinks((prev) =>
      prev.map((link) =>
        link.id === id
          ? {
              ...link,
              access: link.access.includes(role)
                ? link.access.filter((r) => r !== role)
                : [...link.access, role],
            }
          : link
      )
    );
    setUnsavedChanges(true);
  };

  const handleToggleNavbarLink = (id) => {
    setNavbarLinks((prev) => {
      const updated = prev.map((link) => {
        if (link.id === id) {
          const toggled = !link.enabled;
          return {
            ...link,
            enabled: toggled,
            access: toggled ? ['public', 'soundlegend', 'admin'] : link.access,
          };
        }
        return link;
      });
      updated.sort((a, b) => a.order - b.order);
      return updated;
    });
    setUnsavedChanges(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const active = navbarLinks.filter((l) => l.enabled);
    const inactive = navbarLinks.filter((l) => !l.enabled);
    const reordered = [...active];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const newLinks = [...reordered, ...inactive].map((link, idx) => ({
      ...link,
      order: idx,
    }));
    setNavbarLinks(newLinks);
    setUnsavedChanges(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const navbarRef = collection(db, 'settings', 'site', 'navbarLinks');
      navbarLinks.forEach(async (link) => {
        const linkRef = doc(navbarRef, link.id);
        await updateDoc(linkRef, {
          enabled: link.enabled,
          order: navbarLinks.indexOf(link),
          access: link.access || ['public'],
        });
      });

      const featuresRef = collection(db, 'settings', 'site', 'features');
      Object.entries(features).forEach(async ([key, feature]) => {
        const featureRef = doc(featuresRef, key);
        await updateDoc(featureRef, { enabled: feature.enabled });
      });

      setUnsavedChanges(false);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Error saving settings.',
        severity: 'error',
      });
    }
  };

  const activeLinks = navbarLinks.filter((l) => l.enabled);
  const restrictedLinks = navbarLinks.filter((l) => !l.enabled);

  return (
    <div className="site-settings-container">
      <h2>Site Settings</h2>
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
                  onChange={() =>
                    setFeatures((prev) => ({
                      ...prev,
                      [key]: { ...feature, enabled: !feature.enabled },
                    }))
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        <h3>Active Navbar Links</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="active-navbar-links">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="navbar-links-list"
              >
                {activeLinks.map((link, index) => (
                  <Draggable key={link.id} draggableId={link.id} index={index}>
                    {(provided) => (
                      <div
                        className="navbar-link-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <span>{link.label}</span>
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

        <h4>Restricted (Admin/SoundLegend Only)</h4>
        <div className="navbar-links-list">
          {restrictedLinks.map((link) => (
            <div key={link.id} className="navbar-link-item restricted-layout">
              <div className="restricted-col link-label">{link.label}</div>
              <div className="restricted-col access-wrapper">
                <div className="access-checkbox-group">
                  {ROLES.map((role) => (
                    <label key={role} className="access-checkbox">
                      <input
                        type="checkbox"
                        checked={link.access?.includes(role)}
                        onChange={() => handleAccessChange(link.id, role)}
                      />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="restricted-col toggle-wrapper">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={link.enabled}
                    onChange={() => handleToggleNavbarLink(link.id)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="settings-save-btn"
          disabled={!unsavedChanges}
        >
          Save Changes
        </button>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() =>
          setSnackbar({ open: false, message: '', severity: 'success' })
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default SiteSettings;