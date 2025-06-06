// === Canvas Setup ===
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');
let w, h, pixelSize = 10;
let colorMode = true;
let animationFrame;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
}
window.addEventListener('resize', resize);
resize();

// === Fullscreen Button ===
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// === Mobile Audio Unlock ===
document.body.addEventListener('click', () => {
  Tone.start(); // required for mobile audio
}, { once: true });

// === Audio Setup ===
const noiseTypes = ['white', 'pink', 'brown'];
let currentNoise = 'white';
let noise = new Tone.Noise(currentNoise).start();
let noiseGain = new Tone.Gain(0.5).toDestination();
let noiseFX = {
  delay: new Tone.FeedbackDelay("8n", 0.5),
  reverb: new Tone.Reverb(2),
  chorus: new Tone.Chorus(4, 2.5, 0.5),
  distortion: new Tone.Distortion(0.4)
};
noise.chain(noiseFX.delay, noiseFX.reverb, noiseFX.chorus, noiseFX.distortion, noiseGain);
noise.mute = true;

const synth = new Tone.Synth({ oscillator: { type: 'sawtooth' } }).toDestination();
let synthEnabled = false;

// === Controls ===
const gui = new dat.GUI();
const controls = {
  noiseType: currentNoise,
  noiseOn: false,
  synthOn: false,
  pixelSize: 10,
  colorMode: true,
  delayTime: 0.5,
  reverbDecay: 2,
  distortionAmount: 0.4,
  chorusDepth: 0.5
};

gui.add(controls, 'noiseType', noiseTypes).onChange(type => {
  noise.stop();
  noise = new Tone.Noise(type).start();
  noise.chain(noiseFX.delay, noiseFX.reverb, noiseFX.chorus, noiseFX.distortion, noiseGain);
});
gui.add(controls, 'noiseOn').onChange(on => {
  noise.mute = !on;
});
gui.add(controls, 'synthOn').onChange(on => {
  synthEnabled = on;
});
gui.add(controls, 'pixelSize', 2, 50).step(1).onChange(v => pixelSize = v);
gui.add(controls, 'colorMode').onChange(v => colorMode = v);
gui.add(controls, 'delayTime', 0, 1).onChange(val => noiseFX.delay.delayTime.value = val);
gui.add(controls, 'reverbDecay', 0.1, 10).onChange(val => noiseFX.reverb.decay = val);
gui.add(controls, 'distortionAmount', 0, 1).onChange(val => noiseFX.distortion.distortion = val);
gui.add(controls, 'chorusDepth', 0, 1).onChange(val => noiseFX.chorus.depth = val);

// === Animation ===
function drawPixels() {
  for (let x = 0; x < w; x += pixelSize) {
    for (let y = 0; y < h; y += pixelSize) {
      if (colorMode) {
        ctx.fillStyle = `rgb(${rand(255)}, ${rand(255)}, ${rand(255)})`;
      } else {
        let shade = rand(255);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      }
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}

function animate() {
  drawPixels();
  animationFrame = requestAnimationFrame(animate);
}
animate();

const togglePixelsBtn = document.getElementById('togglePixelsBtn');
let pixelsRunning = true;

togglePixelsBtn.addEventListener('click', () => {
  if (pixelsRunning) {
    cancelAnimationFrame(animationFrame);
    togglePixelsBtn.textContent = 'Start Pixels';
  } else {
    animate();
    togglePixelsBtn.textContent = 'Stop Pixels';
  }
  pixelsRunning = !pixelsRunning;
});

// === Drawing Feature ===
let drawing = false;
let lastX, lastY;

function startDraw(x, y) {
  drawing = true;
  lastX = x;
  lastY = y;
}

function drawLine(x, y) {
  if (!drawing) return;
  ctx.strokeStyle = `hsl(${rand(360)}, 100%, 70%)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x;
  lastY = y;
}

function stopDraw() {
  drawing = false;
}

// Desktop (mouse)
canvas.addEventListener('mousedown', e => startDraw(e.offsetX, e.offsetY));
canvas.addEventListener('mousemove', e => drawLine(e.offsetX, e.offsetY));
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseleave', stopDraw);

// Mobile (touch)
canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  startDraw(touch.clientX, touch.clientY);
});
canvas.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  drawLine(touch.clientX, touch.clientY);
});
canvas.addEventListener('touchend', stopDraw);

// === Utility ===
function rand(max) {
  return Math.floor(Math.random() * max);
}

// === Keyboard Synth ===
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
    drawPixels(); // trigger pixel change
  }
});
