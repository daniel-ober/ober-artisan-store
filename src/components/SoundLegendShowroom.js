import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './SoundLegendShowroom.css';

const SoundLegendShowroom = () => {
  const { serial } = useParams();
  const [drumData, setDrumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalIndex, setModalIndex] = useState(null); // ✅ track which image is open

  useEffect(() => {
    const fetchDrumData = async () => {
      try {
        const ref = doc(db, 'soundlegend_showroom', serial.toUpperCase());
        const snap = await getDoc(ref);
        setDrumData(snap.exists() ? snap.data() : { notFound: true });
      } catch (err) {
        console.error('Error fetching drum data:', err);
        setDrumData({ notFound: true });
      } finally {
        setLoading(false);
      }
    };
    fetchDrumData();
    window.scrollTo(0, 0);
  }, [serial]);

  // ✅ Keyboard Navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (modalIndex === null) return;
      if (e.key === 'Escape') setModalIndex(null);
      if (e.key === 'ArrowRight')
        setModalIndex((prev) => (prev + 1) % drumData.gallery.length);
      if (e.key === 'ArrowLeft')
        setModalIndex((prev) =>
          prev === 0 ? drumData.gallery.length - 1 : prev - 1
        );
    },
    [modalIndex, drumData]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading)
    return <div className="showroom-loading">Loading drum details...</div>;
  if (drumData?.notFound)
    return <div className="showroom-not-found">❌ Drum not found.</div>;

  const {
    name = 'Unknown Drum',
    heroImage,
    gallery = [],
    specs = {},
    story,
    links = {},
  } = drumData;

  return (
    <div className="soundlegend-showroom">
      {/* Header Logo */}
      <img
        src="/resized-logos/soundlegend-white.png"
        alt="SoundLegend Series"
        className="showroom-logo"
      />

      {/* Hero Section */}
      <div className="showroom-hero">
        {heroImage && (
          <img src={heroImage} alt={name} className="showroom-hero-image" />
        )}
        <div className="showroom-hero-overlay">
          <h1>{name}</h1>
          <p className="serial-tag">{serial.toUpperCase()}</p>
        </div>
      </div>

      {/* Specs */}
      {/* <section className="showroom-specs">
        <h2>Build Specifications</h2>
        <ul>
          <li>
            <strong>Size:</strong> {specs.size}
          </li>
          <li>
            <strong>Shell:</strong> {specs.shell}
          </li>
          <li>
            <strong>Finish:</strong> {specs.finish}
          </li>
          <li>
            <strong>Hardware:</strong> {specs.hardware}
          </li>
          <li>
            <strong>Bearing Edges:</strong> {specs.bearingEdges}
          </li>
          <li>
            <strong>Snare Wires:</strong> {specs.snareWires}
          </li>
        </ul>
      </section> */}

      {/* Story Section */}
      {story && (
        <section className="showroom-story elegant-font">
          <h2>The Story Behind This Build</h2>
          <div
            className="showroom-story-content"
            dangerouslySetInnerHTML={{ __html: drumData.story }}
          ></div>

          {/* {(links.spotify ||
            links.itunes ||
            links.youtube ||
            links.instagram ||
            links.facebook) && (
            <div className="artist-links">
              <h3>Connect with the Artist</h3>
              <div className="links-row">
                {links.spotify && (
                  <a href={links.spotify} target="_blank" rel="noreferrer">
                    <i className="fab fa-spotify"></i>
                  </a>
                )}
                {links.itunes && (
                  <a href={links.itunes} target="_blank" rel="noreferrer">
                    <i className="fab fa-apple"></i>
                  </a>
                )}
                {links.youtube && (
                  <a href={links.youtube} target="_blank" rel="noreferrer">
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
                {links.instagram && (
                  <a href={links.instagram} target="_blank" rel="noreferrer">
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {links.facebook && (
                  <a href={links.facebook} target="_blank" rel="noreferrer">
                    <i className="fab fa-facebook"></i>
                  </a>
                )}
              </div>
            </div>
          )} */}
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="showroom-gallery">
          <h2>Gallery</h2>
          <div className="gallery-grid">
            {gallery.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${name} - ${i}`}
                onClick={() => setModalIndex(i)}
                className="gallery-thumb"
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {modalIndex !== null && (
        <div
          className="showroom-modal-overlay"
          onClick={() => setModalIndex(null)}
        >
          <div
            className="showroom-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="showroom-modal-close"
              onClick={() => setModalIndex(null)}
            >
              ✕
            </button>

            {/* Prev Button */}
            <button
              className="showroom-modal-prev"
              onClick={() =>
                setModalIndex(
                  modalIndex === 0 ? gallery.length - 1 : modalIndex - 1
                )
              }
            >
              ‹
            </button>

            {/* Image */}
            <img
              src={gallery[modalIndex]}
              alt="Preview"
              className="showroom-modal-image"
            />

            {/* Next Button */}
            <button
              className="showroom-modal-next"
              onClick={() => setModalIndex((modalIndex + 1) % gallery.length)}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* NFC Info */}
      <section className="showroom-legacy">
        <p>
          This SoundLegend drum is digitally authenticated and part of an
          exclusive artist series. While anyone is welcome to explore its legacy
          here, SoundLegend artists enjoy a deeper connection — with private
          access to their full build journey, behind-the-scenes content, and
          exclusive perks through the SoundLegend online portal.
          <br />
          <br />
          <a href="/soundlegends/signin" className="portal-link">
            Sign in here
          </a>{' '}
          to access your portal, or{' '}
          <a href="/artisan-shop/soundlegend" className="portal-link">
            learn more about joining the SoundLegend Experience
          </a>
          .
        </p>
      </section>

      {/* CTA */}
      <div className="showroom-cta">
        <a href="/artisan-shop/soundlegend" className="cta-button">
          Start Your Custom Snare Journey
        </a>
      </div>
    </div>
  );
};

export default SoundLegendShowroom;
