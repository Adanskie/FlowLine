// Simple in-memory rate limiter — no Redis required.
// 5 failed attempts per 15-minute window per IP+username combination.
const attempts = {};

const WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
const MAX_FAILS  = 5;

const loginLimiter = (req, res, next) => {
  const key  = `login:${req.ip}:${req.body.username || ''}`;
  const now  = Date.now();
  const rec  = attempts[key];

  if (rec && rec.count >= MAX_FAILS && now - rec.first < WINDOW_MS) {
    const wait = Math.ceil((WINDOW_MS - (now - rec.first)) / 60000);
    req.flash('error', `Too many failed attempts. Try again in ${wait} minute(s).`);
    return res.redirect('/auth/login');
  }
  next();
};

const clearLoginLimit = (ip, username) => {
  delete attempts[`login:${ip}:${username}`];
};

module.exports = { loginLimiter, clearLoginLimit };
