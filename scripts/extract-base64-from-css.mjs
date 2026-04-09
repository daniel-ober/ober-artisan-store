// Usage:
// node scripts/extract-base64-from-css.mjs \
/*   build/static/css/main.f041fede.css  public/images  build/static/css/main.f041fede.css */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const [,, inCssPath, outDir, outCssPath] = process.argv;
if (!inCssPath || !outDir || !outCssPath) {
  console.error("Usage: node extract-base64-from-css.mjs <in.css> <outImgDir> <out.css>");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

let css = fs.readFileSync(inCssPath, "utf8");

// data:<mime>;base64,<blob>
const re = /url\(\s*(['"]?)data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)\1\s*\)/g;

let count = 0;
css = css.replace(re, (_m, _q, mime, b64) => {
  const buf = Buffer.from(b64, "base64");
  const ext = (() => {
    const map = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
    return map[mime] || "bin";
  })();
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10);
  const filename = `extracted-${hash}.${ext}`;
  const dest = path.join(outDir, filename);
  if (!fs.existsSync(dest)) fs.writeFileSync(dest, buf);
  count++;
  // point to /images/... (assumes outDir is under public/images)
  const publicPath = "/images/" + filename;
  return `url("${publicPath}")`;
});

fs.writeFileSync(outCssPath, css, "utf8");
// console.log(`✅ Extracted ${count} image(s). Updated CSS -> ${outCssPath}`);