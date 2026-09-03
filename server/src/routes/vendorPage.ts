import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FarmQuest Vendor Portal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0a0a1a; color: #e0e0e0; min-height: 100vh; }
    .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #00ff88; font-size: 32px; margin-bottom: 24px; }
    .card { background: #1a1a2e; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #333; }
    .card h2 { color: #00ff88; font-size: 18px; margin-bottom: 16px; }
    input { width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid #444; background: #0d0d1a; color: white; font-size: 16px; margin-bottom: 12px; }
    input:focus { outline: none; border-color: #00ff88; }
    button { padding: 12px 24px; border: none; border-radius: 8px; background: #00ff88; color: #0a0a1a; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; }
    button:hover { background: #00cc6a; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .result { margin-top: 16px; padding: 16px; border-radius: 8px; font-size: 15px; }
    .valid { background: #1a3a1a; border: 1px solid #00ff88; color: #00ff88; }
    .invalid { background: #3a1a1a; border: 1px solid #ff4444; color: #ff4444; }
    .warning { background: #3a3a1a; border: 1px solid #ffaa00; color: #ffaa00; }
    .hidden { display: none; }
    .label { font-size: 14px; color: #888; margin-bottom: 4px; }
    .tab-bar { display: flex; gap: 8px; margin-bottom: 16px; }
    .tab { padding: 8px 16px; border-radius: 8px; background: #0d0d1a; border: 1px solid #333; color: #888; cursor: pointer; font-size: 14px; }
    .tab.active { border-color: #00ff88; color: #00ff88; background: #1a2e1a; }
    #camera-video { width: 100%; border-radius: 8px; margin-bottom: 12px; display: none; }
    #camera-canvas { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌾 FarmQuest Vendor Portal</h1>
    <div id="login-card" class="card">
      <h2>Vendor Login</h2>
      <div class="label">Username</div>
      <input id="username" type="text" placeholder="Enter username" autocomplete="username" />
      <div class="label">Password</div>
      <input id="password" type="password" placeholder="Enter password" autocomplete="current-password" />
      <div id="login-error" class="hidden" style="color:#ff4444;margin-bottom:12px;font-size:14px;"></div>
      <button onclick="doLogin()">Login</button>
    </div>
    <div id="portal-card" class="card hidden">
      <h2>Redeem Coupon</h2>
      <div id="vendor-info" style="color:#888;font-size:14px;margin-bottom:12px;"></div>

      <div class="tab-bar">
        <div class="tab active" id="tab-scan" onclick="showTab('scan')">📷 Scan QR</div>
        <div class="tab" id="tab-manual" onclick="showTab('manual')">⌨️ Enter Code</div>
      </div>

      <!-- Camera QR Scan -->
      <div id="scan-panel">
        <video id="camera-video" autoplay playsinline></video>
        <canvas id="camera-canvas"></canvas>
        <button id="scan-btn" onclick="startScanning()">📷 Start Camera & Scan</button>
        <button id="stop-btn" class="hidden" onclick="stopScanning()" style="background:#ff4444;margin-top:8px;">⏹ Stop Camera</button>
        <div id="scan-status" class="hidden" style="margin-top:8px;font-size:14px;color:#888;"></div>
      </div>

      <!-- Manual Code Entry -->
      <div id="manual-panel" class="hidden">
        <div class="label">Coupon Code</div>
        <input id="coupon-code" type="text" placeholder="FQ-XXXXXXXX" style="text-transform:uppercase;letter-spacing:2px;font-size:20px;font-weight:bold;" maxlength="10" />
        <button onclick="validateCoupon()">Check Coupon</button>
      </div>

      <div id="coupon-result" class="result hidden"></div>
      <button id="redeem-btn" class="hidden" style="margin-top:12px;background:#ff8800;" onclick="redeemCoupon()">Redeem Coupon</button>
    </div>
  </div>
  <script>
    let token = '';
    let lastCoupon = null;
    let videoStream = null;
    let scanInterval = null;

    function showTab(tab) {
      document.getElementById('tab-scan').className = 'tab' + (tab === 'scan' ? ' active' : '');
      document.getElementById('tab-manual').className = 'tab' + (tab === 'manual' ? ' active' : '');
      document.getElementById('scan-panel').className = tab === 'scan' ? '' : 'hidden';
      document.getElementById('manual-panel').className = tab === 'manual' ? '' : 'hidden';
      if (tab !== 'scan') stopScanning();
    }

    async function doLogin() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errEl = document.getElementById('login-error');
      errEl.className = 'hidden';
      try {
        const res = await fetch('/api/vendor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) { errEl.className = ''; errEl.textContent = data.message || 'Login failed'; return; }
        token = data.token;
        document.getElementById('login-card').classList.add('hidden');
        document.getElementById('portal-card').classList.remove('hidden');
        document.getElementById('vendor-info').textContent = 'Logged in as: ' + data.locationName;
      } catch (e) { errEl.className = ''; errEl.textContent = 'Login failed. Please try again.'; }
    }

    async function startScanning() {
      const statusEl = document.getElementById('scan-status');
      const video = document.getElementById('camera-video');
      const scanBtn = document.getElementById('scan-btn');
      const stopBtn = document.getElementById('stop-btn');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusEl.className = '';
        statusEl.innerHTML = '<span style="color:#ffaa00;">Camera not supported on this device. Use the "Enter Code" tab.</span>';
        return;
      }

      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        video.srcObject = videoStream;
        video.style.display = 'block';
        scanBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        statusEl.className = '';
        statusEl.textContent = 'Point camera at a QR code...';

        // Simple QR detection using BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
          const detector = new BarcodeDetector({ formats: ['qr_code'] });
          scanInterval = setInterval(async () => {
            if (video.readyState >= 2) {
              try {
                const barcodes = await detector.detect(video);
                if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  if (/^FQ-[A-Z0-9]{6}$/.test(code)) {
                    stopScanning();
                    document.getElementById('coupon-code').value = code;
                    await scanRedeem(code);
                  }
                }
              } catch (e) { /* ignore detection errors */ }
            }
          }, 500);
        } else {
          statusEl.innerHTML = '<span style="color:#ffaa00;">QR scanning not supported in this browser. Use the "Enter Code" tab.</span>';
        }
      } catch (e) {
        statusEl.className = '';
        statusEl.innerHTML = '<span style="color:#ff4444;">Camera access denied or unavailable. Use the "Enter Code" tab.</span>';
      }
    }

    function stopScanning() {
      if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        videoStream = null;
      }
      const video = document.getElementById('camera-video');
      video.style.display = 'none';
      video.srcObject = null;
      document.getElementById('scan-btn').classList.remove('hidden');
      document.getElementById('stop-btn').classList.add('hidden');
      document.getElementById('scan-status').className = 'hidden';
    }

    async function scanRedeem(code) {
      try {
        const res = await fetch('/api/vendor/scan-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        const resultEl = document.getElementById('coupon-result');
        resultEl.classList.remove('hidden');
        if (data.valid && data.redeemed) {
          resultEl.className = 'result valid';
          resultEl.innerHTML = '<strong>✅ Coupon Redeemed!</strong><br>Player: ' + data.playerName + '<br>Reward: ' + data.rewardType;
        } else {
          resultEl.className = 'result invalid';
          resultEl.innerHTML = '<strong>' + (data.message || 'Invalid coupon') + '</strong>';
        }
        document.getElementById('redeem-btn').classList.add('hidden');
        lastCoupon = null;
      } catch (e) {
        document.getElementById('coupon-result').className = 'result invalid';
        document.getElementById('coupon-result').innerHTML = '<strong>Scan failed. Please try again.</strong>';
      }
    }

    async function validateCoupon() {
      const code = document.getElementById('coupon-code').value.trim().toUpperCase();
      if (!code) return;
      try {
        const res = await fetch('/api/vendor/validate-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        const resultEl = document.getElementById('coupon-result');
        resultEl.classList.remove('hidden');
        if (data.valid) {
          resultEl.className = 'result valid';
          resultEl.innerHTML = '<strong>Valid Coupon</strong><br>Player: ' + data.playerName + '<br>Reward: ' + data.rewardType + '<br>Status: ' + data.status;
          lastCoupon = code;
          document.getElementById('redeem-btn').classList.remove('hidden');
        } else {
          resultEl.className = 'result invalid';
          resultEl.innerHTML = '<strong>' + (data.message || 'Invalid coupon') + '</strong>';
          lastCoupon = null;
          document.getElementById('redeem-btn').classList.add('hidden');
        }
      } catch (e) {
        document.getElementById('coupon-result').className = 'result invalid';
        document.getElementById('coupon-result').innerHTML = '<strong>Validation failed. Please try again.</strong>';
      }
    }

    async function redeemCoupon() {
      if (!lastCoupon) return;
      try {
        const res = await fetch('/api/vendor/redeem-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ code: lastCoupon }),
        });
        const data = await res.json();
        const resultEl = document.getElementById('coupon-result');
        if (data.redeemed) {
          resultEl.className = 'result valid';
          resultEl.innerHTML = '<strong>✅ Coupon Redeemed!</strong><br>Player: ' + data.playerName + '<br>Reward: ' + data.rewardType;
        } else {
          resultEl.className = 'result invalid';
          resultEl.innerHTML = '<strong>' + (data.message || 'Redemption failed') + '</strong>';
        }
        document.getElementById('redeem-btn').classList.add('hidden');
        lastCoupon = null;
      } catch (e) {
        document.getElementById('coupon-result').className = 'result invalid';
        document.getElementById('coupon-result').innerHTML = '<strong>Redemption failed. Please try again.</strong>';
      }
    }

    // Stop camera when page is unloaded
    window.addEventListener('beforeunload', stopScanning);
    window.addEventListener('pagehide', stopScanning);
  </script>
</body>
</html>`);
});

export const vendorPageRouter = router;
