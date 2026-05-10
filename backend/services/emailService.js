const SibApiV3Sdk = require('sib-api-v3-sdk');
const EmailLog = require('../models/EmailLog');

// Initialize Brevo client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@war9a.tn';
const FROM_NAME = process.env.FROM_NAME || 'WAR9A.TN';

/**
 * Send email via Brevo and log to database
 */
async function sendEmail({ to, subject, htmlContent, type, userId = null, campaignId = null }) {
  const sendSmtpEmail = {
    to: [{ email: to }],
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    subject: subject,
    htmlContent: htmlContent,
    trackOpens: true,
    trackClicks: true
  };

  // Create log entry
  const log = await EmailLog.create({
    to,
    userId,
    subject,
    type,
    campaignId,
    status: 'pending'
  });

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    // Update log with success
    log.status = 'sent';
    log.messageId = response.messageId;
    await log.save();

    return { success: true, messageId: response.messageId, logId: log._id };
  } catch (error) {
    // Update log with failure
    log.status = 'failed';
    log.error = error.message;
    await log.save();

    console.error('Email send failed:', error);
    return { success: false, error: error.message, logId: log._id };
  }
}

/**
 * Send verification email
 */
async function sendVerificationEmail(user, verificationUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #0a0a0f; color: #f1f0ee; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #f97316; font-size: 32px; margin: 0; }
        .card { background: #111118; border: 1px solid #2d2d3d; border-radius: 16px; padding: 30px; }
        h2 { color: #ffffff; margin-top: 0; }
        p { color: #888899; line-height: 1.6; }
        .btn { display: inline-block; background: #f97316; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .btn:hover { background: #ea580c; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>WAR9A.TN</h1>
        </div>
        <div class="card">
          <h2>Verify Your Email</h2>
          <p>Hello ${user.name},</p>
          <p>Thank you for joining WAR9A.TN! Please verify your email address to complete your registration and receive important notifications.</p>
          <center>
            <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          </center>
          <p style="font-size: 12px; color: #666;">If you didn't create an account, you can safely ignore this email. This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>WAR9A.TN - Premium Football Predictions Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - WAR9A.TN',
    htmlContent: html,
    type: 'verification',
    userId: user._id
  });
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(user) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #0a0a0f; color: #f1f0ee; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #f97316; font-size: 32px; margin: 0; }
        .card { background: #111118; border: 1px solid #2d2d3d; border-radius: 16px; padding: 30px; }
        h2 { color: #ffffff; margin-top: 0; }
        p { color: #888899; line-height: 1.6; }
        .highlight { color: #f97316; font-weight: 600; }
        .features { background: #1a1a24; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .feature { display: flex; align-items: center; margin: 10px 0; }
        .feature-icon { width: 24px; height: 24px; background: #f97316; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>WAR9A.TN</h1>
        </div>
        <div class="card">
          <h2>Welcome to WAR9A.TN!</h2>
          <p>Hello <span class="highlight">${user.name}</span>,</p>
          <p>Your account has been successfully created. You're now part of Tunisia's premier football predictions platform!</p>
          <div class="features">
            <div class="feature">
              <div class="feature-icon">✓</div>
              <span>Access premium football predictions</span>
            </div>
            <div class="feature">
              <div class="feature-icon">✓</div>
              <span>High success rate tickets</span>
            </div>
            <div class="feature">
              <div class="feature-icon">✓</div>
              <span>Secure and instant purchases</span>
            </div>
            <div class="feature">
              <div class="feature-icon">✓</div>
              <span>Refer friends and earn bonuses</span>
            </div>
          </div>
          <p>Your promo code: <span class="highlight" style="font-size: 18px; letter-spacing: 1px;">${user.promoCode}</span></p>
          <p>Share this code with friends and earn bonuses when they make their first deposit!</p>
        </div>
        <div class="footer">
          <p>WAR9A.TN - Premium Football Predictions Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to WAR9A.TN!',
    htmlContent: html,
    type: 'welcome',
    userId: user._id
  });
}

/**
 * Send deposit status notification
 */
async function sendDepositStatusEmail(user, deposit, status) {
  const isApproved = status === 'approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #0a0a0f; color: #f1f0ee; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #f97316; font-size: 32px; margin: 0; }
        .card { background: #111118; border: 1px solid #2d2d3d; border-radius: 16px; padding: 30px; }
        h2 { color: #ffffff; margin-top: 0; }
        p { color: #888899; line-height: 1.6; }
        .status { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 600; margin: 10px 0; }
        .status-approved { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .status-rejected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .amount { font-size: 24px; font-weight: 700; color: #f97316; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>WAR9A.TN</h1>
        </div>
        <div class="card">
          <h2>Deposit ${isApproved ? 'Approved' : 'Update'}</h2>
          <p>Hello ${user.name},</p>
          <p>Your deposit request has been ${isApproved ? 'approved' : 'updated'}.</p>
          <div class="amount">${deposit.amount.toFixed(2)} TND</div>
          <div class="status ${isApproved ? 'status-approved' : 'status-rejected'}">
            ${status.toUpperCase()}
          </div>
          ${deposit.promoBonus > 0 ? `<p style="color: #22c55e;">Bonus applied: +${deposit.promoBonus} TND</p>` : ''}
          ${deposit.adminNote ? `<p style="color: #666; font-style: italic;">Note: ${deposit.adminNote}</p>` : ''}
          <p>Method: ${deposit.method}</p>
        </div>
        <div class="footer">
          <p>WAR9A.TN - Premium Football Predictions Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Deposit ${status.charAt(0).toUpperCase() + status.slice(1)} - WAR9A.TN`,
    htmlContent: html,
    type: `deposit_${status}`,
    userId: user._id
  });
}

/**
 * Send purchase confirmation email
 */
async function sendPurchaseConfirmationEmail(user, ticket) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #0a0a0f; color: #f1f0ee; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #f97316; font-size: 32px; margin: 0; }
        .card { background: #111118; border: 1px solid #2d2d3d; border-radius: 16px; padding: 30px; }
        h2 { color: #ffffff; margin-top: 0; }
        p { color: #888899; line-height: 1.6; }
        .ticket-title { font-size: 20px; font-weight: 600; color: #ffffff; margin: 15px 0; }
        .odds { font-size: 18px; color: #f97316; font-weight: 700; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>WAR9A.TN</h1>
        </div>
        <div class="card">
          <h2>Ticket Purchase Confirmed</h2>
          <p>Hello ${user.name},</p>
          <p>You have successfully purchased a premium ticket!</p>
          <div class="ticket-title">${ticket.title}</div>
          <p class="odds">Global Odds: ×${ticket.globalOdds}</p>
          <p>Price: ${ticket.price} TND</p>
          <p>You can view your ticket details in your account dashboard.</p>
          <p style="color: #f97316; font-size: 12px;">Good luck with your predictions!</p>
        </div>
        <div class="footer">
          <p>WAR9A.TN - Premium Football Predictions Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Ticket Purchase Confirmed - WAR9A.TN',
    htmlContent: html,
    type: 'purchase_confirmation',
    userId: user._id
  });
}

/**
 * Send new ticket available notification
 */
async function sendNewTicketNotification(user, ticket) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #0a0a0f; color: #f1f0ee; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #f97316; font-size: 32px; margin: 0; }
        .card { background: #111118; border: 1px solid #2d2d3d; border-radius: 16px; padding: 30px; }
        h2 { color: #ffffff; margin-top: 0; }
        p { color: #888899; line-height: 1.6; }
        .new-badge { display: inline-block; background: #f97316; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
        .btn { display: inline-block; background: #f97316; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>WAR9A.TN</h1>
        </div>
        <div class="card">
          <span class="new-badge">NEW TICKET</span>
          <h2>New Premium Ticket Available!</h2>
          <p>Hello ${user.name},</p>
          <p>A new premium ticket is now available for purchase:</p>
          <h3 style="color: #ffffff; margin: 15px 0;">${ticket.title}</h3>
          <p>Global Odds: <strong style="color: #f97316;">×${ticket.globalOdds}</strong></p>
          <p>Price: <strong>${ticket.price} TND</strong></p>
          <p>Success Probability: <strong>${ticket.successProbability}%</strong></p>
          <center>
            <a href="${process.env.FRONTEND_URL}/tickets" class="btn">View Ticket</a>
          </center>
        </div>
        <div class="footer">
          <p>WAR9A.TN - Premium Football Predictions Platform</p>
          <p style="font-size: 11px;">You received this because you opted in for new ticket notifications.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'New Premium Ticket Available - WAR9A.TN',
    htmlContent: html,
    type: 'ticket_available',
    userId: user._id
  });
}

/**
 * Send admin alert email
 */
async function sendAdminAlert(subject, message) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { success: false, error: 'Admin email not configured' };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #0a0a0f; color: #f1f0ee; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .alert { background: #7c2d12; border: 1px solid #f97316; border-radius: 16px; padding: 30px; }
        h2 { color: #f97316; margin-top: 0; }
        p { color: #f1f0ee; line-height: 1.6; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2>⚠️ Admin Alert</h2>
          <p><strong>${subject}</strong></p>
          <p>${message}</p>
          <p style="font-size: 12px; color: #888; margin-top: 20px;">
            Time: ${new Date().toLocaleString('fr-TN')}
          </p>
        </div>
        <div class="footer">
          <p>WAR9A.TN Admin System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Admin Alert: ${subject}`,
    htmlContent: html,
    type: 'admin_alert'
  });
}

/**
 * Send broadcast email to multiple users
 */
async function sendBroadcastEmail({ users, subject, htmlContent, campaignId }) {
  const results = [];

  for (const user of users) {
    if (!user.email || !user.emailVerified) continue;

    const result = await sendEmail({
      to: user.email,
      subject,
      htmlContent,
      type: 'broadcast',
      userId: user._id,
      campaignId
    });

    results.push({ userId: user._id, email: user.email, ...result });
  }

  return results;
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendDepositStatusEmail,
  sendPurchaseConfirmationEmail,
  sendNewTicketNotification,
  sendAdminAlert,
  sendBroadcastEmail
};
