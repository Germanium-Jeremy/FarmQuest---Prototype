import nodemailer from 'nodemailer';

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
    console.info(`
EMAIL WOULD BE SENT
To: ${options.to}
Subject: Your FarmQuest Reward

Congratulations! You completed FarmQuest.
Score: ${options.score} points
Reward: ${options.rewardName}
Coupon Code: ${options.couponCode}
Present this code when claiming your reward.
`);
  }
}

export class SmtpEmailService implements EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? 'true') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
    },
  });

  async sendCouponEmail(options: CouponEmailOptions): Promise<void> {
    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;
    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: 'Your FarmQuest Reward',
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
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#173320;">
          <h1>Congratulations!</h1>
          <p>You completed FarmQuest.</p>
          <p><strong>Your score:</strong> ${options.score.toLocaleString()} points</p>
          <p><strong>Your reward:</strong> ${options.rewardName}</p>
          <div style="display:inline-block;padding:16px 22px;background:#f4df9b;border-radius:10px;font-size:24px;font-weight:800;letter-spacing:2px;">
            ${options.couponCode}
          </div>
          <p>Present this code when claiming your reward.</p>
          <p>Thank you for playing FarmQuest!</p>
        </div>
      `,
    });
  }
}

export const createEmailService = (): EmailService => {
  if (process.env.EMAIL_PROVIDER === 'smtp') {
    return new SmtpEmailService();
  }
  return new DevelopmentEmailService();
};
