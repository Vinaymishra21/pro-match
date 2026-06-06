// SMS gateway abstraction. In dev mode we never send a real SMS — the OTP is
// logged to the server console and returned in the API response so you can test
// the full flow with zero cost. To go live, set AUTH_DEV_MODE=false and plug a
// provider (MSG91 / Twilio) into sendSms().

const DEV_MODE = process.env.AUTH_DEV_MODE !== 'false';

async function sendSms(phone, message) {
  if (DEV_MODE) {
    console.log(`[DEV SMS] -> ${phone}: ${message}`);
    return { delivered: false, dev: true };
  }

  // TODO: integrate real provider here, e.g.:
  //   await msg91.send({ to: phone, message });
  // Until then, fail loudly so we never silently drop a real user's OTP.
  throw new Error('SMS provider not configured. Set AUTH_DEV_MODE=true or wire a provider in utils/sms.js');
}

module.exports = { sendSms, DEV_MODE };
