import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import "./MockupLightbox.css";

/**
 * Full-screen image lightbox that OWNS the keyboard while open.
 * - Captures ArrowLeft/ArrowRight/Escape at document/window CAPTURE
 * - Prevents PageUp/Down/Space/Home/End/ArrowUp/ArrowDown from scrolling page
 * - Locks background scroll; hides app from AT; restores focus on close
 * - Adds data-lightbox-open="true" on <html> (CSS hook)
 */
export default function MockupLightbox({
  open,
  images = [],
  index = 0,
  onChange,
  onClose,
  appRootSelector = "#root",
}) {
  const containerRef = useRef(null);
  const lastActiveRef = useRef(null);

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;
  const goPrev = () => hasPrev && onChange(index - 1);
  const goNext = () => hasNext && onChange(index + 1);

  const focusables = useMemo(
    () => ["button", "[href]", '[tabindex]:not([tabindex="-1"])'].join(","),
    []
  );

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = document.activeElement;

    // Lock background scroll (html+body for iOS)
    const prevOverflowBody = document.body.style.overflow;
    const prevOverflowHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Hide & inert the app while modal is open
    const appRoot = document.querySelector(appRootSelector);
    const prevAriaHidden = appRoot?.getAttribute("aria-hidden");
    if (appRoot) {
      appRoot.setAttribute("aria-hidden", "true");
      appRoot.setAttribute("inert", "");
    }

    // CSS hook
    document.documentElement.setAttribute("data-lightbox-open", "true");

    // Focus the dialog root
    const node = containerRef.current;
    if (node && node.tabIndex < 0) node.tabIndex = -1;
    node?.focus?.({ preventScroll: true });

    // ——— keyboard handling (capture + global fallback) ———
    const kill = (e) => {
      // allow bare modifiers
      if (["Meta", "Alt", "Control", "Shift"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent?.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
    };

    const nav = (e) => {
      const k = e.key;

      // Trap Tab
      if (k === "Tab") {
        const els = node?.querySelectorAll(focusables);
        if (els && els.length) {
          const list = Array.from(els);
          const active = document.activeElement;
          const idx = list.indexOf(active);
          const next = e.shiftKey
            ? list[(idx > 0 ? idx : list.length) - 1]
            : list[(idx + 1) % list.length];
          kill(e);
          next?.focus?.();
        } else {
          kill(e);
          node?.focus?.();
        }
        return;
      }

      if (k === "ArrowLeft") { kill(e); return void goPrev(); }
      if (k === "ArrowRight") { kill(e); return void goNext(); }
      if (k === "Escape") { kill(e); return void onClose?.(); }

      // Block scrolling/shortcuts beneath
      if (
        k === " " || k === "PageUp" || k === "PageDown" ||
        k === "Home" || k === "End" || k === "ArrowUp" || k === "ArrowDown"
      ) kill(e);
    };

    document.addEventListener("keydown", nav, { capture: true });
    document.addEventListener("keyup", kill, { capture: true });
    window.addEventListener("keydown", nav, { capture: true });
    window.addEventListener("keyup", kill, { capture: true });

    // belt & suspenders: overwrite globals during open
    const prevDocOnDown = document.onkeydown;
    const prevDocOnUp = document.onkeyup;
    const prevWinOnDown = window.onkeydown;
    const prevWinOnUp = window.onkeyup;
    document.onkeydown = nav;
    document.onkeyup = kill;
    window.onkeydown = nav;
    window.onkeyup = kill;

    return () => {
      document.removeEventListener("keydown", nav, { capture: true });
      document.removeEventListener("keyup", kill, { capture: true });
      window.removeEventListener("keydown", nav, { capture: true });
      window.removeEventListener("keyup", kill, { capture: true });

      document.onkeydown = prevDocOnDown || null;
      document.onkeyup = prevDocOnUp || null;
      window.onkeydown = prevWinOnDown || null;
      window.onkeyup = prevWinOnUp || null;

      document.body.style.overflow = prevOverflowBody;
      document.documentElement.style.overflow = prevOverflowHtml;

      if (appRoot) {
        if (prevAriaHidden == null) appRoot.removeAttribute("aria-hidden");
        else appRoot.setAttribute("aria-hidden", prevAriaHidden);
        appRoot.removeAttribute("inert");
      }
      document.documentElement.removeAttribute("data-lightbox-open");
      lastActiveRef.current?.focus?.({ preventScroll: true });
    };
  }, [open, index, onChange, onClose, appRootSelector, focusables, hasPrev, hasNext]);

  if (!open) return null;

  const ui = (
    <div
      ref={containerRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Mockup viewer"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <button className="lb-close" aria-label="Close" onClick={onClose}>×</button>
      {hasPrev && (<button className="lb-prev" aria-label="Previous image" onClick={goPrev}>‹</button>)}
      <img src={images[index]} alt={`Mockup ${index + 1}`} draggable={false} />
      {hasNext && (<button className="lb-next" aria-label="Next image" onClick={goNext}>›</button>)}
    </div>
  );

  return createPortal(ui, document.body);
}