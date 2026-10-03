const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const prisma  = require('../lib/prisma');
const { log } = require('../lib/activityLog');

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  const user = await prisma.user.findFirst({
    where: { username, is_deleted: false },
    include: { role: true, employee: true }
  });

  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
  if (user.status === 'inactive') return res.status(403).json({ error: 'Account deactivated. Contact an administrator.' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await prisma.user.update({ where: { id: user.id }, data: { failed_login_attempts: { increment: 1 } } });
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date(), failed_login_attempts: 0 }
  });
  await log(user.id, 'login', 'User logged in.', 'users', user.id);

  const payload = { id: user.id, role: user.role?.role_name, employeeId: user.employee_id };
  const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  res.json({
    token,
    user: {
      id:         user.id,
      username:   user.username,
      role:       user.role?.role_name,
      name:       user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user.username,
      employeeId: user.employee_id,
    }
  });
};

// ── Me ────────────────────────────────────────────────────────────────────────
const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { role: true, employee: { include: { department: true, position: true } } }
  });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const unread = await prisma.notification.count({ where: { user_id: user.id, is_read: false } });

  res.json({
    id:          user.id,
    username:    user.username,
    role:        user.role?.role_name,
    name:        user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user.username,
    employeeId:  user.employee_id,
    employee:    user.employee,
    unreadCount: unread,
  });
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  await log(req.user.id, 'logout', 'User logged out.', 'users', req.user.id);
  res.json({ message: 'Logged out.' });
};

// ── Forgot Password ───────────────────────────────────────────────────────────
// Generates a reset token and stores it with a 1-hour expiry.
// In production you would email the link; here we return the token directly
// so it can be demonstrated without an SMTP server.
const forgotPassword = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required.' });

  const user = await prisma.user.findFirst({ where: { username, is_deleted: false } });

  // Always return the same message to prevent username enumeration
  const safeMsg = 'If that username exists, a reset token has been generated.';

  if (!user) return res.json({ message: safeMsg });

  // Generate a cryptographically random token
  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  await prisma.user.update({
    where: { id: user.id },
    data: { reset_token: token, reset_expires: expires }
  });

  await log(user.id, 'password_reset_request', 'Password reset requested.', 'users', user.id);

  // In a real deployment: send email with link containing the token.
  // For demo/thesis purposes the token is returned in the response so it
  // can be copy-pasted into the Reset Password form.
  res.json({
    message: safeMsg,
    // Remove the line below in production — only here for thesis demonstration
    demo_token: token,
    demo_note:  'In production this token would be emailed. Copy it to use the reset form.'
  });
};

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'Token and new password are required.' });
  if (new_password.length < 6)  return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const user = await prisma.user.findFirst({
    where: {
      reset_token:   token,
      reset_expires: { gt: new Date() }, // token must not be expired
      is_deleted:    false,
    }
  });

  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password:      await bcrypt.hash(new_password, 10),
      reset_token:   null,
      reset_expires: null,
      failed_login_attempts: 0,
    }
  });

  await log(user.id, 'password_reset', 'Password was reset successfully.', 'users', user.id);

  res.json({ message: 'Password updated. You can now log in.' });
};

module.exports = { login, me, logout, forgotPassword, resetPassword };
