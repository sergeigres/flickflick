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

// === Video Input ===
const video = document.createElement('video');
video.autoplay = true;
video.style.display = 'none';
document.body.appendChild(video);

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => { console.error("Camera access denied:", err); });

const hiddenCanvas = document.createElement('canvas');
const hiddenCtx = hiddenCanvas.getContext('2d');

// === Fullscreen Button ===
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});

// === Audio Unlock (Mobile) ===
document.body.addEventListener('click', () => { Tone.start(); }, { once: true });

// === Tone.js Setup ===
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
  pixelFlicker: true,
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
gui.add(controls, 'noiseOn').onChange(on => { noise.mute = !on; });
gui.add(controls, 'pixelFlicker').onChange(state => {
  if (state) animate();
  else cancelAnimationFrame(animationFrame);
});
gui.add(controls, 'synthOn').onChange(on => { synthEnabled = on; });
gui.add(controls, 'pixelSize', 2, 50).step(1).onChange(v => pixelSize = v);
gui.add(controls, 'colorMode').onChange(v => colorMode = v);
gui.add(controls, 'delayTime', 0, 1).onChange(val => noiseFX.delay.delayTime.value = val);
gui.add(controls, 'reverbDecay', 0.1, 10).onChange(val => noiseFX.reverb.decay = val);
gui.add(controls, 'distortionAmount', 0, 1).onChange(val => noiseFX.distortion.distortion = val);
gui.add(controls, 'chorusDepth', 0, 1).onChange(val => noiseFX.chorus.depth = val);

// === Draw Pixels from Video
function drawPixels() {
  hiddenCanvas.width = w;
  hiddenCanvas.height = h;
  hiddenCtx.drawImage(video, 0, 0, w, h);
  const frame = hiddenCtx.getImageData(0, 0, w, h).data;

  for (let x = 0; x < w; x += pixelSize) {
    for (let y = 0; y < h; y += pixelSize) {
      const i = ((y * w) + x) * 4;
      let r = frame[i], g = frame[i + 1], b = frame[i + 2];

      if (!colorMode) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}

function animate() {
  drawPixels();
  animationFrame = requestAnimationFrame(animate);
}
animate();

// === Synth Keyboard Input
document.addEventListener('keydown', (e) => {
  if (!synthEnabled) return;

  const keys = {
    'a': 'C2', 's': 'D2', 'd': 'E2',
    'f': 'F2', 'g': 'G2', 'h': 'A2',
    'j': 'B2', 'k': 'C3'
  };

  const note = keys[e.key];
  if (note) {
    synth.triggerAttackRelease(note, '8n');
    drawPixels(); // redraw on note
  }
});
