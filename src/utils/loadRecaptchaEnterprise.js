// Single-flight, Safari-safe reCAPTCHA Enterprise loader.
// Coexists with classic api.js if another library injects it (e.g., Firebase Phone Auth).

let loaderPromise = null;

function waitForGrecaptchaReady(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const gre = window.grecaptcha?.enterprise ?? window.grecaptcha;
      if (gre && typeof gre.ready === 'function') {
        try {
          gre.ready(() => resolve(window.grecaptcha?.enterprise ?? window.grecaptcha));
          return;
        } catch (_) {
          // keep trying
        }
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Timed out waiting for grecaptcha.ready()'));
      }
      setTimeout(check, 120);
    }

    check();
  });
}

export function loadRecaptchaEnterprise(siteKey) {
  if (process.env.NODE_ENV !== 'production') {
    // Dev: return a tiny mock to avoid flakiness during local work
    return Promise.resolve({
      execute: async () => 'dev-recaptcha-token',
      ready: (cb) => cb && cb(),
      __mock: true,
    });
  }

  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    try {
      // If grecaptcha already exists (maybe classic api.js), reuse it.
      if (window.grecaptcha) {
        return resolve(window.grecaptcha?.enterprise ?? window.grecaptcha);
      }

      // Inject a single enterprise script tag; avoid duplicates by id.
      const id = 'grecaptcha-enterprise-script';
      if (document.getElementById(id)) {
        return resolve(window.grecaptcha?.enterprise ?? window.grecaptcha ?? null);
      }

      const s = document.createElement('script');
      s.id = id;
      s.async = true;
      s.defer = true;
      s.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
      s.onload = () => resolve(window.grecaptcha?.enterprise ?? window.grecaptcha ?? null);
      s.onerror = () => reject(new Error('Failed to load reCAPTCHA enterprise script'));
      document.head.appendChild(s);
    } catch (e) {
      reject(e);
    }
  });

  return loaderPromise;
}

export async function getRecaptchaToken(siteKey, action = 'default') {
  // Load (or reuse) the script
  await loadRecaptchaEnterprise(siteKey);

  // Wait until grecaptcha.ready() truly fires (Safari can be racy)
  const gre = await waitForGrecaptchaReady();

  // Prefer enterprise; fallback to classic v3 if enterprise namespace not present
  const api = window.grecaptcha?.enterprise?.execute
    ? window.grecaptcha.enterprise
    : window.grecaptcha;

  if (!api?.execute) {
    throw new Error('reCAPTCHA execute() not available');
  }

  return api.execute(siteKey, { action });
}