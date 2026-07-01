// Minimal dependency-free, in-memory rate limiter (fixed window per key).
//
// Good enough as a security floor for a single-instance deployment: it throttles
// brute-force / abuse on sensitive endpoints without adding a dependency. For a
// multi-instance production setup, swap the Map for a shared store (Redis) so
// the window is enforced across processes.
function rateLimit({ windowMs, max, keyPrefix = 'rl', message } = {}) {
  if (!windowMs || !max) {
    throw new Error('rateLimit requires windowMs and max');
  }

  const hits = new Map(); // key -> { count, resetAt }

  // Periodically drop expired entries so the Map can't grow unbounded.
  // unref() so this timer never keeps the process alive on its own.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  if (typeof sweep.unref === 'function') sweep.unref();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        message: message || 'Too many requests. Please slow down and try again shortly.',
        code: 'RATE_LIMITED',
        retryAfter
      });
    }

    return next();
  };
}

const MINUTE = 60 * 1000;

// Presets used across the app. Auth is the strictest (brute-force target).
const authLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  max: 20,
  keyPrefix: 'auth',
  message: 'Too many attempts. Please wait a few minutes and try again.'
});

// OTP request is even tighter — each one may send an SMS (cost + abuse vector).
const otpLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  max: 5,
  keyPrefix: 'otp',
  message: 'Too many code requests. Please wait before requesting another.'
});

// Money endpoints — moderate cap to blunt scripted abuse.
const billingLimiter = rateLimit({
  windowMs: 5 * MINUTE,
  max: 30,
  keyPrefix: 'billing'
});

// Broad backstop for the whole API.
const globalLimiter = rateLimit({
  windowMs: MINUTE,
  max: 200,
  keyPrefix: 'global'
});

module.exports = {
  rateLimit,
  authLimiter,
  otpLimiter,
  billingLimiter,
  globalLimiter
};
