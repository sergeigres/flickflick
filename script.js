// Canvas setup
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');
let w, h;
let pixelSize = 10;
let colorMode = true;
let pixelsMoving = true;
let animationFrame;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Fullscreen button
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Audio setup
const synth = new Tone.Synth({ oscillator: { type: 'sawtooth' } }).toDestination();
let synthEnabled = true; // always on for simplicity

// Draw flickering pixels
function drawPixels() {
  for (let x = 0; x < w; x += pixelSize) {
    for (let y = 0; y < h; y += pixelSize) {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const gray = Math.floor((r + g + b) / 3);
      const color = colorMode
        ? `rgb(${r},${g},${b})`
        : `rgb(${gray},${gray},${gray})`;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}

function animate() {
  if (!pixelsMoving) return;
  drawPixels();
  animationFrame = requestAnimationFrame(animate);
}
animate();

// Keyboard synth notes
document.addEventListener('keydown', (e) => {
  if (!synthEnabled) return;
  const keys = {
    'a': 'C2', 'w': 'Db2', 's': 'D2', 'e': 'Eb2', 'd': 'E2',
    'f': 'F2', 't': 'Gb2', 'g': 'G2', 'y': 'Ab2', 'h': 'A2',
    'u': 'Bb2', 'j': 'B2', 'k': 'C3'
  };
  const note = keys[e.key];
  if (note) {
    synth.triggerAttackRelease(note, '8n');
    drawPixels(); // refresh pixels on note
  }
});
