<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Flicker Noise Art</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: black;
      overflow: hidden;
    }
    canvas {
      display: block;
    }
    #fullscreenBtn {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10;
      background: white;
      border: none;
      padding: 8px 12px;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <button id="fullscreenBtn">Fullscreen</button>
  <canvas id="artCanvas"></canvas>

  <script src="https://cdn.jsdelivr.net/npm/tone"></script>
  <script src="https://cdn.jsdelivr.net/npm/dat.gui"></script>
  <script>
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

    // === Video Setup ===
    const video = document.createElement('video');
    video.autoplay = true;
    video.style.display = 'none';
    document.body.appendChild(video);

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
      })
      .catch(err => {
        console.error("Camera access denied:", err);
      });

    const hiddenCanvas = document.createElement('canvas');
    const hiddenCtx = hiddenCanvas.getContext('2d');

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

    // Synth path
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
      cameraInput: true,
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
    gui.add(controls, 'pixelFlicker').onChange(state => {
      if (state) animate();
      else cancelAnimationFrame(animationFrame);
    });
    gui.add(controls, 'synthOn').onChange(on => {
      synthEnabled = on;
    });
    gui.add(controls, 'pixelSize', 2, 50).step(1).onChange(v => pixelSize = v);
    gui.add(controls, 'colorMode').onChange(v => colorMode = v);
    gui.add(controls, 'cameraInput');
    gui.add(controls, 'delayTime', 0, 1).onChange(val => noiseFX.delay.delayTime.value = val);
    gui.add(controls, 'reverbDecay', 0.1, 10).onChange(val => noiseFX.reverb.decay = val);
    gui.add(controls, 'distortionAmount', 0, 1).onChange(val => noiseFX.distortion.distortion = val);
    gui.add(controls, 'chorusDepth', 0, 1).onChange(val => noiseFX.chorus.depth = val);

    // === Animation ===
    function drawPixels() {
      ctx.clearRect(0, 0, w, h);

      if (controls.cameraInput) {
        hiddenCanvas.width = w;
        hiddenCanvas.height = h;
        hiddenCtx.drawImage(video, 0, 0, w, h);
        let frame = hiddenCtx.getImageData(0, 0, w, h).data;

        for (let x = 0; x < w; x += pixelSize) {
          for (let y = 0; y < h; y += pixelSize) {
            const i = ((y * w) + x) * 4;
            let r = frame[i];
            let g = frame[i + 1];
            let b = frame[i + 2];

            if (!colorMode) {
              let gray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = g = b = gray;
            }

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
        }
      } else {
        for (let x = 0; x < w; x += pixelSize) {
          for (let y = 0; y < h; y += pixelSize) {
            let r = rand(256);
            let g = rand(256);
            let b = rand(256);

            if (!colorMode) {
              let gray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = g = b = gray;
            }

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
        }
      }
    }

    function animate() {
      drawPixels();
      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    // === Utility ===
    function rand(max) {
      return Math.floor(Math.random() * max);
    }

    // === Keyboard Synth ===
    document.addEventListener('keydown', (e) => {
      if (!synthEnabled) return;

      const keys = {
        'a': 'C4', 's': 'D4', 'd': 'E4',
        'f': 'F4', 'g': 'G4', 'h': 'A4',
        'j': 'B4', 'k': 'C5'
      };

      const note = keys[e.key];
      if (note) {
        synth.triggerAttackRelease(note, '8n');
        drawPixels(); // trigger pixel change
      }
    });
  </script>
</body>
</html>
