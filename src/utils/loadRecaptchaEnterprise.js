let loaderPromise = null;

export function loadRecaptchaEnterprise(siteKey) {
  if (process.env.NODE_ENV !== "production") {
    // Dev: return a tiny mock that looks like grecaptcha.enterprise
    return Promise.resolve({
      ready: (cb) => cb && cb(),
      execute: async () => "dev-recaptcha-token",
    });
  }

  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      const id = "grecaptcha-enterprise";
      if (document.getElementById(id)) {
        return resolve(window.grecaptcha?.enterprise);
      }
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.defer = true;
      s.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(
        siteKey
      )}`;
      s.onload = () => resolve(window.grecaptcha?.enterprise);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return loaderPromise;
}

export async function getRecaptchaToken(siteKey, action = "submit") {
  const gre = await loadRecaptchaEnterprise(siteKey);
  if (!gre) throw new Error("grecaptcha.enterprise failed to load");
  await new Promise((r) => gre.ready(r));
  return gre.execute(siteKey, { action });
}