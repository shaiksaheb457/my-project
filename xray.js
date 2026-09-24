(() => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const startBtn = document.getElementById('startBtn');
  const scanBtn = document.getElementById('scanBtn');
  const autoToggle = document.getElementById('autoToggle');
  const sweepLine = document.getElementById('sweepLine');
  const scanCaption = document.getElementById('scanCaption');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const itemList = document.getElementById('itemList');
  const subjectId = document.getElementById('subjectId');
  const scanTime = document.getElementById('scanTime');
  const threatLevel = document.getElementById('threatLevel');

  let stream = null;
  let running = false;
  let scanning = false;
  let baseline = null;       // average luminance of empty frame
  let presentStreak = 0;
  let cooldownUntil = 0;
  let rafId = null;
  let scanCount = 0;

  // Illustrative item pool. Purely simulated — a webcam cannot detect real metal.
  const ITEM_POOL = [
    { name: 'Smartphone', metal: 'Aluminum / Lithium cell', risk: 'low', locations: ['Front pocket', 'Jacket pocket'] },
    { name: 'Keys / Keyring', metal: 'Steel alloy', risk: 'low', locations: ['Pocket', 'Belt clip'] },
    { name: 'Coins', metal: 'Copper-nickel', risk: 'low', locations: ['Pocket'] },
    { name: 'Belt buckle', metal: 'Steel', risk: 'low', locations: ['Waist'] },
    { name: 'Wristwatch', metal: 'Stainless steel', risk: 'low', locations: ['Left wrist'] },
    { name: 'Wallet clip', metal: 'Steel', risk: 'low', locations: ['Back pocket'] },
    { name: 'Earbuds case', metal: 'Aluminum', risk: 'low', locations: ['Pocket'] },
    { name: 'Pocketknife', metal: 'Carbon steel', risk: 'medium', locations: ['Pocket', 'Waistband'] },
    { name: 'Multi-tool', metal: 'Stainless steel', risk: 'medium', locations: ['Belt', 'Bag'] },
    { name: 'Metal pen', metal: 'Steel', risk: 'low', locations: ['Shirt pocket'] },
    { name: 'Laptop', metal: 'Aluminum chassis', risk: 'low', locations: ['Backpack'] },
    { name: 'Unidentified dense object', metal: 'Ferrous alloy', risk: 'high', locations: ['Jacket lining'] },
  ];

  function setStatus(mode, text) {
    statusDot.className = 'dot ' + mode;
    statusText.textContent = text;
  }

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      running = true;
      startBtn.textContent = 'Camera Running';
      startBtn.disabled = true;
      scanBtn.disabled = false;
      setStatus('warn', 'Calibrating baseline…');
      scanCaption.textContent = 'Calibrating — please step out of frame';

      calibrate();
      loop();
    } catch (err) {
      setStatus('alert', 'Camera access denied');
      scanCaption.textContent = 'Could not access camera: ' + err.message;
    }
  }

  function frameLuminance() {
    const w = canvas.width, h = canvas.height;
    const region = ctx.getImageData(Math.floor(w * 0.3), Math.floor(h * 0.1), Math.floor(w * 0.4), Math.floor(h * 0.8));
    const data = region.data;
    let sum = 0;
    const step = 16; // sample sparsely for performance
    let count = 0;
    for (let i = 0; i < data.length; i += step) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      count++;
    }
    return sum / count;
  }

  function calibrate() {
    setTimeout(() => {
      if (!running) return;
      baseline = frameLuminance();
      setStatus('live', 'Live — awaiting subject');
      scanCaption.textContent = 'Step into the frame to begin scan';
    }, 1800);
  }

  function drawXrayFrame() {
    const w = canvas.width, h = canvas.height;
    ctx.filter = 'grayscale(1) invert(1) contrast(1.6) brightness(1.15)';
    ctx.drawImage(video, 0, 0, w, h);
    ctx.filter = 'none';

    // cyan tint overlay to sell the "x-ray" look
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(120, 220, 230, 0.9)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(0, 40, 45, 0.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop() {
    if (!running) return;
    // mirror the feed like a mirror-selfie view
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    drawXrayFrame();
    ctx.restore();

    checkPresence();
    rafId = requestAnimationFrame(loop);
  }

  function checkPresence() {
    if (baseline === null || scanning) return;
    const lum = frameLuminance();
    const delta = Math.abs(lum - baseline);
    const now = performance.now();

    if (delta > 14) {
      presentStreak++;
    } else {
      presentStreak = Math.max(0, presentStreak - 1);
    }

    if (presentStreak > 12 && now > cooldownUntil) {
      if (autoToggle.checked) {
        runScan();
      } else {
        setStatus('warn', 'Subject detected — manual scan ready');
        scanCaption.textContent = 'Subject detected. Press "Run Manual Scan"';
      }
    } else if (presentStreak <= 3 && !scanning) {
      setStatus('live', 'Live — awaiting subject');
      scanCaption.textContent = 'Step into the frame to begin scan';
    }
  }

  function runScan() {
    if (scanning || !running) return;
    scanning = true;
    scanCount++;
    cooldownUntil = performance.now() + 6000;

    setStatus('warn', 'Scanning…');
    scanCaption.textContent = 'Scanning in progress — hold still';
    sweepLine.classList.add('active');
    scanBtn.disabled = true;

    setTimeout(() => {
      sweepLine.classList.remove('active');
      scanBtn.disabled = false;
      scanning = false;
      presentStreak = 0;
      renderResults();
      setStatus('live', 'Scan complete');
      scanCaption.textContent = 'Scan complete — step away to reset';
    }, 2600);
  }

  function renderResults() {
    const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5);
    const count = 1 + Math.floor(Math.random() * 4);
    const found = shuffled.slice(0, count);

    itemList.innerHTML = '';
    if (found.length === 0) {
      itemList.innerHTML = '<li class="empty-state">No metallic objects detected.</li>';
    } else {
      found.forEach(item => {
        const loc = item.locations[Math.floor(Math.random() * item.locations.length)];
        const confidence = (78 + Math.random() * 20).toFixed(1);
        const li = document.createElement('li');
        li.className = 'item-row ' + item.risk;
        li.innerHTML = `
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-loc">${loc} · ${item.metal}</div>
          </div>
          <div class="item-conf">${confidence}%</div>
        `;
        itemList.appendChild(li);
      });
    }

    const overallRisk = found.some(i => i.risk === 'high') ? 'high'
      : found.some(i => i.risk === 'medium') ? 'medium'
      : 'low';

    threatLevel.textContent = overallRisk.toUpperCase();
    threatLevel.className = overallRisk;
    subjectId.textContent = 'SUBJ-' + String(scanCount).padStart(4, '0');
    scanTime.textContent = new Date().toLocaleTimeString();
  }

  startBtn.addEventListener('click', startCamera);
  scanBtn.addEventListener('click', runScan);

  window.addEventListener('beforeunload', () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
  });
})();
