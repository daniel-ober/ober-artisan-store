import React, { useEffect, useMemo, useRef, useState } from 'react';
import './MerchCarousel.css';

/**
 * Center-locked, infinite carousel
 * - Keeps highlight fixed in the center
 * - Triples data and always moves to the *nearest* copy of the target
 *   so the motion direction is preserved at the ends
 * - After each move, silently normalizes back to the middle copy
 */
export default function MerchCarousel({
  items = [],
  activeId,
  onSelect,
  ring = true,
}) {
  const viewportRef = useRef(null);

  const FALLBACK_IMG =
    'https://www.oberartisandrums.com/fallback-images/fallback_image1.png';

  // Read CSS vars + live width so math stays aligned with styles
  const [sizes, setSizes] = useState({ card: 132, gap: 12, vw: 800, nudge: 0 });

  useEffect(() => {
    const readVars = () => {
      const root = getComputedStyle(document.documentElement);
      const card = parseFloat(root.getPropertyValue('--mc-card')) || 132;
      const gap = parseFloat(root.getPropertyValue('--mc-gap')) || 12;
      const nudge = parseFloat(root.getPropertyValue('--mc-center-nudge')) || 0;
      const vw = viewportRef.current?.clientWidth || window.innerWidth || 800;
      setSizes({ card, gap, vw, nudge });
    };

    readVars();
    const ro = new ResizeObserver(readVars);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener('resize', readVars);
    return () => {
      ro.disconnect?.();
      window.removeEventListener('resize', readVars);
    };
  }, []);

  const step = sizes.card + sizes.gap;
  const centerPx = Math.round(sizes.vw / 2);

  // Tripled data for seamless wrap
  const N = items.length;
  const middleStart = N;
  const tripled = useMemo(() => (N ? [...items, ...items, ...items] : []), [items, N]);

  // Cursor over 0..(3N-1)
  const initialBaseIdx = Math.max(0, items.findIndex((i) => i.id === activeId));
  const [cursor, setCursor] = useState(middleStart + initialBaseIdx);
  const [withTransition, setWithTransition] = useState(true);

  // Choose the nearest occurrence of a base index (0..N-1)
  const nearestCursorForBase = (baseIdx, fromCursor) => {
    const choices = [baseIdx, baseIdx + N, baseIdx + 2 * N];
    let best = choices[0];
    let bestDist = Math.abs(best - fromCursor);
    for (let i = 1; i < choices.length; i++) {
      const d = Math.abs(choices[i] - fromCursor);
      if (d < bestDist) {
        best = choices[i];
        bestDist = d;
      }
    }
    return best;
  };

  // When parent changes activeId, animate to the nearest copy
  useEffect(() => {
    if (!N) return;
    const baseIdx = Math.max(0, items.findIndex((i) => i.id === activeId));
    const dest = nearestCursorForBase(baseIdx, cursor);
    setWithTransition(true);
    setCursor(dest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, N]); // intentionally not depending on `items` or `cursor` reactivity here

  // Translate so cursor's *center* is at viewport center (plus tiny nudge)
  const translatePx = Math.round(cursor * step + sizes.card / 2 - centerPx + sizes.nudge);

  // After each transition, silently normalize back into the middle copy
  const handleTransitionEnd = () => {
    if (!N) return;
    const idxInBase = ((cursor % N) + N) % N; // 0..N-1
    const ideal = middleStart + idxInBase; // middle copy position
    if (cursor !== ideal) {
      setWithTransition(false);
      requestAnimationFrame(() => {
        setCursor(ideal);
        requestAnimationFrame(() => setWithTransition(true));
      });
    }
  };

  // Public moves
  const setActiveByCursor = (nextCursor) => {
    if (!N) return;
    const baseIndex = ((nextCursor % N) + N) % N;
    const id = items[baseIndex]?.id;
    setCursor(nextCursor);
    if (id && onSelect) onSelect(id);
  };

  const goPrev = () => setActiveByCursor(cursor - 1);
  const goNext = () => setActiveByCursor(cursor + 1);

  // Clicking any card: move to the nearest copy of that card
  const onCardClick = (tripledIndex) => {
    if (!N) return;
    const baseIndex = ((tripledIndex % N) + N) % N;
    const dest = nearestCursorForBase(baseIndex, cursor);
    setActiveByCursor(dest);
  };

  // Image error handler (prevents infinite loops)
  const handleImgError = (e) => {
    const img = e.currentTarget;
    // If we've already fallen back once, don’t loop forever.
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = FALLBACK_IMG;
  };

  return (
    <div className="merch-carousel">
      <button className="mc-nav" onClick={goPrev} aria-label="Previous">
        ‹
      </button>

      <div className="mc-viewport" ref={viewportRef}>
        {ring && <div className="mc-centerHighlight" aria-hidden />}
        <div
          className="mc-track"
          style={{
            transform: `translateX(${-translatePx}px)`,
            transition: withTransition ? 'transform 320ms ease' : 'none',
            gap: `var(--mc-gap)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {tripled.map((it, i) => {
            const baseIndex = ((i % N) + N) % N;
            const isHighlight = items[baseIndex]?.id === activeId;

            // If previewImage is missing/empty, start with fallback immediately.
            const src = (it?.previewImage && String(it.previewImage).trim()) ? it.previewImage : FALLBACK_IMG;

            return (
              <div
                className={`mc-card${isHighlight ? ' highlight' : ''}`}
                key={`${it.id}-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => onCardClick(i)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCardClick(i)}
                aria-label={it.title}
                aria-selected={isHighlight ? 'true' : 'false'}
              >
                <div className="mc-thumb">
                  <img
                    src={src}
                    alt={it.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={handleImgError}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="mc-nav" onClick={goNext} aria-label="Next">
        ›
      </button>
    </div>
  );
}