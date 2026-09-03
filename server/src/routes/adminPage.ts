import { Router } from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const htmlPath = resolve(import.meta.dirname ?? '.', '../../public/admin/admin.html');
    const html = readFileSync(htmlPath, 'utf-8');
    res.type('html').send(html);
  } catch {
    res.type('html').send(`
      <!DOCTYPE html>
      <html>
      <head><title>FarmQuest Admin</title></head>
      <body style="background:#0a0a1a;color:white;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;">
        <div style="text-align:center;">
          <h1 style="color:#00ff88;">🌾 FarmQuest Admin</h1>
          <p style="color:#888;margin-top:16px;">Admin dashboard not available. Check server logs for path errors.</p>
        </div>
      </body>
      </html>
    `);
  }
});

export const adminPageRouter = router;
