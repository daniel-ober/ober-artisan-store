import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './SoundLegendShowroom.css';

const SoundLegendShowroom = () => {
  const { serial } = useParams();
  const [drumData, setDrumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalIndex, setModalIndex] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const sectionsRef = useRef([]); // ✅ track sections for fade-in animation

  const handleLogoLoad = () => setLogoLoaded(true);
  const handleHeroLoad = () => setHeroLoaded(true);

  // ✅ Fetch drum data
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

  // ✅ Keyboard navigation for modal
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

  // ✅ Intersection Observer for Fade-In with "loading" → "is-visible" transition
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('loading');
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );

    sectionsRef.current.forEach((el) => el && observer.observe(el));

    // ✅ Fallback: if observer fails, make all visible after 2s
    const fallbackTimer = setTimeout(() => {
      sectionsRef.current.forEach((el) => {
        el?.classList.remove('loading');
        el?.classList.add('is-visible');
      });
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

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
        src="/logos/sl-vault-white.png"
        alt="SoundLegend Series"
        className={`showroom-logo fade-in-section ${logoLoaded ? 'is-visible' : 'loading'}`}
        onLoad={handleLogoLoad}
        ref={(el) => (sectionsRef.current[0] = el)}
      />

      {/* Hero Section */}
      <div
        className={`showroom-hero fade-in-section ${heroLoaded ? 'is-visible' : 'loading'}`}
        ref={(el) => (sectionsRef.current[1] = el)}
      >
        {heroImage && (
          <img
            src={heroImage}
            alt={name}
            className="showroom-hero-image"
            onLoad={handleHeroLoad}
          />
        )}
      </div>

      {/* Story Section */}
      {story && (
<section
  className="showroom-story elegant-font fade-in-section loading"
  ref={(el) => (sectionsRef.current[2] = el)}
>
  <h1 className="artist-name">{name}</h1>
  <p className="legacy-subtitle">SoundLegend Legacy Artist ({serial.toUpperCase()})</p>
  
  <div
    className="showroom-story-content"
    dangerouslySetInnerHTML={{ __html: drumData.story }}
  ></div>
</section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section
          className="showroom-gallery fade-in-section loading"
          ref={(el) => (sectionsRef.current[3] = el)}
        >
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
      <section
        className="showroom-legacy fade-in-section loading"
        ref={(el) => (sectionsRef.current[4] = el)}
      >
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
          to access your portal, or 
          {' '}
          <a href="/artisan-shop/soundlegend" className="portal-link">
             learn more about joining the SoundLegend Experience
          </a>
          .
        </p>
      </section>

      {/* CTA */}
      <div
        className="showroom-cta fade-in-section loading"
        ref={(el) => (sectionsRef.current[5] = el)}
      >
        <a href="/artisan-shop/soundlegend" className="cta-button">
          Start Your Custom Snare Journey
        </a>
      </div>
    </div>
  );
};

export default SoundLegendShowroom;
