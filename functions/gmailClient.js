// functions/gmailClient.js
const { google } = require('googleapis');

/** RFC 2047-safe header encoding for non-ASCII */
function encodeRFC2047(str = '') {
  return /[^\x00-\x7F]/.test(str)
    ? `=?UTF-8?B?${Buffer.from(String(str), 'utf8').toString('base64')}?=`
    : String(str);
}

/** Base64URL for Gmail raw messages */
function base64Url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * Send an email via Gmail API using a service account with domain-wide delegation.
 * Set these env vars (Secrets in Cloud Functions):
 * - GMAIL_CLIENT_EMAIL
 * - GMAIL_PRIVATE_KEY
 * - GMAIL_IMPERSONATE  (Workspace user that owns the send-as aliases)
 * - GMAIL_SENDER       (fallback From address)
 */
async function gmailSend({
  to,
  subject,
  text,
  html,
  bcc = [],
  replyTo,
  fromName = 'Ober Artisan Drums',
  fromEmail, // 👈 per-message override (support@, soundlegend@, endorsements@)
}) {
  const auth = new google.auth.JWT({
    email: process.env.GMAIL_CLIENT_EMAIL,
    key: (process.env.GMAIL_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
    ],
    subject: process.env.GMAIL_IMPERSONATE,
  });

  const gmail = google.gmail({ version: 'v1', auth });
  const fromAddr = fromEmail || process.env.GMAIL_SENDER;

  const headers = [
    `From: ${encodeRFC2047(fromName)} <${fromAddr}>`,
    `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    ...(bcc.length ? [`Bcc: ${bcc.join(', ')}`] : []),
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${encodeRFC2047(subject)}`,
    'MIME-Version: 1.0',
    html
      ? 'Content-Type: text/html; charset=UTF-8'
      : 'Content-Type: text/plain; charset=UTF-8',
    '',
    html || text || '',
  ].join('\r\n');

  const raw = base64Url(headers);
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
}

module.exports = { gmailSend, encodeRFC2047, base64Url };