// Smallest runnable check for the /auth/google guard branches — no DB, no
// network. Verifies the controller loads and rejects bad input before it ever
// touches Google or Mongo. Run: `node scripts/check-google-auth.js`
const assert = require('assert');

// Force the "not configured" state so we can exercise both guards offline.
delete process.env.GOOGLE_WEB_CLIENT_ID;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-16-chars';

const { googleAuth } = require('../src/controllers/authController');

function mockRes() {
  return {
    code: null,
    body: null,
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; }
  };
}

(async () => {
  // Missing idToken → 400
  let res = mockRes();
  await googleAuth({ body: {} }, res);
  assert.strictEqual(res.code, 400, 'missing idToken should be 400');

  // idToken present but GOOGLE_WEB_CLIENT_ID unset → 503 (not configured)
  res = mockRes();
  await googleAuth({ body: { idToken: 'anything' } }, res);
  assert.strictEqual(res.code, 503, 'unconfigured client should be 503');

  console.log('OK: /auth/google guards return 400 and 503 as expected');
})();
