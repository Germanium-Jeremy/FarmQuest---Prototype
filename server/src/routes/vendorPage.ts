import { Router } from 'express';

<<<<<<< HEAD
const router = Router();

router.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
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
    button:disabled { background: #444; color: #888; cursor: not-allowed; }
    .result { margin-top: 16px; padding: 16px; border-radius: 8px; font-size: 15px; }
    .valid { background: #1a3a1a; border: 1px solid #00ff88; color: #00ff88; }
    .invalid { background: #3a1a1a; border: 1px solid #ff4444; color: #ff4444; }
    .hidden { display: none; }
    .label { font-size: 14px; color: #888; margin-bottom: 4px; }
=======
export const vendorPageRouter = Router();

vendorPageRouter.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FarmQuest — Vendor Portal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #f0f5e9;
      color: #173320;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 480px;
      width: 100%;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      padding: 2rem;
    }
    h1 {
      font-size: 1.6rem;
      margin-bottom: 0.5rem;
      color: #2d6a1e;
    }
    .subtitle {
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.3rem;
      font-size: 0.85rem;
    }
    input {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 2px solid #c8dfc0;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #2d6a1e; }
    button {
      width: 100%;
      padding: 0.8rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary {
      background: #2d6a1e;
      color: #fff;
    }
    .btn-primary:hover { background: #245717; }
    .btn-primary:disabled { background: #aaa; cursor: not-allowed; }
    .btn-secondary {
      background: #e8f0e4;
      color: #2d6a1e;
      margin-top: 0.5rem;
    }
    .btn-secondary:hover { background: #d4e6cd; }
    .btn-danger {
      background: #c0392b;
      color: #fff;
      margin-top: 0.5rem;
    }
    .btn-danger:hover { background: #a93226; }
    .result {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 10px;
      font-size: 0.95rem;
      line-height: 1.6;
      display: none;
    }
    .result.valid { background: #e8f5e1; border: 2px solid #2d6a1e; }
    .result.invalid { background: #fde8e8; border: 2px solid #c0392b; }
    .result.redeemed { background: #fff3cd; border: 2px solid #f0ad4e; }
    .result h3 { margin-bottom: 0.3rem; }
    .hidden { display: none !important; }
    .location-badge {
      display: inline-block;
      background: #e8f0e4;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  </style>
</head>
<body>
  <div class="container">
<<<<<<< HEAD
    <h1>🌾 FarmQuest Vendor Portal</h1>

    <div id="login-card" class="card">
      <h2>Vendor Login</h2>
      <div class="label">Username</div>
      <input id="username" type="text" placeholder="Enter username" />
      <div class="label">Password</div>
      <input id="password" type="password" placeholder="Enter password" />
      <button id="login-btn" onclick="doLogin()">Login</button>
    </div>

    <div id="portal-card" class="card hidden">
      <h2>Validate Coupon</h2>
      <div id="vendor-info" style="color:#888;font-size:14px;margin-bottom:12px;"></div>
      <div class="label">Coupon Code</div>
      <input id="coupon-code" type="text" placeholder="FQ-XXXXXXXX" style="text-transform:uppercase;letter-spacing:2px;font-size:20px;font-weight:bold;" />
      <button onclick="validateCoupon()">Check Coupon</button>
      <div id="coupon-result" class="result hidden"></div>
      <button id="redeem-btn" class="hidden" style="margin-top:12px;background:#ff8800;" onclick="redeemCoupon()">Redeem Coupon</button>
=======
    <!-- Login form -->
    <div id="login-form">
      <h1>🌾 FarmQuest Vendor Portal</h1>
      <p class="subtitle">Log in to validate and redeem player coupons.</p>
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="username" placeholder="Enter username" autocomplete="username">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="password" placeholder="Enter password" autocomplete="current-password">
      </div>
      <button class="btn-primary" id="login-btn" onclick="doLogin()">Log In</button>
      <div id="login-error" style="color:#c0392b;margin-top:0.5rem;font-size:0.85rem;"></div>
    </div>

    <!-- Coupon form (hidden initially) -->
    <div id="coupon-section" class="hidden">
      <h1>🌾 Coupon Validation</h1>
      <p class="subtitle">Scan or enter a player's coupon code.</p>
      <div class="location-badge" id="location-badge"></div>

      <div class="form-group">
        <label>Coupon Code</label>
        <input type="text" id="coupon-code" placeholder="FQ-XXXXXXXX" maxlength="10"
               style="text-transform:uppercase;font-size:1.2rem;font-weight:700;letter-spacing:2px;text-align:center;">
      </div>

      <button class="btn-primary" onclick="validateCoupon()">Validate Coupon</button>
      <button class="btn-danger hidden" id="redeem-btn" onclick="redeemCoupon()">✓ Redeem Coupon</button>

      <div id="coupon-result" class="result"></div>

      <button class="btn-secondary" onclick="doLogout()" style="margin-top:1.5rem;">Log Out</button>
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    </div>
  </div>

  <script>
<<<<<<< HEAD
    let token = '';
    let lastCoupon = null;

    async function doLogin() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
=======
    let token = null;

    async function doLogin() {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const errorEl = document.getElementById('login-error');
      errorEl.textContent = '';

      if (!username || !password) {
        errorEl.textContent = 'Please enter both username and password.';
        return;
      }

>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
      try {
        const res = await fetch('/api/vendor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
<<<<<<< HEAD
        if (!res.ok) { alert(data.message || 'Login failed'); return; }
        token = data.token;
        document.getElementById('login-card').classList.add('hidden');
        document.getElementById('portal-card').classList.remove('hidden');
        document.getElementById('vendor-info').textContent = 'Logged in as: ' + data.locationName;
      } catch (e) { alert('Login failed. Please try again.'); }
    }

    async function validateCoupon() {
      const code = document.getElementById('coupon-code').value.trim().toUpperCase();
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
          resultEl.innerHTML = '<strong>✅ Valid Coupon</strong><br>Player: ' + data.playerName + '<br>Reward: ' + data.rewardType + '<br>Status: ' + data.status;
          lastCoupon = code;
          document.getElementById('redeem-btn').classList.remove('hidden');
        } else {
          resultEl.className = 'result invalid';
          resultEl.innerHTML = '<strong>❌ ' + (data.message || 'Invalid coupon') + '</strong>';
          lastCoupon = null;
          document.getElementById('redeem-btn').classList.add('hidden');
        }
      } catch (e) {
        alert('Validation failed. Please try again.');
=======

        if (!res.ok) {
          errorEl.textContent = data.message || 'Login failed.';
          return;
        }

        token = data.token;
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('coupon-section').classList.remove('hidden');
        document.getElementById('location-badge').textContent = '📍 ' + data.locationName;
      } catch (err) {
        errorEl.textContent = 'Network error. Please try again.';
      }
    }

    async function doLogout() {
      if (token) {
        await fetch('/api/vendor/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
        });
      }
      token = null;
      document.getElementById('login-form').classList.remove('hidden');
      document.getElementById('coupon-section').classList.add('hidden');
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      document.getElementById('coupon-code').value = '';
      document.getElementById('coupon-result').style.display = 'none';
      document.getElementById('redeem-btn').classList.add('hidden');
    }

    let lastValidCode = null;

    async function validateCoupon() {
      const code = document.getElementById('coupon-code').value.trim().toUpperCase();
      const resultEl = document.getElementById('coupon-result');
      const redeemBtn = document.getElementById('redeem-btn');
      lastValidCode = null;
      redeemBtn.classList.add('hidden');

      if (!code) {
        resultEl.className = 'result invalid';
        resultEl.innerHTML = '<h3>❌ Error</h3>Please enter a coupon code.';
        resultEl.style.display = 'block';
        return;
      }

      try {
        const res = await fetch('/api/vendor/validate-coupon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (data.valid) {
          lastValidCode = code;
          resultEl.className = 'result valid';
          resultEl.innerHTML =
            '<h3>✅ Valid Coupon</h3>' +
            '<strong>Code:</strong> ' + data.couponCode + '<br>' +
            '<strong>Reward:</strong> ' + data.rewardType + '<br>' +
            '<strong>Player:</strong> ' + (data.playerName || 'Unknown') + '<br>' +
            '<strong>Status:</strong> ' + data.status;
          redeemBtn.classList.remove('hidden');
        } else {
          resultEl.className = 'result invalid';
          resultEl.innerHTML = '<h3>❌ Invalid</h3>' + data.message;
        }
        resultEl.style.display = 'block';
      } catch {
        resultEl.className = 'result invalid';
        resultEl.innerHTML = '<h3>❌ Error</h3>Network error. Please try again.';
        resultEl.style.display = 'block';
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
      }
    }

    async function redeemCoupon() {
<<<<<<< HEAD
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
          resultEl.innerHTML = '<strong>❌ ' + (data.message || 'Redemption failed') + '</strong>';
        }
        document.getElementById('redeem-btn').classList.add('hidden');
        lastCoupon = null;
      } catch (e) {
        alert('Redemption failed. Please try again.');
      }
    }
=======
      if (!lastValidCode) return;

      const resultEl = document.getElementById('coupon-result');
      const redeemBtn = document.getElementById('redeem-btn');

      try {
        const res = await fetch('/api/vendor/redeem-coupon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({ code: lastValidCode }),
        });
        const data = await res.json();

        if (data.redeemed) {
          resultEl.className = 'result valid';
          resultEl.innerHTML =
            '<h3>🎉 Redeemed!</h3>' +
            '<strong>Reward:</strong> ' + data.rewardType + '<br>' +
            '<strong>Player:</strong> ' + (data.playerName || 'Unknown') + '<br>' +
            '<strong>Code:</strong> ' + data.couponCode + '<br>' +
            '<em>This coupon cannot be used again.</em>';
          redeemBtn.classList.add('hidden');
        } else {
          resultEl.className = 'result redeemed';
          resultEl.innerHTML = '<h3>⚠️ Not Redeemed</h3>' + data.message;
        }
        resultEl.style.display = 'block';
      } catch {
        resultEl.className = 'result invalid';
        resultEl.innerHTML = '<h3>❌ Error</h3>Network error. Please try again.';
        resultEl.style.display = 'block';
      }
    }

    // Enter key support
    document.getElementById('password').addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
    document.getElementById('coupon-code').addEventListener('keydown', e => {
      if (e.key === 'Enter') validateCoupon();
    });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  </script>
</body>
</html>`);
});
<<<<<<< HEAD

export const vendorPageRouter = router;
=======
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
