/**
 * Generates placeholder app assets for development.
 * For production, replace these with professionally designed assets.
 *
 * Run: node scripts/generate-assets.js
 * Requires: npm install -g canvas  OR  just use the generated PNGs
 *
 * Asset requirements for Apple App Store:
 *   - icon.png:          1024×1024 (App Store icon, no transparency)
 *   - splash.png:        2048×2048 (centered logo on dark background)
 *   - adaptive-icon.png: 1024×1024 (Android only)
 *   - favicon.png:       196×196   (web)
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const ASSETS_DIR = path.join(__dirname, "..", "assets");
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

function drawGhyariIcon(canvas, size, withBackground = true) {
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  if (withBackground) {
    // Dark background
    ctx.fillStyle = "#0A0A0F";
    ctx.fillRect(0, 0, size, size);

    // Rounded rect clip
    const r = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#001433");
    grad.addColorStop(0.5, "#003D99");
    grad.addColorStop(1, "#0A0A0F");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Draw Arabic "غ" letter
  ctx.font = `bold ${size * 0.55}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("غ", cx, cy * 0.95);

  // Orange accent dot
  ctx.beginPath();
  ctx.arc(size * 0.72, size * 0.72, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = "#FF6B00";
  ctx.fill();
}

// icon.png — 1024×1024
const icon = createCanvas(1024, 1024);
drawGhyariIcon(icon, 1024, true);
fs.writeFileSync(path.join(ASSETS_DIR, "icon.png"), icon.toBuffer("image/png"));
console.log("✅ icon.png generated (1024×1024)");

// splash.png — 2048×2048
const splash = createCanvas(2048, 2048);
const sctx = splash.getContext("2d");
sctx.fillStyle = "#0A0A0F";
sctx.fillRect(0, 0, 2048, 2048);
// Center logo
const logoSize = 400;
const logoOffset = (2048 - logoSize) / 2;
const logoCanvas = createCanvas(logoSize, logoSize);
drawGhyariIcon(logoCanvas, logoSize, true);
sctx.drawImage(logoCanvas, logoOffset, logoOffset - 60);
// App name
sctx.font = "bold 120px Arial";
sctx.textAlign = "center";
sctx.fillStyle = "#FFFFFF";
sctx.fillText("غياري", 1024, 1350);
// Tagline
sctx.font = "60px Arial";
sctx.fillStyle = "rgba(255,255,255,0.5)";
sctx.fillText("Auto Parts", 1024, 1460);
fs.writeFileSync(path.join(ASSETS_DIR, "splash.png"), splash.toBuffer("image/png"));
console.log("✅ splash.png generated (2048×2048)");

// adaptive-icon.png — 1024×1024 (for Android)
fs.copyFileSync(
  path.join(ASSETS_DIR, "icon.png"),
  path.join(ASSETS_DIR, "adaptive-icon.png")
);
console.log("✅ adaptive-icon.png generated");

// favicon.png — 196×196
const fav = createCanvas(196, 196);
drawGhyariIcon(fav, 196, true);
fs.writeFileSync(path.join(ASSETS_DIR, "favicon.png"), fav.toBuffer("image/png"));
console.log("✅ favicon.png generated");

console.log("\n📁 All assets saved to ./assets/");
console.log("⚠️  For App Store: replace with professionally designed 1024×1024 icon (no transparency)");
