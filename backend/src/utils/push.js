// Sends notifications via Expo's push service. No credentials required for
// basic sending — Expo handles APNs/FCM delivery. Swap this for a direct
// FCM/APNs integration later if you outgrow Expo push.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isExpoToken(token) {
  return typeof token === 'string' && token.startsWith('ExponentPushToken');
}

// tokens: string | string[]. message: { title, body, data }
async function sendPush(tokens, { title, body, data = {} }) {
  const list = (Array.isArray(tokens) ? tokens : [tokens]).filter(isExpoToken);
  if (list.length === 0) {
    return { sent: 0 };
  }

  const messages = list.map((to) => ({ to, title, body, data, sound: 'default' }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages)
    });
    if (!res.ok) {
      console.warn('Expo push failed:', res.status);
    }
    return { sent: list.length };
  } catch (err) {
    // Never let a push failure break the request that triggered it.
    console.warn('Expo push error:', err.message);
    return { sent: 0, error: err.message };
  }
}

module.exports = { sendPush, isExpoToken };
