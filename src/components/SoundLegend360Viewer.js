// src/components/SoundLegend360Viewer.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";

function useInView(ref, rootMargin = "100px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { root: null, rootMargin, threshold: 0.01 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const SoundLegend360Viewer = forwardRef(function SoundLegend360Viewer(
  {
    frameCount,
    srcPattern,
    indexStart = 0,
    zeroPad = 0,
    className = "",
    width,
    height,
    autoRotate = true,
    autoRotateRps = 0.25,
    dragSensitivity = 4,
    initialFrame = 0,
    hiDPIPattern,
    showLoadingRing = true,
    onFrameChange,
  },
  ref
) {
  // Resolve URLs
  const resolve = useCallback(
    (idx, pattern = srcPattern) => {
      const n = idx + indexStart;
      const padded = zeroPad > 0 ? String(n).padStart(zeroPad, "0") : String(n);
      if (typeof pattern === "function") return pattern(padded);
      return pattern.replace("{index}", padded);
    },
    [indexStart, zeroPad, srcPattern]
  );

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isPointerDown = useRef(false);
  const lastX = useRef(0);

  const [frame, setFrame] = useState(clamp(initialFrame, 0, frameCount - 1));
  const [loaded, setLoaded] = useState(() => new Array(frameCount).fill(false));
  const [images, setImages] = useState(() => new Array(frameCount).fill(null));

  // Optional hires/2x layer
  const [loaded2x, setLoaded2x] = useState(() => new Array(frameCount).fill(false));
  const [images2x, setImages2x] = useState(() => new Array(frameCount).fill(null));

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isInView, setIsInView] = useState(false);

  // External control state
  const [autoOn, setAutoOn] = useState(!!autoRotate);
  const [rps, setRps] = useState(autoRotateRps);

  useEffect(() => setAutoOn(!!autoRotate), [autoRotate]);
  useEffect(() => setRps(autoRotateRps), [autoRotateRps]);

  const inView = useInView(containerRef, "200px");
  useEffect(() => setIsInView(inView), [inView]);

  // Progressive loader
  useEffect(() => {
    if (!isInView) return;

    let cancelled = false;

    const coarseStep = frameCount >= 120 ? 6 : frameCount >= 72 ? 4 : 2;
    const order = [];
    for (let i = 0; i < frameCount; i += coarseStep) order.push(i);
    const remaining = [];
    for (let i = 0; i < frameCount; i++) if (!order.includes(i)) remaining.push(i);
    remaining.sort((a, b) => Math.abs(a - frame) - Math.abs(b - frame));
    order.push(...remaining);

    let completed = 0;

    const load1x = (idx) =>
      new Promise((done) => {
        if (cancelled || loaded[idx]) return done();
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = resolve(idx);
        img.onload = () => {
          if (cancelled) return done();
          setImages((prev) => {
            const next = prev.slice();
            next[idx] = img;
            return next;
          });
          setLoaded((prev) => {
            const next = prev.slice();
            if (!next[idx]) {
              next[idx] = true;
              completed += 1;
              setLoadingProgress(Math.round((completed / frameCount) * 100));
            }
            return next;
          });
          done();
        };
        img.onerror = () => done();
      });

    const load2x = (idx) =>
      new Promise((done) => {
        if (cancelled || !hiDPIPattern || loaded2x[idx]) return done();
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = resolve(idx, hiDPIPattern);
        img.onload = () => {
          if (cancelled) return done();
          setImages2x((prev) => {
            const next = prev.slice();
            next[idx] = img;
            return next;
          });
          setLoaded2x((prev) => {
            const next = prev.slice();
            next[idx] = true;
            return next;
          });
          done();
        };
        img.onerror = () => done();
      });

    const queue = async () => {
      for (const idx of order) {
        if (cancelled) break;
        await load1x(idx);
        await new Promise((r) => setTimeout(r, 0));
      }

      if (hiDPIPattern && (window.devicePixelRatio > 1 || zoom > 1)) {
        for (const idx of order) {
          if (cancelled) break;
          await load2x(idx);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    };

    queue();
    return () => {
      cancelled = true;
    };
  }, [isInView, frameCount, frame, resolve, hiDPIPattern, zoom, loaded, loaded2x]);

  // Helper: get best image for an index (fallback to nearest loaded so we never "stall")
  const getBestImageFor = useCallback(
    (idx) => {
      const hi = images2x[idx];
      const base = images[idx];
      const chosen = (zoom > 1 && hi) || base;
      if (chosen) return chosen;

      // search nearby (up to ±12 frames) for the closest loaded frame
      const maxOffset = Math.min(12, Math.floor(frameCount / 8));
      for (let k = 1; k <= maxOffset; k++) {
        const a = (idx + k) % frameCount;
        const b = (idx - k + frameCount) % frameCount;
        const ca = (zoom > 1 && images2x[a]) || images[a];
        if (ca) return ca;
        const cb = (zoom > 1 && images2x[b]) || images[b];
        if (cb) return cb;
      }
      return null;
    },
    [images, images2x, zoom, frameCount]
  );

  // Draw
  const draw = useCallback(
    (idx) => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const img = getBestImageFor(idx);
      if (!img) return;

      const ctx = cvs.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;
      const needW = Math.round(w * dpr);
      const needH = Math.round(h * dpr);
      if (cvs.width !== needW || cvs.height !== needH) {
        cvs.width = needW;
        cvs.height = needH;
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      const scale = Math.min(w / img.width, h / img.height) * zoom;
      const iw = img.width * scale;
      const ih = img.height * scale;
      const x = (w - iw) / 2;
      const y = (h - ih) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, x, y, iw, ih);
      ctx.restore();
    },
    [getBestImageFor, zoom]
  );

  useEffect(() => {
    draw(frame);
    onFrameChange && onFrameChange(frame);
  }, [frame, draw, onFrameChange]);

  // ✅ Smooth auto-rotate: fixed tick + fractional accumulator
  // Works great for very slow speeds (no "burst" frames), and handles fast too.
  useEffect(() => {
    if (!autoOn || !isInView) return;

    // “Ready” threshold: wait until we have a decent ring to avoid early stutter
    const loadedCount = loaded.reduce((n, v) => n + (v ? 1 : 0), 0);
    const ready = loadedCount >= Math.min(60, frameCount);
    if (!ready) return;

    const desiredFps = rps * frameCount; // frames per second we want
    const tickHz = 60;                   // run a steady 60Hz timer
    const intervalMs = 1000 / tickHz;
    let acc = 0;                         // fractional frames accumulator
    let id = 0;

    const tick = () => {
      acc += desiredFps / tickHz;        // how many frames should pass this tick
      let steps = Math.floor(acc);
      if (steps > 0) {
        acc -= steps;
        // if desired fps exceeds 60, 'steps' will be 2+ sometimes — smooth & even
        setFrame((f) => (f + steps) % frameCount);
      }
    };

    id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [autoOn, isInView, rps, frameCount, loaded]);

  // Stop auto-rotate on user interaction
  const stopAuto = () => {
    setAutoOn(false);
  };

  // Pointer handlers
  const onPointerDown = (e) => {
    stopAuto();
    isPointerDown.current = true;
    lastX.current = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
  };
  const onPointerMove = (e) => {
    if (!isPointerDown.current) return;
    const x = e.clientX || (e.touches && e.touches[0]?.clientX) || lastX.current;
    const dx = x - lastX.current;
    lastX.current = x;
    const deltaFrames = Math.round(dx / dragSensitivity);
    if (deltaFrames) {
      setFrame((f) => (f - deltaFrames + frameCount) % frameCount);
    }
  };
  const onPointerUp = () => {
    isPointerDown.current = false;
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        stopAuto();
        setFrame((f) => (f + 1) % frameCount);
      } else if (e.key === "ArrowRight") {
        stopAuto();
        setFrame((f) => (f - 1 + frameCount) % frameCount);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frameCount]);

  // Zoom controls
  const onWheel = (e) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return;
    stopAuto();
    const next = clamp(zoom + (e.deltaY > 0 ? -0.1 : 0.1), 1, 3);
    setZoom(next);
  };
  const onDouble = () => {
    stopAuto();
    setZoom((z) => (z === 1 ? 2 : 1));
  };

  // Redraw on container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw(frame));
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw, frame]);

  const style = useMemo(
    () => ({
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
    }),
    [width, height]
  );

  const anyLoaded = loaded.some(Boolean);

  // Expose control methods
  useImperativeHandle(ref, () => ({
    play() {
      setAutoOn(true);
    },
    pause() {
      setAutoOn(false);
    },
    setSpeed(value) {
      setRps(Math.max(0, Number(value) || 0));
    },
    next() {
      setFrame((f) => (f + 1) % frameCount);
    },
    prev() {
      setFrame((f) => (f - 1 + frameCount) % frameCount);
    },
    setFrameIndex(i) {
      const n = ((i % frameCount) + frameCount) % frameCount;
      setFrame(n);
    },
    resetZoom() {
      setZoom(1);
    },
    zoomIn(step = 0.2) {
      setZoom((z) => clamp(z + step, 1, 3));
    },
    zoomOut(step = 0.2) {
      setZoom((z) => clamp(z - step, 1, 3));
    },
    getFrame() {
      return frame;
    },
  }));

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={style}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={onDouble}
      role="img"
      aria-label="Interactive 360 degree view of the snare drum"
    >
      <canvas ref={canvasRef} className="w-full h-full block rounded-2xl bg-black/70" />

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-2 text-white/80">
        <div className="rounded-full bg-black/40 backdrop-blur px-3 py-1 text-xs leading-none">
        </div>
      </div>

      {showLoadingRing && !anyLoaded && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
            <div
              className="absolute inset-0 rounded-full border-2 border-white"
              style={{
                clipPath:
                  "polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)",
                transform: `rotate(${(loadingProgress / 100) * 360}deg)`,
                transition: "transform 0.2s linear",
              }}
            />
            <div className="absolute inset-0 grid place-items-center text-white text-xs">
              {loadingProgress}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SoundLegend360Viewer;