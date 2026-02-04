// src/utils/loadRecaptchaEnterprise.js
// Single-flight, Safari-safe reCAPTCHA Enterprise loader.
// Coexists with classic api.js if another library injects it (e.g., Firebase Phone Auth).
//
// Usage:
//   import { getRecaptchaToken } from '../utils/loadRecaptchaEnterprise';
//   const token = await getRecaptchaToken(SITE_KEY, 'endorsement_form');
//
// Notes:
// - In development, returns a deterministic mock token to avoid flaky local behavior.
// - In production, injects enterprise.js once (by id) and then waits for grecaptcha.ready()
//   (Safari can be racy even after onload fires).
// - If classic v3 is already present, we reuse it (and will prefer enterprise namespace if available).

let loaderPromise = null;

const SCRIPT_ID_ENTERPRISE = 'grecaptcha-enterprise-script';
const SCRIPT_ID_CLASSIC = 'grecaptcha-classic-script'; // optional fallback if you ever need it

function getGrecaptcha() {
  // Prefer enterprise namespace if present; fallback to classic.
  return window.grecaptcha?.enterprise ?? window.grecaptcha ?? null;
}

function waitForGrecaptchaReady(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const gre = getGrecaptcha();
      if (gre && typeof gre.ready === 'function') {
        try {
          gre.ready(() => resolve(getGrecaptcha()));
          return;
        } catch (_) {
          // Safari can throw if called during a weird init window; keep retrying.
        }
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('Timed out waiting for grecaptcha.ready()'));
        return;
      }

      setTimeout(check, 120);
    }

    check();
  });
}

function injectScriptOnce({ id, src }) {
  return new Promise((resolve, reject) => {
    try {
      // If script tag exists, we won't add a new one.
      const existing = document.getElementById(id);
      if (existing) {
        // If the script is already loaded, resolve immediately; otherwise, wait for load/error.
        if (existing.getAttribute('data-loaded') === 'true') return resolve();
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error(`Failed to load script: ${src}`)),
          { once: true }
        );
        return;
      }

      const s = document.createElement('script');
      s.id = id;
      s.async = true;
      s.defer = true;
      s.src = src;

      s.onload = () => {
        s.setAttribute('data-loaded', 'true');
        resolve();
      };
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));

      document.head.appendChild(s);
    } catch (e) {
      reject(e);
    }
  });
}

export function loadRecaptchaEnterprise(siteKey) {
  // For safety: if siteKey missing, don't throw here — callers can decide how to handle.
  // getRecaptchaToken WILL throw if called without a key in prod.
  if (process.env.NODE_ENV !== 'production') {
    // Dev: return a tiny mock to avoid flakiness during local work
    return Promise.resolve({
      execute: async () => 'dev-recaptcha-token',
      ready: (cb) => (typeof cb === 'function' ? cb() : undefined),
      __mock: true,
    });
  }

  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise(async (resolve, reject) => {
    try {
      // If grecaptcha already exists (maybe classic api.js), reuse it.
      const existing = getGrecaptcha();
      if (existing) return resolve(existing);

      if (!siteKey) {
        return reject(
          new Error(
            'Missing reCAPTCHA site key. Set REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY (or equivalent).'
          )
        );
      }

      // Inject Enterprise script (single-flight).
      await injectScriptOnce({
        id: SCRIPT_ID_ENTERPRISE,
        src: `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`,
      });

      // Even after load, Safari can be racy—wait until ready really fires.
      const gre = await waitForGrecaptchaReady();
      if (!gre) {
        return reject(new Error('reCAPTCHA loaded but grecaptcha is unavailable'));
      }

      resolve(gre);
    } catch (e) {
      reject(e);
    }
  });

  return loaderPromise;
}

/**
 * Optional: if you ever need to explicitly load classic v3 (non-enterprise).
 * Not used by default, but kept here because some stacks mix both scripts.
 */
export function loadRecaptchaClassic(siteKey) {
  if (process.env.NODE_ENV !== 'production') {
    return Promise.resolve({
      execute: async () => 'dev-recaptcha-token',
      ready: (cb) => (typeof cb === 'function' ? cb() : undefined),
      __mock: true,
    });
  }

  if (!siteKey) {
    return Promise.reject(
      new Error('Missing reCAPTCHA site key for classic v3 (api.js).')
    );
  }

  return injectScriptOnce({
    id: SCRIPT_ID_CLASSIC,
    src: `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`,
  });
}

export async function getRecaptchaToken(siteKey, action = 'default') {
  if (process.env.NODE_ENV !== 'production') {
    return 'dev-recaptcha-token';
  }

  if (!siteKey) {
    throw new Error(
      'Missing reCAPTCHA site key. Set REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY (or equivalent).'
    );
  }

  // Load (or reuse) the script
  await loadRecaptchaEnterprise(siteKey);

  // Wait until grecaptcha.ready() truly fires (Safari can be racy)
  await waitForGrecaptchaReady();

  // Prefer enterprise; fallback to classic v3 if enterprise namespace not present
  const api =
    window.grecaptcha?.enterprise?.execute ? window.grecaptcha.enterprise : window.grecaptcha;

  if (!api?.execute) {
    throw new Error('reCAPTCHA execute() not available');
  }

  // execute() returns a Promise<string>
  return api.execute(siteKey, { action });
}