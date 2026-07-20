// Email delivery. Dev mode sends nothing — the code is returned in the API
// response instead (mirrors the OTP flow in utils/sms.js). To go live, set
// AUTH_DEV_MODE=false and wire a real provider (SendGrid/SES/Resend) below.
const DEV_MODE = process.env.AUTH_DEV_MODE !== 'false';

async function sendEmail(to, subject, body) {
  if (DEV_MODE) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${body}`);
    return;
  }
  // ponytail: wire a real provider here when AUTH_DEV_MODE=false.
  throw new Error('Email provider not configured. Set AUTH_DEV_MODE=true or wire a provider in utils/email.js');
}

module.exports = { sendEmail, DEV_MODE };
