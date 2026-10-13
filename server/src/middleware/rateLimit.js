/**
 * In-memory rate limiter for login and forgot-password routes.
 * No external dependencies.
 *
 * NOTE: If the server runs behind a reverse proxy, add
 *   app.set('trust proxy', 1)
 * in index.js so req.ip reflects the real client IP rather than 127.0.0.1.
 */

const WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED = 5;

// Map<key, { count: number, firstAttempt: number }>
const store = new Map();

// Remove expired entries every 10 minutes to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstAttempt > WINDOW_MS) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Build and apply a rate limit for a given store key.
 * Returns true and sends 429 if the limit is exceeded.
 * Returns false and increments the counter otherwise.
 */
const check = (key, res) => {
  const now   = Date.now();
  const entry = store.get(key);

  if (entry) {
    // Expired window — reset
    if (now - entry.firstAttempt > WINDOW_MS) {
      store.delete(key);
    } else if (entry.count >= MAX_FAILED) {
      res.status(429).json({ error: 'Too many failed attempts. Try again in a few minutes.' });
      return true; // blocked
    }
  }

  // Increment (or create) the counter
  const current = store.get(key);
  if (current) {
    current.count += 1;
  } else {
    store.set(key, { count: 1, firstAttempt: now });
  }

  return false; // not blocked
};

/**
 * Middleware for POST /login.
 * Key: login:<ip>:<username>
 */
const loginLimiter = (req, res, next) => {
  const ip       = req.ip;
  const username = (req.body.username ?? '').toLowerCase();
  const key      = `login:${ip}:${username}`;
  if (check(key, res)) return;
  next();
};

/**
 * Middleware for POST /forgot-password.
 * Key: forgot:<ip>
 */
const forgotLimiter = (req, res, next) => {
  const key = `forgot:${req.ip}`;
  if (check(key, res)) return;
  next();
};

/**
 * Clear the login counter for an IP+username pair on successful login.
 */
const clearLoginLimit = (ip, username) => {
  const key = `login:${ip}:${(username ?? '').toLowerCase()}`;
  store.delete(key);
};

module.exports = { loginLimiter, forgotLimiter, clearLoginLimit };
