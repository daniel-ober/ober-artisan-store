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
  const sectionsRef = useRef([]);

  const handleLogoLoad = () => setLogoLoaded(true);
  const handleHeroLoad = () => setHeroLoaded(true);

  // Fetch
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

  // ---- Build derived values with safe defaults (must be BEFORE any returns)
  const name = drumData?.name ?? 'Unknown Drum';
  const heroImage = drumData?.heroImage ?? null;
  const gallery = Array.isArray(drumData?.gallery) ? drumData.gallery : [];
  const story = drumData?.story ?? '';
  const filteredGallery = gallery
    .filter(Boolean)
    .filter((u) => u !== heroImage)
    .filter((u, i, arr) => arr.indexOf(u) === i);
  const slideCount = filteredGallery.length;

  // Keep modal index valid if data changes (always called)
  useEffect(() => {
    if (modalIndex !== null && slideCount > 0 && modalIndex >= slideCount) {
      setModalIndex(0);
    }
  }, [modalIndex, slideCount]);

  // Keyboard nav (always called)
  const handleKeyDown = useCallback(
    (e) => {
      if (modalIndex === null || slideCount === 0) return;
      if (e.key === 'Escape') setModalIndex(null);
      if (e.key === 'ArrowRight') setModalIndex((prev) => (prev + 1) % slideCount);
      if (e.key === 'ArrowLeft') setModalIndex((prev) => (prev - 1 + slideCount) % slideCount);
    },
    [modalIndex, slideCount]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Section fade-ins (always called)
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

  // ---- Now it’s safe to early-return UI (no hooks below this line)
  if (loading) return <div className="showroom-loading">Loading drum details...</div>;
  if (drumData?.notFound) return <div className="showroom-not-found">❌ Drum not found.</div>;

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

      {/* Hero */}
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
            draggable={false}
          />
        )}
      </div>

      {/* Gallery */}
      {slideCount > 0 && (
        <section
          className="showroom-gallery fade-in-section loading"
          ref={(el) => (sectionsRef.current[3] = el)}
        >
          <div className="gallery-grid">
            {filteredGallery.map((img, i) => (
              <img
                key={img}
                src={img}
                alt={`${name} - ${i + 1}`}
                onClick={() => setModalIndex(i)}
                className="gallery-thumb"
                draggable={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {modalIndex !== null && slideCount > 0 && (
        <div className="showroom-modal-overlay" onClick={() => setModalIndex(null)}>
          <div className="showroom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="showroom-modal-close" onClick={() => setModalIndex(null)}>✕</button>
            <button
              className="showroom-modal-prev"
              onClick={() => setModalIndex((modalIndex - 1 + slideCount) % slideCount)}
            >
              ‹
            </button>
            <img
              src={filteredGallery[modalIndex]}
              alt="Preview"
              className="showroom-modal-image"
              draggable={false}
            />
            <button
              className="showroom-modal-next"
              onClick={() => setModalIndex((modalIndex + 1) % slideCount)}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Story */}
      {story && (
        <section
          className="showroom-story elegant-font fade-in-section loading"
          ref={(el) => (sectionsRef.current[2] = el)}
        >
          <h1 className="artist-name">{name}</h1>
          <p className="legacy-subtitle">SoundLegend Legacy Artist ({serial.toUpperCase()})</p>
          <div
            className="showroom-story-content"
            dangerouslySetInnerHTML={{ __html: story }}
          />
        </section>
      )}

      {/* NFC Info */}
      <section
        className="showroom-legacy fade-in-section loading"
        ref={(el) => (sectionsRef.current[4] = el)}
      >
        <p>
          This SoundLegend drum is digitally authenticated and part of an exclusive artist series...
          <br /><br />
          <a href="/soundlegends/signin" className="portal-link">Sign in here</a>{' '}
          to access your portal, or{' '}
          <a href="/artisan-shop/soundlegend" className="portal-link">
            learn more about joining the SoundLegend Experience
          </a>.
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