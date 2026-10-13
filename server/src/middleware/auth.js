const jwt = require('jsonwebtoken');

/**
 * Middleware: require a valid session or Bearer JWT.
 * Attaches decoded payload to req.user.
 * For EJS server-rendered pages, we read the JWT from the session cookie.
 * For any API calls (Excel export, file download) we also accept Authorization header.
 */
const authenticate = (req, res, next) => {
  // 1. Session-based (EJS pages)
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // 2. Bearer token (direct API / AJAX)
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }

  // 3. Not authenticated — redirect to login for page requests, 401 for AJAX
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.redirect('/auth/login');
};

/**
 * Restrict to specific roles.
 * For page requests, redirect to /403; for API calls, return 403 JSON.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  if (!roles.includes(req.user.role)) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    return res.redirect('/403');
  }
  next();
};

module.exports = { authenticate, authorize };
