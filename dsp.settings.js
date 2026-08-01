// ============================================================
// dsp.settings.js — FULL VERSION (visual sync with overlay CSS)
// ============================================================

// Remember last selected preset circle
let dspLastSelectedPreset = null;

// EFFECT KEYS (must match your sliders / checkboxes)
const DSP_EFFECT_KEYS = [
  "Gain", "Bass", "Presence", "Stereo Width",
  "Compressor Threshold", "Compressor Ratio",
  "Stereo Tone", "Stereo Clarity", "Saturation", "Subharmonic",
  "Clarity", "Tone",
  "Bass Boost", "Bass Clarity",
  "Drum Tone", "Drum Clarity",
  "Guitar Clarity", "Guitar Bass", "Guitar Tone"
];


// Slider → DOM ID
const DSP_SLIDER_MAP = {
  "Gain": "gainSlider",
  "Bass": "bassSlider",
  "Presence": "presenceSlider",
  "Stereo Width": "widthSlider",
  "Compressor Threshold": "compThresholdSlider",
  "Compressor Ratio": "compRatioSlider",
  "Stereo Tone": "stereoToneSlider",
  "Stereo Clarity": "stereoClaritySlider",
  "Saturation": "saturationSlider",
  "Subharmonic": "subharmonicSlider",
  "Clarity": "claritySlider",
  "Tone": "toneSlider",
  "Bass Boost": "bassBoostSlider",
  "Bass Clarity": "bassClaritySlider",
  "Drum Tone": "drumToneSlider",
  "Drum Clarity": "drumClaritySlider",
  "Guitar Clarity": "guitarClaritySlider",
  "Guitar Bass": "guitarBassSlider",
  "Guitar Tone": "guitarToneSlider"
};

// Checkbox → DOM ID
const DSP_CHECKBOX_MAP = {
  "Gain": "gainCheck",
  "Bass": "bassCheck",
  "Presence": "presenceCheck",
  "Stereo Width": "widthCheck",
  "Compressor Threshold": "compThreshCheck",
  "Compressor Ratio": "compRatioCheck",
  "Stereo Tone": "stereoToneCheck",
  "Stereo Clarity": "stereoClarityCheck",
  "Saturation": "saturationCheck",
  "Subharmonic": "subharmonicCheck",
  "Clarity": "clarityCheck",
  "Tone": "toneCheck",
  "Bass Boost": "bassBoostCheck",
  "Bass Clarity": "bassClarityCheck",
  "Drum Tone": "drumToneCheck",
  "Drum Clarity": "drumClarityCheck",
  "Guitar Clarity": "guitarClarityCheck",
  "Guitar Bass": "guitarBassCheck",
  "Guitar Tone": "guitarToneCheck"
};



// File paths
const DSP_DEFAULT_FILE = "DSP Settings/dsp.settings.json";
const DSP_REGISTRY_FILE = "DSP Settings/dsp.json";

// ============================================================
// DOM helpers
// ============================================================
function dspGetSlider(key) {
  return document.getElementById(DSP_SLIDER_MAP[key]);
}
function dspGetCheckbox(key) {
  return document.getElementById(DSP_CHECKBOX_MAP[key]);
}

// ============================================================
// Collect current DSP settings → JSON
// ============================================================
function dspCollectCurrentSettings() {
  const settings = { values: {}, enabled: {} };

  DSP_EFFECT_KEYS.forEach(key => {
    const slider = dspGetSlider(key);
    const checkbox = dspGetCheckbox(key);

    settings.values[key] = slider ? parseFloat(slider.value) : 0;
    settings.enabled[key] = checkbox ? checkbox.checked : false;
  });

  return settings;
}

// ============================================================
// Apply JSON → UI
// ============================================================
function dspApplySettings(settings) {
  if (!settings || !settings.values) return;

  DSP_EFFECT_KEYS.forEach(key => {
    const slider = dspGetSlider(key);
    const checkbox = dspGetCheckbox(key);

    if (slider && settings.values[key] != null) {
      slider.value = settings.values[key];
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (checkbox) {
      checkbox.checked = !!settings.enabled[key];
    }
  });

  if (typeof rebuildDSPChain === "function") rebuildDSPChain();
}

// ============================================================
// Download current settings → dsp.settings.json
// ============================================================
function dspDownloadCurrentSettings() {
  const settings = dspCollectCurrentSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dsp.settings.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Load default settings on startup
// ============================================================
async function dspLoadDefaultSettings() {
  try {
    const res = await fetch(DSP_DEFAULT_FILE);
    if (!res.ok) return;
    const settings = await res.json();
    dspApplySettings(settings);
  } catch (e) {
    console.warn("Default DSP load failed:", e);
  }
}

// ============================================================
// Load registry dsp.json → preset list
// ============================================================
async function dspLoadRegistry() {
  try {
    const res = await fetch(DSP_REGISTRY_FILE);
    if (!res.ok) return;
    let presets = await res.json();

    // ⭐ NUMERIC SORT FIX (correct circle order)
    presets.sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D+/g, ""));
      const numB = parseInt(b.name.replace(/\D+/g, ""));
      return numA - numB;
    });

    dspShowOverlay(presets);
  } catch (e) {
    console.warn("Registry load failed:", e);
  }
}

// ============================================================
// Load preset file
// ============================================================
async function dspLoadPresetFile(filePath) {
  try {
    const res = await fetch(filePath);
    if (!res.ok) return;
    const settings = await res.json();
    dspApplySettings(settings);
  } catch (e) {
    console.warn("Preset load failed:", e);
  }
}

// ============================================================
// OVERLAY UI (center modal)
// ============================================================
function dspShowOverlay(presets) {
  const old = document.getElementById("dspOverlay");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "dspOverlay";
  overlay.className = "dsp-overlay";

  const panel = document.createElement("div");
  panel.className = "dsp-overlay-panel";

  const closeBtn = document.createElement("div");
  closeBtn.className = "dsp-overlay-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => overlay.remove());
  panel.appendChild(closeBtn);

  const barsContainer = document.createElement("div");
  barsContainer.className = "dsp-overlay-bars";

  DSP_EFFECT_KEYS.forEach(key => {
    const barWrap = document.createElement("div");
    barWrap.className = "dsp-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "dsp-bar";

    const fill = document.createElement("div");
    fill.className = "dsp-bar-fill";
    fill.style.height = "0%";

    bar.appendChild(fill);

    const label = document.createElement("div");
    label.className = "dsp-bar-label";
    label.textContent = key;

    barWrap.appendChild(bar);
    barWrap.appendChild(label);
    barsContainer.appendChild(barWrap);
  });

  panel.appendChild(barsContainer);

  const circles = document.createElement("div");
  circles.className = "dsp-overlay-circles";

  presets.forEach((preset, index) => {
    const circle = document.createElement("div");
    circle.className = "dsp-overlay-circle";

    circle.addEventListener("click", async () => {
      document.querySelectorAll(".dsp-overlay-circle").forEach(c => c.classList.remove("active"));
      circle.classList.add("active");

      dspLastSelectedPreset = preset.file;

      await dspLoadPresetFile(preset.file);
      dspUpdateOverlayBars(panel);
    });

    circles.appendChild(circle);
  });

  panel.appendChild(circles);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // restore glow
  if (dspLastSelectedPreset) {
    const circlesList = panel.querySelectorAll(".dsp-overlay-circle");
    circlesList.forEach((circle, index) => {
      if (presets[index].file === dspLastSelectedPreset) {
        circle.classList.add("active");
      }
    });
  }

  dspUpdateOverlayBars(panel);
}

// ============================================================
// Update overlay bars to reflect current DSP values
// ============================================================
function dspUpdateOverlayBars(panel) {
  const settings = dspCollectCurrentSettings();
  const fills = panel.querySelectorAll(".dsp-bar-fill");

  fills.forEach((fill, idx) => {
    const key = DSP_EFFECT_KEYS[idx];
    const val = settings.values[key] || 0;
    const pct = Math.min(100, Math.max(0, (val / 10) * 100));

    fill.style.height = pct + "%";

    const hue = (idx * 25) % 360;
    fill.style.background = `linear-gradient(to top,
      hsl(${hue}, 100%, 45%),
      hsl(${hue}, 100%, 65%),
      hsl(${(hue + 40) % 360}, 100%, 70%)
    )`;
    fill.style.boxShadow = `0 0 12px hsl(${hue}, 100%, 60%)`;
  });
}


// ============================================================
// INIT
// ============================================================
function dspInitSettingsSystem() {

  dspLoadDefaultSettings();

  const downloadBtn = document.getElementById("dspDownloadBtn");
  if (downloadBtn) downloadBtn.addEventListener("click", dspDownloadCurrentSettings);

  const loadBtn = document.getElementById("dspLoadBtn");
  if (loadBtn) loadBtn.addEventListener("click", dspLoadRegistry);
}

window.dspInitSettingsSystem = dspInitSettingsSystem;
