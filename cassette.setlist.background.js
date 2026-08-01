/* ============================================================
   Cassette‑Setlist Background System
   Works with JSON format:
   [
     "image1.jpg",
     "image2.webp",
     "image3.png"
   ]
   ============================================================ */

const BG_JSON_PATH = "Cassette-Setlist Background/cassette.setlist.background.json";
const BG_FOLDER = "Cassette-Setlist Background/";
const BG_CONTAINER_ID = "cassetteBackground";

let bgImages = [];
let bgTimer = null;

/* Load JSON registry */
async function loadBackgroundRegistry() {
  try {
    const res = await fetch(BG_JSON_PATH);
    if (!res.ok) {
      console.warn("Background registry not found:", BG_JSON_PATH);
      return;
    }

    bgImages = await res.json();

    if (!Array.isArray(bgImages) || bgImages.length === 0) {
      console.warn("Background registry is empty.");
      return;
    }

    applyRandomBackground();
    scheduleNextBackground();

  } catch (err) {
    console.error("Failed loading background registry:", err);
  }
}

/* Pick random image filename */
function getRandomImage() {
  const idx = Math.floor(Math.random() * bgImages.length);
  return bgImages[idx]; // string filename
}

/* Apply background */
function applyRandomBackground() {
  const filename = getRandomImage();
  const container = document.getElementById(BG_CONTAINER_ID);

  if (!container) return;

  const fullPath = BG_FOLDER + filename;

  container.style.backgroundImage = `url("${fullPath}")`;
}

/* Schedule next background change */
function scheduleNextBackground() {
  const minutes = Math.floor(Math.random() * 11); // 0–10 minutes
  const ms = minutes * 60 * 1000;

  clearTimeout(bgTimer);
  bgTimer = setTimeout(() => {
    applyRandomBackground();
    scheduleNextBackground();
  }, ms);
}

/* Init */
window.addEventListener("DOMContentLoaded", loadBackgroundRegistry);
