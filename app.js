// app.js
const SUPPORTED_EXT = ['mp3', 'wav', 'flac', 'ogg', 'm4a'];

const folderInput = document.getElementById('folderInput');
const tracklistEl = document.getElementById('tracklist');
const currentTrackNameEl = document.getElementById('currentTrackName');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekSlider = document.getElementById('seekSlider');
const progressFill = document.querySelector(".progress-fill");

// time display
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');

const dspToggleBtn = document.getElementById('dspToggleBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

// transport buttons
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const repeatBtn = document.getElementById('repeatBtn');
const shuffleBtn = document.getElementById('shuffleBtn');


// core sliders
const gainSlider = document.getElementById('gainSlider');
const gainValue = document.getElementById('gainValue');
const bassSlider = document.getElementById('bassSlider');
const bassValue = document.getElementById('bassValue');
const presenceSlider = document.getElementById('presenceSlider');
const presenceValue = document.getElementById('presenceValue');
const widthSlider = document.getElementById('widthSlider');
const widthValue = document.getElementById('widthValue');
const compThresholdSlider = document.getElementById('compThresholdSlider');
const compThresholdValue = document.getElementById('compThresholdValue');
const compRatioSlider = document.getElementById('compRatioSlider');
const compRatioValue = document.getElementById('compRatioValue');

// ⭐ RENAMED UI sliders (matching left labels)
const stereoToneSlider = document.getElementById('stereoToneSlider');
const stereoToneValue = document.getElementById('stereoToneValue');

const stereoClaritySlider = document.getElementById('stereoClaritySlider');
const stereoClarityValue = document.getElementById('stereoClarityValue');

const saturationSlider = document.getElementById('saturationSlider');
const saturationValue = document.getElementById('saturationValue');

const subSlider = document.getElementById('subharmonicSlider');
const subValue = document.getElementById('subharmonicValue');

const claritySlider = document.getElementById('claritySlider');
const clarityValue = document.getElementById('clarityValue');

const warmthSlider = document.getElementById('toneSlider'); 
const warmthValue = document.getElementById('toneValue');

// appended sliders (renamed)
const bassBoostSlider = document.getElementById('bassBoostSlider');
const bassBoostValue = document.getElementById('bassBoostValue');

const bassClaritySlider = document.getElementById('bassClaritySlider');
const bassClarityValue = document.getElementById('bassClarityValue');

const drumToneSlider = document.getElementById('drumToneSlider');
const drumToneValue = document.getElementById('drumToneValue');

const drumClaritySlider = document.getElementById('drumClaritySlider');
const drumClarityValue = document.getElementById('drumClarityValue');

const guitarClaritySlider = document.getElementById('guitarClaritySlider');
const guitarClarityValue = document.getElementById('guitarClarityValue');

const guitarBassSlider = document.getElementById('guitarBassSlider');
const guitarBassValue = document.getElementById('guitarBassValue');

const guitarToneSlider = document.getElementById('guitarToneSlider');
const guitarToneValue = document.getElementById('guitarToneValue');

// checkboxes (renamed)
const gainCheck = document.getElementById('gainCheck');
const bassCheck = document.getElementById('bassCheck');
const presenceCheck = document.getElementById('presenceCheck');
const widthCheck = document.getElementById('widthCheck');
const compThreshCheck = document.getElementById('compThreshCheck');
const compRatioCheck = document.getElementById('compRatioCheck');

const stereoToneCheck = document.getElementById('stereoToneCheck');
const stereoClarityCheck = document.getElementById('stereoClarityCheck');
const saturationCheck = document.getElementById('saturationCheck');

const subCheck = document.getElementById('subharmonicCheck');
const clarityCheck = document.getElementById('clarityCheck');
const toneCheck = document.getElementById('toneCheck');

const bassBoostCheck = document.getElementById('bassBoostCheck');
const bassClarityCheck = document.getElementById('bassClarityCheck');
const drumToneCheck = document.getElementById('drumToneCheck');
const drumClarityCheck = document.getElementById('drumClarityCheck');
const guitarClarityCheck = document.getElementById('guitarClarityCheck');
const guitarBassCheck = document.getElementById('guitarBassCheck');
const guitarToneCheck = document.getElementById('guitarToneCheck');

let audioContext = null;
let audioElement = null;
let trackList = [];
let currentTrackIndex = -1;
let isPlaying = false;
let dspEnabled = false;
let isRepeat = false;
let isShuffle = false;

// DSP nodes
let sourceNode, gainNode, bassEQ, presenceEQ;
let stereoSplitter, stereoMerger, stereoWidthGainL, stereoWidthGainR;
let compressor, stereoToneNode, stereoClarityEQ, saturationNode;
let subharmonic, clarityEQ, toneEQ;
let bassBoostEQ, bassClarityEQ, drumToneEQ, drumClarityEQ;
let guitarClarityEQ, guitarBassEQ, guitarToneEQ;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.crossOrigin = 'anonymous';
  }

  if (!sourceNode) {
    sourceNode = audioContext.createMediaElementSource(audioElement);
  }

  gainNode = audioContext.createGain();
  bassEQ = audioContext.createBiquadFilter();
  presenceEQ = audioContext.createBiquadFilter();
  compressor = audioContext.createDynamicsCompressor();

  stereoSplitter = audioContext.createChannelSplitter(2);
  stereoMerger = audioContext.createChannelMerger(2);
  stereoWidthGainL = audioContext.createGain();
  stereoWidthGainR = audioContext.createGain();

  bassEQ.type = 'lowshelf';
  bassEQ.frequency.value = 120;

  presenceEQ.type = 'highshelf';
  presenceEQ.frequency.value = 6000;

  gainNode.gain.value = parseFloat(gainSlider.value);
  bassEQ.gain.value = map0to10ToDb(parseFloat(bassSlider.value));
  presenceEQ.gain.value = map0to10ToDb(parseFloat(presenceSlider.value));

  const widthFactor = parseFloat(widthSlider.value) / 5;
  stereoWidthGainL.gain.value = widthFactor;
  stereoWidthGainR.gain.value = widthFactor;

  compressor.threshold.value = parseFloat(compThresholdSlider.value);
  compressor.ratio.value = parseFloat(compRatioSlider.value);
  compressor.attack.value = 0.01;
  compressor.release.value = 0.25;
  compressor.knee.value = 6;

  stereoToneNode = audioContext.createWaveShaper();
  stereoToneNode.curve = createStereoToneCurve(3.0, 44100);

  stereoClarityEQ = audioContext.createBiquadFilter();
  stereoClarityEQ.type = 'highshelf';
  stereoClarityEQ.frequency.value = 14000;
  stereoClarityEQ.gain.value = map0to10Linear(parseFloat(stereoClaritySlider.value), 0, 8);

  saturationNode = audioContext.createWaveShaper();
  saturationNode.curve = createSaturationCurve(1.6, 44100);

  subharmonic = audioContext.createWaveShaper();
  subharmonic.curve = createSubharmonicCurve(2.5, 44100);

  clarityEQ = audioContext.createBiquadFilter();
  clarityEQ.type = 'peaking';
  clarityEQ.frequency.value = 3500;
  clarityEQ.Q.value = 1.2;
  clarityEQ.gain.value = map0to10Linear(parseFloat(claritySlider.value), -2, 6);

  toneEQ = audioContext.createBiquadFilter();
  toneEQ.type = 'peaking';
  toneEQ.frequency.value = 1200;
  toneEQ.Q.value = 0.7;
  toneEQ.gain.value = 0;

  bassBoostEQ = audioContext.createBiquadFilter();
  bassBoostEQ.type = "lowshelf";
  bassBoostEQ.frequency.value = 60;
  bassBoostEQ.gain.value = 0;

  bassClarityEQ = audioContext.createBiquadFilter();
  bassClarityEQ.type = "peaking";
  bassClarityEQ.frequency.value = 180;
  bassClarityEQ.Q.value = 1.4;
  bassClarityEQ.gain.value = 0;

  drumToneEQ = audioContext.createBiquadFilter();
  drumToneEQ.type = "peaking";
  drumToneEQ.frequency.value = 900;
  drumToneEQ.Q.value = 1.0;
  drumToneEQ.gain.value = 0;

  drumClarityEQ = audioContext.createBiquadFilter();
  drumClarityEQ.type = "highshelf";
  drumClarityEQ.frequency.value = 8000;
  drumClarityEQ.gain.value = 0;

  guitarClarityEQ = audioContext.createBiquadFilter();
  guitarClarityEQ.type = "peaking";
  guitarClarityEQ.frequency.value = 3200;
  guitarClarityEQ.Q.value = 0.8;
  guitarClarityEQ.gain.value = 0;

  guitarBassEQ = audioContext.createBiquadFilter();
  guitarBassEQ.type = "lowshelf";
  guitarBassEQ.frequency.value = 250;
  guitarBassEQ.gain.value = 0;

  guitarToneEQ = audioContext.createBiquadFilter();
  guitarToneEQ.type = "highshelf";
  guitarToneEQ.frequency.value = 12000;
  guitarToneEQ.gain.value = 0;

  rebuildDSPChain();

  if (seekSlider) {
    seekSlider.addEventListener('input', () => {
      if (!audioElement.duration || isNaN(audioElement.duration)) return;
      const targetTime = (seekSlider.value / 100) * audioElement.duration;
      audioElement.currentTime = targetTime;
    });
  }

  if (!audioElement._timeUpdateAttached) {
    audioElement.addEventListener('timeupdate', () => {
  if (!audioElement.duration) return;

  const current = audioElement.currentTime;
  const duration = audioElement.duration;

  const percent = (current / duration) * 100;

  seekSlider.value = percent;

  // ⭐ THIS WAS MISSING
  if (progressFill) {
    progressFill.style.width = percent + "%";
  }

  if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
  if (totalTimeEl) totalTimeEl.textContent = formatTime(duration);
});

    audioElement._timeUpdateAttached = true;
  }

  audioElement.addEventListener('ended', () => {
    isPlaying = false;
    handleTrackEnd();
  });
}

// CURVE HELPERS
function createStereoToneCurve(intensity, size) {
  const curve = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const x = (i / size) * 2 - 1;
    curve[i] = Math.tanh(x * intensity);
  }
  return curve;
}

function createSaturationCurve(intensity, size) {
  const curve = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const x = (i / size) * 2 - 1;
    curve[i] = Math.tanh(x * intensity);
  }
  return curve;
}

function createSubharmonicCurve(mult, size) {
  const curve = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const x = (i / size) * 2 - 1;
    curve[i] = Math.sin(x * mult);
  }
  return curve;
}

function map0to10ToDb(v) {
  return (v - 5) * 3;
}

function map0to10Linear(v, min, max) {
  const t = v / 10;
  return min + (max - min) * t;
}

// FOLDER / TRACKLIST
folderInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files || []);

  if (files.length === 0) return;

  trackList = [];

  files.forEach((file) => {
    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();
    if (SUPPORTED_EXT.includes(ext)) {
      const url = URL.createObjectURL(file);
      trackList.push({ name, ext, url });
    }
  });

  renderTracklist();

  if (trackList.length > 0) {
    initAudio();
    loadTrack(0);
  }
});

function renderTracklist() {
  tracklistEl.innerHTML = '';

  if (trackList.length === 0 && currentTrackIndex !== -1) {
    return;
  }

  if (trackList.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'track-item';
    empty.textContent = 'No supported audio files found in folder.';
    tracklistEl.appendChild(empty);
    playPauseBtn.disabled = true;
    currentTrackIndex = -1;
    return;
  }

  trackList.forEach((track, index) => {
    const item = document.createElement('div');
    item.className = 'track-item';
    if (index === currentTrackIndex) item.classList.add('active');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'track-name';
    nameSpan.textContent = track.name.replace(/\.(mp3|wav|flac|aac|ogg)$/i, "");

    item.appendChild(nameSpan);

    item.addEventListener('click', () => {
      loadTrack(index);
      playTrack();
    });

    tracklistEl.appendChild(item);
  });
}

seekSlider.addEventListener("input", (e) => {
  const percent = Number(e.target.value);

  if (progressFill) {
    progressFill.style.width = percent + "%";
  }

  if (audioElement && !isNaN(audioElement.duration) && audioElement.duration > 0) {
    const newTime = (percent / 100) * audioElement.duration;
    audioElement.currentTime = newTime;

    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(newTime);
    }
  }
});

function loadTrack(index) {
  if (!audioContext || !audioElement) initAudio();
  if (index < 0 || index >= trackList.length) return;

  currentTrackIndex = index;
  const track = trackList[index];

  audioElement.src = track.url;
  audioElement.load();

  playPauseBtn.disabled = false;

  seekSlider.value = 0;
  if (progressFill) progressFill.style.width = "0%";

  if (currentTimeEl) currentTimeEl.textContent = "00:00";
  if (totalTimeEl) totalTimeEl.textContent = "00:00";

  Array.from(tracklistEl.children).forEach((child, i) => {
    child.classList.toggle("active", i === index);
  });

  playTrack();
}

// PLAYBACK
playPauseBtn.addEventListener("click", () => {
  if (!audioElement) initAudio();
  if (!isPlaying) playTrack();
  else pauseTrack();
});

function playTrack() {
  initAudio();
  audioContext.resume();

  if (audioElement.src) audioElement.play();
  isPlaying = true;

  playIcon.style.display = "none";
  pauseIcon.style.display = "block";

  playPauseBtn.classList.remove("active");
}

function pauseTrack() {
  if (audioElement.src) audioElement.pause();
  isPlaying = false;

  playIcon.style.display = "block";
  pauseIcon.style.display = "none";

  playPauseBtn.classList.remove("active");
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}


// TRACK END / TRANSPORT
function handleTrackEnd() {
  if (trackList.length === 0) return;

  if (isRepeat) {
    audioElement.currentTime = 0;
    playTrack();
    return;
  }

  const nextIndex = getNextIndex();
  if (nextIndex !== -1) {
    loadTrack(nextIndex);
    playTrack();
  }
}

function getNextIndex() {
  if (trackList.length === 0) return -1;

  if (isShuffle) {
    if (trackList.length === 1) return currentTrackIndex;
    let idx = currentTrackIndex;
    while (idx === currentTrackIndex) {
      idx = Math.floor(Math.random() * trackList.length);
    }
    return idx;
  }

  const next = currentTrackIndex + 1;
  if (next >= trackList.length) return 0;
  return next;
}

function getPrevIndex() {
  if (trackList.length === 0) return -1;

  if (isShuffle) {
    if (trackList.length === 1) return currentTrackIndex;
    let idx = currentTrackIndex;
    while (idx === currentTrackIndex) {
      idx = Math.floor(Math.random() * trackList.length);
    }
    return idx;
  }

  const prev = currentTrackIndex - 1;
  if (prev < 0) return trackList.length - 1;
  return prev;
}

// NEXT / PREV
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (trackList.length === 0) return;
    const idx = getNextIndex();
    if (idx !== -1) {
      loadTrack(idx);
      playTrack();
    }
  });
}
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (trackList.length === 0) return;
    const idx = getPrevIndex();
    if (idx !== -1) {
      loadTrack(idx);
      playTrack();
    }
  });
}

// REPEAT / SHUFFLE
if (repeatBtn) {
  repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle("active", isRepeat);
    if (isRepeat) {
      isShuffle = false;
      shuffleBtn.classList.remove("active");
    }
  });
}

if (shuffleBtn) {
  shuffleBtn.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
    if (isShuffle) {
      isRepeat = false;
      repeatBtn.classList.remove("active");
    }
  });
}

// DSP TOGGLE
dspToggleBtn.addEventListener('click', () => {
  dspEnabled = !dspEnabled;
  rebuildDSPChain();
  dspToggleBtn.classList.toggle('active', dspEnabled);
});

// ROUTING
function updateRouting() {
  if (!audioContext || !sourceNode) return;

  [
    sourceNode, bassEQ, presenceEQ, gainNode,
    stereoSplitter, stereoWidthGainL, stereoWidthGainR, stereoMerger,
    compressor, stereoToneNode, stereoClarityEQ, saturationNode,
    subharmonic, clarityEQ, toneEQ,
    bassBoostEQ, bassClarityEQ, drumToneEQ, drumClarityEQ,
    guitarClarityEQ, guitarBassEQ, guitarToneEQ
  ].forEach(node => {
    try { node.disconnect(); } catch {}
  });

  if (dspEnabled) {
    sourceNode.connect(gainNode);
    gainNode.connect(bassEQ);
    bassEQ.connect(presenceEQ);

    presenceEQ.connect(stereoSplitter);
    stereoSplitter.connect(stereoWidthGainL, 0);
    stereoSplitter.connect(stereoWidthGainR, 1);
    stereoWidthGainL.connect(stereoMerger, 0, 0);
    stereoWidthGainR.connect(stereoMerger, 0, 1);

    stereoMerger.connect(compressor);
    compressor.connect(stereoToneNode);
    stereoToneNode.connect(stereoClarityEQ);
    stereoClarityEQ.connect(saturationNode);
    saturationNode.connect(subharmonic);
    subharmonic.connect(clarityEQ);
    clarityEQ.connect(toneEQ);

    toneEQ.connect(bassBoostEQ);
    bassBoostEQ.connect(bassClarityEQ);
    bassClarityEQ.connect(drumToneEQ);
    drumToneEQ.connect(drumClarityEQ);
    drumClarityEQ.connect(guitarClarityEQ);
    guitarClarityEQ.connect(guitarBassEQ);
    guitarBassEQ.connect(guitarToneEQ);
    guitarToneEQ.connect(audioContext.destination);
  } else {
    sourceNode.connect(audioContext.destination);
  }
}

// CHECKBOX‑BASED CHAIN
function rebuildDSPChain() {
  if (!audioContext) return;

  [
    sourceNode, gainNode, bassEQ, presenceEQ,
    stereoSplitter, stereoWidthGainL, stereoWidthGainR, stereoMerger,
    compressor, stereoToneNode, stereoClarityEQ, saturationNode,
    subharmonic, clarityEQ, toneEQ,
    bassBoostEQ, bassClarityEQ, drumToneEQ, drumClarityEQ,
    guitarClarityEQ, guitarBassEQ, guitarToneEQ
  ].forEach(node => {
    try { node.disconnect(); } catch {}
  });

  if (!dspEnabled) {
    sourceNode.connect(audioContext.destination);
    return;
  }

  let chain = [];
  chain.push(sourceNode);

  if (dspGetCheckbox("Gain").checked) chain.push(gainNode);
  if (dspGetCheckbox("Bass").checked) chain.push(bassEQ);
  if (dspGetCheckbox("Presence").checked) chain.push(presenceEQ);

  if (dspGetCheckbox("Stereo Width").checked) {
    const head = chain[chain.length - 1];
    try {
      head.connect(stereoSplitter);
      stereoSplitter.connect(stereoWidthGainL, 0);
      stereoSplitter.connect(stereoWidthGainR, 1);
      stereoWidthGainL.connect(stereoMerger, 0, 0);
      stereoWidthGainR.connect(stereoMerger, 0, 1);
    } catch (e) {}
    chain.push(stereoMerger);
  }

  if (dspGetCheckbox("Compressor Threshold").checked ||
      dspGetCheckbox("Compressor Ratio").checked)
    chain.push(compressor);

  if (dspGetCheckbox("Stereo Tone").checked) chain.push(stereoToneNode);
  if (dspGetCheckbox("Stereo Clarity").checked) chain.push(stereoClarityEQ);
  if (dspGetCheckbox("Saturation").checked) chain.push(saturationNode);
  if (dspGetCheckbox("Subharmonic").checked) chain.push(subharmonic);
  if (dspGetCheckbox("Clarity").checked) chain.push(clarityEQ);
  if (dspGetCheckbox("Tone").checked) chain.push(toneEQ);

  if (dspGetCheckbox("Bass Boost").checked) chain.push(bassBoostEQ);
  if (dspGetCheckbox("Bass Clarity").checked) chain.push(bassClarityEQ);
  if (dspGetCheckbox("Drum Tone").checked) chain.push(drumToneEQ);
  if (dspGetCheckbox("Drum Clarity").checked) chain.push(drumClarityEQ);
  if (dspGetCheckbox("Guitar Clarity").checked) chain.push(guitarClarityEQ);
  if (dspGetCheckbox("Guitar Bass").checked) chain.push(guitarBassEQ);
  if (dspGetCheckbox("Guitar Tone").checked) chain.push(guitarToneEQ);

  for (let i = 0; i < chain.length - 1; i++) {
    try {
      chain[i].connect(chain[i + 1]);
    } catch (e) {}
  }

  try {
    chain[chain.length - 1].connect(audioContext.destination);
  } catch (e) {}
}


// Hook all checkboxes
document.querySelectorAll('.effect-checkbox').forEach(cb => {
  cb.addEventListener('change', () => {
    rebuildDSPChain();
  });
});

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('hidden');
  settingsPanel.classList.add('show');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('show');
  settingsPanel.classList.add('hidden');
});



// SLIDER HANDLERS
gainSlider.addEventListener('input', () => {
  const val = parseFloat(gainSlider.value);
  gainValue.textContent = val.toFixed(2);
  if (gainNode) gainNode.gain.value = val;
});

bassSlider.addEventListener('input', () => {
  const val = parseFloat(bassSlider.value);
  bassValue.textContent = val.toFixed(1);
  if (bassEQ) bassEQ.gain.value = map0to10ToDb(val);
});

presenceSlider.addEventListener('input', () => {
  const val = parseFloat(presenceSlider.value);
  presenceValue.textContent = val.toFixed(1);
  if (presenceEQ) presenceEQ.gain.value = map0to10ToDb(val);
});

widthSlider.addEventListener('input', () => {
  const val = parseFloat(widthSlider.value);
  widthValue.textContent = val.toFixed(1);
  const widthFactor = val / 5;
  if (stereoWidthGainL && stereoWidthGainR) {
    stereoWidthGainL.gain.value = widthFactor;
    stereoWidthGainR.gain.value = widthFactor;
  }
});

compThresholdSlider.addEventListener('input', () => {
  const val = parseFloat(compThresholdSlider.value);
  compThresholdValue.textContent = `${val} dB`;
  if (compressor) compressor.threshold.value = val;
});

compRatioSlider.addEventListener('input', () => {
  const val = parseFloat(compRatioSlider.value);
  compRatioValue.textContent = `${val}:1`;
  if (compressor) compressor.ratio.value = val;
});

// EFFECT SLIDERS
stereoToneSlider.addEventListener('input', () => {
  const val = parseFloat(stereoToneSlider.value);
  stereoToneValue.textContent = val.toFixed(1);
  if (stereoToneNode) {
    stereoToneNode.curve = createStereoToneCurve(2.0 + val * 0.3, 44100);
  }
});

stereoClaritySlider.addEventListener('input', () => {
  const val = parseFloat(stereoClaritySlider.value);
  stereoClarityValue.textContent = val.toFixed(1);
  if (stereoClarityEQ) {
    stereoClarityEQ.gain.value = map0to10Linear(val, 0, 10);
  }
});

saturationSlider.addEventListener('input', () => {
  const val = parseFloat(saturationSlider.value);
  saturationValue.textContent = val.toFixed(1);
  if (saturationNode) {
    saturationNode.curve = createSaturationCurve(0.8 + val * 0.3, 44100);
  }
});

subSlider.addEventListener('input', () => {
  const val = parseFloat(subSlider.value);
  subValue.textContent = val.toFixed(1);
  if (subharmonic) {
    subharmonic.curve = createSubharmonicCurve(1.5 + val * 0.3, 44100);
  }
});

claritySlider.addEventListener('input', () => {
  const val = parseFloat(claritySlider.value);
  clarityValue.textContent = val.toFixed(1);
  if (clarityEQ) {
    clarityEQ.gain.value = map0to10Linear(val, -2, 8);
  }
});

warmthSlider.addEventListener('input', () => {
  const val = parseFloat(warmthSlider.value);
  warmthValue.textContent = val.toFixed(1);
  const mapped = (val - 5) * 2;
  if (toneEQ) toneEQ.gain.value = mapped;
});

// appended effect sliders
bassBoostSlider.addEventListener('input', () => {
  const v = parseFloat(bassBoostSlider.value);
  bassBoostValue.textContent = v.toFixed(1);
  if (bassBoostEQ) bassBoostEQ.gain.value = (v - 5) * 2;
});

bassClaritySlider.addEventListener('input', () => {
  const v = parseFloat(bassClaritySlider.value);
  bassClarityValue.textContent = v.toFixed(1);
  if (bassClarityEQ) bassClarityEQ.gain.value = (v - 5) * 2;
});

drumToneSlider.addEventListener('input', () => {
  const v = parseFloat(drumToneSlider.value);
  drumToneValue.textContent = v.toFixed(1);
  if (drumToneEQ) drumToneEQ.gain.value = (v - 5) * 2;
});

drumClaritySlider.addEventListener('input', () => {
  const v = parseFloat(drumClaritySlider.value);
  drumClarityValue.textContent = v.toFixed(1);
  if (drumClarityEQ) drumClarityEQ.gain.value = (v - 5) * 2;
});

guitarClaritySlider.addEventListener('input', () => {
  const v = parseFloat(guitarClaritySlider.value);
  guitarClarityValue.textContent = v.toFixed(1);
  if (guitarClarityEQ) guitarClarityEQ.gain.value = (v - 5) * 2;
});

guitarBassSlider.addEventListener('input', () => {
  const v = parseFloat(guitarBassSlider.value);
  guitarBassValue.textContent = v.toFixed(1);
  if (guitarBassEQ) guitarBassEQ.gain.value = (v - 5) * 2;
});

guitarToneSlider.addEventListener('input', () => {
  const v = parseFloat(guitarToneSlider.value);
  guitarToneValue.textContent = v.toFixed(1);
  if (guitarToneEQ) guitarToneEQ.gain.value = (v - 5) * 2;
});

// expose for dsp.settings.js
window.rebuildDSPChain = rebuildDSPChain;
window.updateRouting = updateRouting;
