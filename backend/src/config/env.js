// Boot-time environment validation. Fail fast on misconfiguration instead of
// silently running insecure — e.g. a missing JWT_SECRET would otherwise let the
// server start and throw 500s (or, worse, sign/verify tokens inconsistently).
const IS_PROD = process.env.NODE_ENV === 'production';

// Obvious placeholder values that must never guard real user sessions.
const WEAK_SECRETS = new Set([
  'secret', 'changeme', 'change-me', 'dev', 'test', 'password', 'jwt',
  'jwtsecret', 'jwt-secret', 'pro-match', 'promatch', 'supersecret'
]);

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`[env] Missing required environment variable ${name}. Refusing to start.`);
  }
  return value;
}

// Validates security-critical config. Throws (aborting boot) on a fatal
// problem; warns for dev-only weaknesses that must be fixed before production.
function validateEnv() {
  const secret = requireEnv('JWT_SECRET');

  const weak = secret.length < 16 || WEAK_SECRETS.has(secret.trim().toLowerCase());
  if (weak) {
    if (IS_PROD) {
      throw new Error(
        '[env] JWT_SECRET is too weak for production. Set a long random value ' +
        '(e.g. `openssl rand -hex 32`).'
      );
    }
    console.warn(
      '[env] WARNING: JWT_SECRET is weak. Fine for local dev, but generate a ' +
      'strong random secret before deploying to production.'
    );
  }

  return { IS_PROD };
}

module.exports = { validateEnv, requireEnv, IS_PROD };
