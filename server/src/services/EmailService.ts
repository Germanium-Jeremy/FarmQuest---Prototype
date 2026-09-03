import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getActiveCollaborators } from "../storage/database.js";
import { CollaboratorRow } from "../types/index.js";

export interface CouponEmailOptions {
  to: string;
  couponCode: string;
  rewardName: string;
  score: number;
}

export interface EmailService {
  sendCouponEmail(options: CouponEmailOptions): Promise<void>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol)) return url;
  } catch {
    // invalid URL
  }
  return "";
}

export class DevelopmentEmailService implements EmailService {
  async sendCouponEmail(options: CouponEmailOptions): Promise<void> {
    let qrHtml = "";
    try {
      const dataUri = await QRCode.toDataURL(options.couponCode, {
        width: 150,
        margin: 2,
        color: { dark: "#173320", light: "#ffffff" },
      });
      qrHtml = `\nQR Code: ${dataUri}\n`;
    } catch {
      // QR generation failed, skip
    }

    console.info(`
EMAIL WOULD BE SENT
To: ${options.to}
Subject: Your FarmQuest Reward

Congratulations! You completed FarmQuest.
Score: ${options.score} points
Reward: ${options.rewardName}
Coupon Code: ${options.couponCode}
${qrHtml}
Present this code when claiming your reward.
`);
  }
}

export class SmtpEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
    if (!user || !pass)
      throw new Error("SMTP_PROVIDER requires SMTP_USER and SMTP_PASS.");

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: (process.env.SMTP_SECURE ?? "true") === "true",
      auth: { user, pass },
    });
  }

  async sendCouponEmail(options: CouponEmailOptions): Promise<void> {
    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;

    // Generate QR code as buffer
    let qrBuffer: Buffer | null = null;
    try {
      qrBuffer = await QRCode.toBuffer(options.couponCode, {
        width: 200,
        margin: 2,
        color: { dark: "#173320", light: "#ffffff" },
      });
    } catch {
      // Skip QR if generation fails
    }

    const qrCid = "qr-code@farmquest";

    // Get active collaborators for footer
    const collaborators = getActiveCollaborators();

    // Build attachments array (QR + logos)
    const attachments: nodemailer.SendMailOptions["attachments"] = [];
    if (qrBuffer) {
      attachments.push({
        filename: "qr-code.png",
        content: qrBuffer,
        contentType: "image/png",
        cid: qrCid,
        contentDisposition: "inline",
      });
    }

    const logoCids: Array<{ name: string; cid: string }> = [];
    for (const collab of collaborators) {
      if (collab.logo_cid && collab.logo_path) {
        const logoCid = `${collab.logo_cid}`;
        logoCids.push({ name: collab.company_name, cid: logoCid });
        // Note: In production, read the actual file. For now we reference by CID.
        // The upload system should store logos at UPLOAD_DIR/collab.logo_path
      }
    }

    // Build plain-text alternative
    const textParts = [
      "Congratulations!",
      "",
      "You completed FarmQuest!",
      "",
      `Your score: ${options.score.toLocaleString()} points`,
      `Your reward: ${options.rewardName}`,
      "",
      `Coupon Code: ${options.couponCode}`,
      "",
      "Present this code when claiming your reward.",
      "",
    ];

    // Add collaborators to plain text
    if (collaborators.length > 0) {
      textParts.push("---");
      textParts.push("Our collaborators:");
      for (const c of collaborators) {
        const url = c.url ? sanitizeUrl(c.url) : "";
        textParts.push(`- ${c.company_name}${url ? ` (${url})` : ""}`);
      }
      textParts.push("");
    }

    textParts.push("Thank you for playing FarmQuest!");

    // Build responsive HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:20px;">
    <!-- FarmQuest Content -->
    <div style="background:#ffffff;border-radius:16px;padding:32px 28px;text-align:center;">
      <h1 style="color:#2d6a1e;font-size:28px;margin:0 0 8px;">🎉 Congratulations!</h1>
      <p style="color:#193620;font-size:17px;margin:0 0 20px;">You completed FarmQuest and earned a reward!</p>

      <div style="background:#f8fdf6;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#193620;font-size:16px;margin:0 0 8px;"><strong>Your score:</strong> ${options.score.toLocaleString()} points</p>
        <p style="color:#193620;font-size:16px;margin:0;"><strong>Your reward:</strong> ${escapeHtml(options.rewardName)}</p>
      </div>

      <!-- QR Code and Coupon -->
      <div style="margin:24px 0;">
        ${qrBuffer ? `<img src="cid:${qrCid}" alt="QR Code for ${escapeHtml(options.couponCode)}" style="width:160px;height:160px;border-radius:8px;border:2px solid #e0e0e0;">` : ''}
        <div style="margin-top:16px;">
          <div style="display:inline-block;padding:14px 24px;background:#f4df9b;border-radius:10px;font-size:22px;font-weight:bold;letter-spacing:3px;color:#193620;">
            ${escapeHtml(options.couponCode)}
          </div>
        </div>
        <p style="color:#666;font-size:14px;margin-top:12px;">Present this code or QR when claiming your reward.</p>
      </div>
    </div>

    <!-- Collaborator Footer -->
    ${collaborators.length > 0 ? `
    <div style="margin-top:24px;padding:20px;background:#ffffff;border-radius:12px;text-align:center;">
      <p style="color:#888;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Our Partners</p>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;">
        ${collaborators.map(c => {
          const logoTag = c.logo_cid
            ? `<img src="cid:${c.logo_cid}" alt="${escapeHtml(c.company_name)}" style="height:32px;max-width:100px;object-fit:contain;">`
            : `<span style="font-size:14px;font-weight:bold;color:#193620;">${escapeHtml(c.company_name)}</span>`;
          const linkOpen = c.url ? `<a href="${escapeHtml(sanitizeUrl(c.url))}" target="_blank" style="text-decoration:none;">` : '';
          const linkClose = c.url ? '</a>' : '';
          return `<div style="text-align:center;">${linkOpen}<div style="padding:8px 12px;background:#f8fdf6;border-radius:8px;border:1px solid #e8f0e8;">${logoTag}</div>${linkClose}<p style="font-size:12px;color:#888;margin:4px 0 0;">${escapeHtml(c.company_name)}</p>${c.contacts ? `<p style="font-size:11px;color:#aaa;margin:2px 0 0;">${escapeHtml(c.contacts)}</p>` : ''}</div>`;
        }).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Thank You -->
    <div style="text-align:center;padding:16px 0;">
      <p style="color:#888;font-size:13px;">Thank you for playing FarmQuest!</p>
    </div>
  </div>
</body>
</html>`;

    const attachmentsList: nodemailer.SendMailOptions["attachments"] = [
      ...(qrBuffer
        ? [
            {
              filename: "qr-code.png",
              content: qrBuffer,
              contentType: "image/png",
              cid: qrCid,
              contentDisposition: "inline" as const,
            },
          ]
        : []),
    ];

    // Add collaborator logo attachments
    for (const collab of collaborators) {
      if (collab.logo_cid && collab.logo_path) {
        const logoPath = resolve(
          process.env.UPLOAD_DIR ?? "./uploads",
          collab.logo_path,
        );
        try {
          const logoContent = readFileSync(logoPath);
          attachmentsList.push({
            filename: collab.logo_path,
            content: logoContent,
            contentType: "image/png",
            cid: collab.logo_cid,
            contentDisposition: "inline",
          });
        } catch {
          // Logo file not found, skip attachment
        }
      }
    }

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: "Your FarmQuest Reward 🎁",
      text: textParts.join("\n"),
      html,
      attachments: attachmentsList,
    });
  }
}

export const createEmailService = (): EmailService => {
  if (process.env.EMAIL_PROVIDER === "smtp") {
    return new SmtpEmailService();
  }
  return new DevelopmentEmailService();
};
