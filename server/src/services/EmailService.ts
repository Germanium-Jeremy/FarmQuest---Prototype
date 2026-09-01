import QRCode from 'qrcode';

export interface CouponEmailOptions {
  to: string;
  couponCode: string;
  rewardName: string;
  score: number;
}

export interface EmailService {
  sendCouponEmail(options: CouponEmailOptions): Promise<void>;
}

export class DevelopmentEmailService implements EmailService {
  async sendCouponEmail(options: CouponEmailOptions): Promise<void> {
    // Generate QR code for dev display
    let qrHtml = '';
    try {
      const dataUri = await QRCode.toDataURL(options.couponCode, {
        width: 150,
        margin: 2,
        color: { dark: '#173320', light: '#ffffff' },
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
  private transporter: any;

  constructor() {
    // Lazy import nodemailer to avoid issues if not installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: (process.env.SMTP_SECURE ?? 'true') === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
        },
      });
    } catch {
      console.warn('nodemailer not available, falling back to dev email');
    }
  }

  async sendCouponEmail(options: CouponEmailOptions): Promise<void> {
    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;

    // Generate QR code
    let qrDataUri = '';
    try {
      qrDataUri = await QRCode.toDataURL(options.couponCode, {
        width: 200,
        margin: 2,
        color: { dark: '#173320', light: '#ffffff' },
      });
    } catch {
      // Skip QR if generation fails
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#173320;max-width:500px;margin:0 auto;">
        <h1 style="color:#2d6a1e;">🎉 Congratulations!</h1>
        <p>You completed FarmQuest and earned a reward!</p>
        <p><strong>Your score:</strong> ${options.score.toLocaleString()} points</p>
        <p><strong>Your reward:</strong> ${options.rewardName}</p>
        ${qrDataUri ? `
        <div style="text-align:center;margin:20px 0;">
          <p style="margin-bottom:8px;font-weight:600;">Your QR Code:</p>
          <img src="${qrDataUri}" alt="QR Code for ${options.couponCode}" style="border-radius:8px;">
        </div>
        ` : ''}
        <div style="text-align:center;margin:20px 0;">
          <div style="display:inline-block;padding:16px 22px;background:#f4df9b;border-radius:10px;font-size:24px;font-weight:800;letter-spacing:2px;">
            ${options.couponCode}
          </div>
        </div>
        <p style="text-align:center;">Present this code or QR when claiming your reward.</p>
        <hr style="border:none;border-top:1px solid #c8dfc0;margin:20px 0;">
        <p style="text-align:center;color:#666;font-size:0.85rem;">Thank you for playing FarmQuest!</p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: 'Your FarmQuest Reward 🎁',
        text: [
          'Congratulations!',
          '',
          'You completed FarmQuest.',
          '',
          `Your score: ${options.score.toLocaleString()} points`,
          `Your reward: ${options.rewardName}`,
          '',
          'Coupon Code:',
          options.couponCode,
          '',
          'Present this code when claiming your reward.',
          '',
          'Thank you for playing FarmQuest!',
        ].join('\n'),
        html,
      });
    } else {
      // Fallback to dev email
      const dev = new DevelopmentEmailService();
      await dev.sendCouponEmail(options);
    }
  }
}

export const createEmailService = (): EmailService => {
  if (process.env.EMAIL_PROVIDER === 'smtp') {
    return new SmtpEmailService();
  }
  return new DevelopmentEmailService();
};
