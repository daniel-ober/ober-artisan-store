import React from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './LegacyVaultHome.css';

/* ---------- Minimal inline 360 viewer (pointer + autoplay) ---------- */
function InlineFrame360({
  totalFrames = 392,
  basePath = '/soundlegend360/med',
  prefix = 'frame_',
  pad = 3,
  ext = 'webp',
  fps = 30,
  dragSensitivity = 0.22,
}) {
  const [loaded, setLoaded] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [frame, setFrame] = React.useState(0);

  const imgsRef = React.useRef([]);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(0);

  // dragging state
  const draggingRef = React.useRef(false);
  const lastXRef = React.useRef(0);
  const carryRef = React.useRef(0);

  const urlFor = React.useCallback((i) => {
    const n = String(i + 1).padStart(pad, '0');
    return `${basePath}/${prefix}${n}.${ext}`;
  }, [basePath, prefix, pad, ext]);

  // Preload frames (errors still advance the counter)
  React.useEffect(() => {
    let cancelled = false;
    imgsRef.current = Array.from({ length: totalFrames }, (_, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.crossOrigin = 'anonymous';
      const src = urlFor(i);
      img.src = src;
      const done = () => { if (!cancelled) setLoaded(v => v + 1); };
      img.onload = done; img.onerror = done; img.onabort = done;
      return img;
    });
    return () => { cancelled = true; imgsRef.current = []; };
  }, [totalFrames, urlFor]);

  // Autoplay
  React.useEffect(() => {
    const tick = (ts) => {
      if (!isPlaying) return;
      const ft = 1000 / fps;
      const delta = ts - (lastTsRef.current || ts);
      if (delta >= ft) {
        lastTsRef.current = ts;
        setFrame(f => (f + 1) % totalFrames);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (isPlaying && loaded > 0) {
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, fps, loaded, totalFrames]);

  // Pointer (mouse + touch)
  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    carryRef.current = 0;
    setIsPlaying(false);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;

    const delta = -dx * dragSensitivity + carryRef.current;
    const step = delta | 0;
    carryRef.current = delta - step;

    if (step) {
      setFrame(f => {
        let nf = (f + step) % totalFrames;
        if (nf < 0) nf += totalFrames;
        return nf;
      });
    }
  };
  const onPointerUp = (e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const pct = Math.round((loaded / totalFrames) * 100);
  const src = imgsRef.current[frame]?.src || urlFor(0);

  return (
    <div
      className="sl360-stage lv-hero-360"
      role="img"
      aria-label="360 degree product viewer"
      tabIndex={0}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={src} alt="SoundLegend 360 preview" draggable={false} />
      {loaded < totalFrames && (
        <div className="sl360-loader">
          <div className="sl360-bar"><div style={{ width: `${pct}%` }} /></div>
          <span>Loading {pct}%</span>
        </div>
      )}
      <div className="sl360-controls">
        <span className="sl360-hint">Drag to rotate</span>
      </div>
    </div>
  );
}
/* ------------------------------------------------------------------ */

/* ---------- Card for a Vault item ---------- */
function VaultCard({ serial, name, heroImage, finish, href }) {
  const fallback = '/placeholder/snare-dark.jpg'; // put a subtle local fallback image if you want
  return (
    <Link to={href} className="lv-item">
      <div className="lv-item-media">
        <img src={heroImage || fallback} alt={`${serial} – ${name || 'SoundLegend'}`} loading="lazy" />
      </div>
      <div className="lv-item-body">
        <div className="lv-item-top">
          <span className="lv-item-serial">{serial}</span>
          {name && <h3 className="lv-item-name">{name}</h3>}
        </div>
        {finish && <div className="lv-item-meta">{finish}</div>}
        <div className="lv-item-cta">View Page →</div>
      </div>
    </Link>
  );
}

/* ---------- Page ---------- */
export default function LegacyVaultHome() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'soundlegend_showroom'));
        const rows = [];
        snap.forEach(doc => {
          const d = doc.data() || {};
          // fields per your screenshot
          const serial = doc.id;
          const heroImage = d.heroImage || d.gallery?.[0] || '';
          const name = d.name || d.links?.name || '';
          const finish = d.specs?.finish || '';
          rows.push({
            serial,
            heroImage,
            name,
            finish,
            href: `/artisan-shop/soundlegend/${serial}`,
          });
        });
        // stable sort by serial number if desired:
        rows.sort((a,b) => a.serial.localeCompare(b.serial, undefined, { numeric: true }));
        setItems(rows);
      } catch (e) {
        console.error('Failed to load vault items:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="legacy-vault-home">
      {/* Logo */}
      <section className="lv-header">
        <img
          className="lv-logo center"
          src="/logos/legacyvault.d.png"
          alt="SoundLegend Legacy Vault"
          loading="eager"
        />
      </section>

      {/* Big 360 */}
      <section className="lv-hero-one">
        <div className="lv-hero-one-inner">
          <InlineFrame360 totalFrames={392} basePath="/soundlegend360/med" />
        </div>
      </section>

      {/* Welcome block (consolidated paragraphs) */}
      <section className="lv-welcome">
        <h2>Welcome to the Legacy Vault</h2>
        <p className="lv-welcome-lead">
          A living archive of artists and the drums that carry their stories.
        </p>

        <div className="lv-welcome-grid">
          <p>
            <strong>What it is —</strong> Each page documents a real SoundLegend instrument:
            specs, build story, photos, and audio across Legacy Tuning™ ranges.
          </p>
          <p>
            <strong>Why it exists —</strong> To preserve your voice. The Vault connects
            the player, their instrument, and the music with honest documentation.
          </p>
          <p>
            <strong>How to use it —</strong> Explore artists and hear each drum’s low → high
            character. Compare builds and learn what choices shape the sound.
          </p>
        </div>

        <div className="lv-cta-row center">
          <Link to="/artisan-shop/soundlegend/vault/learn/legacy-tuning" className="lv-cta-btn ghost">
            What is Legacy Tuning?
          </Link>
        </div>
      </section>

      {/* Legacy Index (cards from Firestore) */}
      <section className="lv-index">
        <div className="lv-index-head">
          <h2>Legacy Index</h2>
          <p className="muted">Tap any instrument to open its page.</p>
        </div>

        {loading ? (
          <div className="lv-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="lv-item skeleton">
                <div className="lv-item-media" />
                <div className="lv-item-body">
                  <div className="line w60" />
                  <div className="line w40" />
                  <div className="btnline" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lv-grid">
            {items.map(it => (
              <VaultCard key={it.serial} {...it} />
            ))}
          </div>
        )}
      </section>

      {/* How to Join */}
      <section className="lv-join">
        <h2>How to Join the SoundLegend Experience</h2>
        <ol className="lv-steps">
          <li className="lv-step">
            <span className="lv-step-num">1</span>
            <div><strong>Start a Conversation</strong><br/>A short consult to learn your story, hands, genre, and goals.</div>
          </li>
          <li className="lv-step">
            <span className="lv-step-num">2</span>
            <div><strong>Design Your Voice</strong><br/>We dial in shell method, species, size/depth, hardware, and Legacy Tuning™ targets.</div>
          </li>
          <li className="lv-step">
            <span className="lv-step-num">3</span>
            <div><strong>Craft & Document</strong><br/>Your build is handcrafted and documented with photos, audio, and notes.</div>
          </li>
          <li className="lv-step">
            <span className="lv-step-num">4</span>
            <div><strong>Tap to Remember Me</strong><br/>Your drum ships with an NFC-enabled badge linking to its page in this Vault.</div>
          </li>
        </ol>

        <div className="lv-cta-row center">
          <Link to="/artisan-shop/soundlegend/soundlegend-form" className="lv-cta-btn primary">
            Start Your Build
          </Link>
          <Link to="/soundlegend-portal" className="lv-cta-btn ghost">
            SoundLegend Portal
          </Link>
        </div>
      </section>
    </main>
  );
}