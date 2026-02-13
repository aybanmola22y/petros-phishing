import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Helps in some restricted environments
  }
});

interface PhishingLog {
  email: string | null;
  event: string;
  timestamp: string;
}

export async function sendPhishingLog(log: PhishingLog) {
  const recipientEmail = process.env.RECIPIENT_EMAIL;

  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD || !recipientEmail) {
    console.error('Email environment variables are missing');
    return { success: false, error: 'Configuration missing' };
  }

  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: recipientEmail,
    subject: `🚨 Phishing Simulation Alert: ${log.event}`,
    text: `PHISHING SIMULATION ALERT\n\nA security event has been recorded in the Petrosphere Phishing Simulation System.\n\nEvent Type: ${log.event}\nUser Email: ${log.email || 'Anonymous'}\nTimestamp: ${log.timestamp}\n\n--- Confidential: Internal Security Use Only`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; padding: 20px; }
          .card { background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background-color: #e11d48; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; text-transform: uppercase; }
          .content { padding: 32px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; margin-bottom: 16px; }
          .info-group { margin-bottom: 24px; }
          .info-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .info-value { font-size: 16px; color: #0f172a; font-weight: 500; }
          .divider { height: 1px; background-color: #f1f5f9; margin: 24px 0; }
          .footer { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
          .footer p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Phishing Alert</h1>
            </div>
            <div class="content">
              <div class="status-badge">Simulation Failure Detected</div>
              
              <div class="info-group">
                <div class="info-label">Event Type</div>
                <div class="info-value">Critical Vulnerability Reached</div>
              </div>

              <div class="info-group">
                <div class="info-label">Target Employee</div>
                <div class="info-value" style="color: #2563eb;">${log.email || 'Anonymous'}</div>
              </div>

              <div class="divider"></div>

              <div class="info-group">
                <div class="info-label">Recorded At</div>
                <div class="info-value">${new Date(log.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' })}</div>
              </div>
            </div>
            <div class="footer">
              <p><strong>Petrosphere Phishing Simulation System</strong></p>
              <p>Confidential • Internal Security Notification</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendVictimDigest(victims: { email: string | null, timestamp: string }[]) {
  const recipientEmail = process.env.RECIPIENT_EMAIL;

  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD || !recipientEmail) {
    console.error('Email environment variables are missing');
    return { success: false, error: 'Configuration missing' };
  }

  const victimListHtml = victims.map(v => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #2563eb; font-weight: 500;">${v.email || 'Anonymous'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${new Date(v.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: recipientEmail,
    subject: `📋 Phishing Simulation Digest: ${victims.length} New Victim(s)`,
    text: `PHISHING SIMULATION DIGEST\n\n${victims.length} new simulation failures recorded.\n\n${victims.map(v => `- ${v.email || 'Anonymous'} at ${v.timestamp}`).join('\n')}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; padding: 20px; }
          .card { background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background-color: #0f172a; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; text-transform: uppercase; }
          .content { padding: 32px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px; border-bottom: 2px solid #f1f5f9; }
          .footer { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Simulation Report</h1>
            </div>
            <div class="content">
              <div class="status-badge">Batch Summary Digest</div>
              <p>The following employees have fallen for the phishing simulation since the last report:</p>
              
              <table>
                <thead>
                  <tr>
                    <th>Target Employee</th>
                    <th>Recorded At</th>
                  </tr>
                </thead>
                <tbody>
                  ${victimListHtml}
                </tbody>
              </table>
            </div>
            <div class="footer">
              <p><strong>Petrosphere Phishing Simulation System</strong></p>
              <p>Confidential • Batch Security Notification</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending digest email:', error);
    return { success: false, error };
  }
}
