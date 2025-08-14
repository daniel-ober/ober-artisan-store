import React, {
  useRef, useEffect, useImperativeHandle, useState, forwardRef, useCallback,
} from 'react';

const MAX_CONCURRENT = 8;
const CACHE_RADIUS_FRAMES = 48;
const EVICT_MARGIN = 12;
const SEAM_GUARD = 8;         // if we're within ±8 frames of seam, prewarm other side
const MISSING = Symbol('missing');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const SoundLegend360Viewer = forwardRef(function Viewer(props, ref) {
  const {
    frameCount,
    indexStart = 1,
    zeroPad = 3,
    srcPattern,                 // expects a 3-digit string like "001" -> returns full URL
    className,
    style,
    autoRotate = false,         // keep available, but we'll pass false from the page
    autoRotateRps = 0,
    dragSensitivity = 3,        // viewer-internal scale (frames per pixel ~ sensitivity*0.4)
    onPointerDown,
    onPointerUp,
  } = props;

  // Canvas
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Playback
  const [playing, setPlaying] = useState(!!autoRotate);
  const rpsRef = useRef(Math.max(0, Number(autoRotateRps) || 0));
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);

  // Index
  const idxRef = useRef(0);                   // float 0..f
  const lastDrawnIdxRef = useRef(null);       // int

  // Caching
  const cacheRef = useRef(new Map());         // int -> ImageBitmap | MISSING
  const inflightRef = useRef(new Set());      // int
  const queueRef = useRef([]);                // ints waiting to fetch
  const abortsRef = useRef(new Map());        // int -> AbortController

  // Drag
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  const wrap = (n) => {
    const f = frameCount;
    return ((n % f) + f) % f;
  };
  const to1Based = (zeroBased) => zeroBased + indexStart;
  const formatUrl = (zeroBased) => {
    const s = String(to1Based(zeroBased)).padStart(zeroPad, '0');
    return srcPattern(s);
  };

  // ---- draw
  const draw = useCallback((intIdx) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const entry = cacheRef.current.get(intIdx);
    const bmp = entry && entry !== MISSING ? entry : null;

    // Fallback to last good
    const fallback =
      bmp ??
      (lastDrawnIdxRef.current != null
        ? cacheRef.current.get(lastDrawnIdxRef.current)
        : null);

    if (!fallback || fallback === MISSING) return; // keep last pixels

    const useBmp = bmp || fallback;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = useBmp.width;
    const ih = useBmp.height;
    const scale = Math.min(cw / iw, ch / ih);
    const w = Math.round(iw * scale);
    const h = Math.round(ih * scale);
    const x = Math.floor((cw - w) / 2);
    const y = Math.floor((ch - h) / 2);

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(useBmp, x, y, w, h);

    if (bmp) lastDrawnIdxRef.current = intIdx;
  }, []);

  // ---- fetch + decode
  const ensureFrame = useCallback(async (intIdx) => {
    const i = wrap(intIdx);
    if (cacheRef.current.has(i) || inflightRef.current.has(i)) return;

    inflightRef.current.add(i);
    const url = formatUrl(i);
    const ctrl = new AbortController();
    abortsRef.current.set(i, ctrl);

    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      cacheRef.current.set(i, bmp);

      // If this is the one we want now, paint it immediately
      const want = wrap(Math.floor(idxRef.current));
      if (want === i || lastDrawnIdxRef.current == null) draw(i);
    } catch {
      // Mark as missing so we don't hammer it
      cacheRef.current.set(i, MISSING);
    } finally {
      abortsRef.current.delete(i);
      inflightRef.current.delete(i);
    }
  }, [draw]);

  const pumpQueue = useCallback(() => {
    const running = inflightRef.current.size;
    const room = Math.max(0, MAX_CONCURRENT - running);
    if (room === 0) return;

    let started = 0;
    while (started < room && queueRef.current.length) {
      const next = queueRef.current.shift();
      if (next == null) break;
      if (cacheRef.current.has(next) || inflightRef.current.has(next)) continue;
      ensureFrame(next);
      started++;
    }
  }, [ensureFrame]);

  const scheduleWindow = useCallback((centerIdx) => {
    // Evict far frames (keep seam neighbors)
    for (const key of cacheRef.current.keys()) {
      const dist = Math.min(
        Math.abs(key - centerIdx),
        frameCount - Math.abs(key - centerIdx)
      );
      if (dist > CACHE_RADIUS_FRAMES + EVICT_MARGIN) {
        const v = cacheRef.current.get(key);
        cacheRef.current.delete(key);
        if (v && v !== MISSING) { try { v.close?.(); } catch {} }
      }
    }

    // Request nearest-first
    const want = [];
    for (let r = 0; r <= CACHE_RADIUS_FRAMES; r++) {
      const a = wrap(centerIdx + r);
      const b = wrap(centerIdx - r);
      if (!cacheRef.current.has(a)) want.push(a);
      if (r !== 0 && !cacheRef.current.has(b)) want.push(b);
    }

    // Seam guard
    if (centerIdx <= SEAM_GUARD) {
      for (let k = frameCount - SEAM_GUARD; k < frameCount; k++) {
        if (!cacheRef.current.has(k)) want.unshift(k);
      }
    } else if (centerIdx >= frameCount - 1 - SEAM_GUARD) {
      for (let k = 0; k < SEAM_GUARD; k++) {
        if (!cacheRef.current.has(k)) want.unshift(k);
      }
    }

    // Unique queue
    const set = new Set(queueRef.current);
    for (const k of want) set.add(k);
    queueRef.current = Array.from(set);

    pumpQueue();
  }, [frameCount, pumpQueue]);

  // ---- advance + render loop
  const tick = useCallback((ts) => {
    const last = lastTsRef.current || ts;
    lastTsRef.current = ts;

    if (playing && rpsRef.current > 0) {
      const dt = (ts - last) / 1000;
      const framesPerSecond = rpsRef.current * frameCount;
      idxRef.current += framesPerSecond * dt;
    }

    // Resolve target int index; if missing, walk to nearest valid
    let intIdx = wrap(Math.floor(idxRef.current));
    let guard = 0;
    while (cacheRef.current.get(intIdx) === MISSING && guard < frameCount) {
      intIdx = wrap(intIdx + 1); // skip hole
      guard++;
    }

    draw(intIdx);
    scheduleWindow(intIdx);

    rafRef.current = requestAnimationFrame(tick);
  }, [draw, scheduleWindow, frameCount, playing]);

  // ---- init
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const now = wrap(Math.floor(idxRef.current));
      draw(now);
    };
    resize();

    // Prewarm both ends to make the seam invisible
    idxRef.current = 0;
    ensureFrame(0);
    ensureFrame(frameCount - 1);
    scheduleWindow(0);

    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      for (const [, ctrl] of abortsRef.current) ctrl.abort();
      abortsRef.current.clear();
      for (const v of cacheRef.current.values()) {
        if (v && v !== MISSING) { try { v.close?.(); } catch {} }
      }
      cacheRef.current.clear();
    };
  }, [draw, ensureFrame, scheduleWindow, tick, frameCount]);

  // external prop updates
  useEffect(() => { setPlaying(!!autoRotate); }, [autoRotate]);
  useEffect(() => { rpsRef.current = Math.max(0, Number(autoRotateRps) || 0); }, [autoRotateRps]);

  // ---- drag (pointer)
  const setPointerCaptureSafe = (el, e) => { try { el.setPointerCapture?.(e.pointerId); } catch {} };
  const releasePointerCaptureSafe = (el, e) => { try { el.releasePointerCapture?.(e.pointerId); } catch {} };

  const onDown = (e) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    setPointerCaptureSafe(e.currentTarget, e);
    onPointerDown && onPointerDown(e);
  };

  const onMove = (e) => {
    if (!draggingRef.current) return;
    const x = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    const dx = x - lastXRef.current;
    lastXRef.current = x;

    const framesPerPixel = dragSensitivity * 0.4;
    idxRef.current -= dx * framesPerPixel;

    // draw immediately; if target is missing, nearest neighbor will be shown
    let intIdx = wrap(Math.floor(idxRef.current));
    let guard = 0;
    while (cacheRef.current.get(intIdx) === MISSING && guard < frameCount) {
      intIdx = wrap(intIdx + (dx > 0 ? -1 : 1)); // search opposite to drag direction
      guard++;
    }
    draw(intIdx);
    scheduleWindow(intIdx);
  };

  const onUp = (e) => {
    draggingRef.current = false;
    releasePointerCaptureSafe(e.currentTarget, e);
    onPointerUp && onPointerUp(e);
  };

  // ---- API
  useImperativeHandle(ref, () => ({
    play() { setPlaying(true); },
    pause() { setPlaying(false); },
    setSpeed(rps) { rpsRef.current = Math.max(0, Number(rps) || 0); },
    step(n = 1) { idxRef.current += n; },
    nudge(n = 1) { idxRef.current += n; },
    prev() { idxRef.current -= 1; },
    next() { idxRef.current += 1; },
  }));

  return (
    <div
      className={className}
      style={{ ...style, userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
      role="img"
      aria-label="360 degree product viewer"
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
});

export default SoundLegend360Viewer;