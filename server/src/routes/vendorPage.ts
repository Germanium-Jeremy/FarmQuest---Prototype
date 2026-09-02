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
    .result { margin-top: 16px; padding: 16px; border-radius: 8px; font-size: 15px; }
    .valid { background: #1a3a1a; border: 1px solid #00ff88; color: #00ff88; }
    .invalid { background: #3a1a1a; border: 1px solid #ff4444; color: #ff4444; }
    .hidden { display: none; }
    .label { font-size: 14px; color: #888; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>FarmQuest Vendor Portal</h1>
    <div id="login-card" class="card">
      <h2>Vendor Login</h2>
      <div class="label">Username</div>
      <input id="username" type="text" placeholder="Enter username" />
      <div class="label">Password</div>
      <input id="password" type="password" placeholder="Enter password" />
      <button onclick="doLogin()">Login</button>
    </div>
    <div id="portal-card" class="card hidden">
      <h2>Validate Coupon</h2>
      <div id="vendor-info" style="color:#888;font-size:14px;margin-bottom:12px;"></div>
      <div class="label">Coupon Code</div>
      <input id="coupon-code" type="text" placeholder="FQ-XXXXXXXX" style="text-transform:uppercase;letter-spacing:2px;font-size:20px;font-weight:bold;" />
      <button onclick="validateCoupon()">Check Coupon</button>
      <div id="coupon-result" class="result hidden"></div>
      <button id="redeem-btn" class="hidden" style="margin-top:12px;background:#ff8800;" onclick="redeemCoupon()">Redeem Coupon</button>
    </div>
  </div>
  <script>
    let token = '';
    let lastCoupon = null;
    async function doLogin() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        const res = await fetch('/api/vendor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
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
          resultEl.innerHTML = '<strong>Valid Coupon</strong><br>Player: ' + data.playerName + '<br>Reward: ' + data.rewardType + '<br>Status: ' + data.status;
          lastCoupon = code;
          document.getElementById('redeem-btn').classList.remove('hidden');
        } else {
          resultEl.className = 'result invalid';
          resultEl.innerHTML = '<strong>' + (data.message || 'Invalid coupon') + '</strong>';
          lastCoupon = null;
          document.getElementById('redeem-btn').classList.add('hidden');
        }
      } catch (e) { alert('Validation failed. Please try again.'); }
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
          resultEl.innerHTML = '<strong>Coupon Redeemed!</strong><br>Player: ' + data.playerName + '<br>Reward: ' + data.rewardType;
        } else {
          resultEl.className = 'result invalid';
          resultEl.innerHTML = '<strong>' + (data.message || 'Redemption failed') + '</strong>';
        }
        document.getElementById('redeem-btn').classList.add('hidden');
        lastCoupon = null;
      } catch (e) { alert('Redemption failed. Please try again.'); }
    }
  </script>
</body>
</html>`);
});

export const vendorPageRouter = router;
