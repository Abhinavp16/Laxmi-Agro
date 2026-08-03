const nodemailer = require('nodemailer');

let transporter = null;

const isSmtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const buildMagicLinkHtml = (link, expiryMinutes) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1e293b;">
    <h2 style="margin-bottom: 8px;">Laxmi Agro Enterprises</h2>
    <p style="font-size: 15px; line-height: 1.6;">
      Click the button below to sign in to the admin panel. No password is needed.
    </p>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${link}"
         style="display: inline-block; background-color: #86efac; color: #0f172a; text-decoration: none;
                font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 10px;">
        Sign in to Admin Panel
      </a>
    </p>
    <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
      This link is valid for <strong>${expiryMinutes} minutes</strong> and can be used <strong>only once</strong>.
    </p>
    <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
      If you did not request this link, you can safely ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <p style="font-size: 11px; color: #94a3b8; word-break: break-all;">
      If the button does not work, copy and paste this URL into your browser:<br />${link}
    </p>
  </div>
`;

/**
 * Sends a magic link sign-in email.
 * In non-production environments without SMTP configured, logs the link to the console instead.
 */
exports.sendMagicLinkEmail = async (to, link, expiryMinutes = 5) => {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured in production');
    }
    console.log('\n[EmailService] SMTP not configured - magic link logged to console instead:');
    console.log(`[EmailService] To: ${to}`);
    console.log(`[EmailService] Magic link: ${link}\n`);
    return;
  }

  const info = await getTransporter().sendMail({
    from: `"Laxmi Agro Admin" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Your Laxmi Agro Admin sign-in link',
    text: `Sign in to the Laxmi Agro admin panel: ${link}\n\nThis link is valid for ${expiryMinutes} minutes and can be used only once.`,
    html: buildMagicLinkHtml(link, expiryMinutes),
  });

  console.log(`[EmailService] Magic link email sent to ${to} (messageId: ${info.messageId})`);
};
