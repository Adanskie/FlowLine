const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { Op }  = require('sequelize');
const { User, Employee, Role, Notification } = require('../models');
const { log } = require('../lib/activityLog');

// ── Login ─────────────────────────────────────────────────────────────────────
const loginPage = (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login', error: req.flash('error'), success: req.flash('success') });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    req.flash('error', 'Username and password are required.');
    return res.redirect('/auth/login');
  }

  const user = await User.findOne({
    where: { username, is_deleted: false },
    include: [
      { model: Role, as: 'role' },
      { model: Employee, as: 'employee' },
    ],
  });

  if (!user) {
    req.flash('error', 'Invalid credentials.');
    return res.redirect('/auth/login');
  }
  if (user.status === 'inactive') {
    req.flash('error', 'Account deactivated. Contact an administrator.');
    return res.redirect('/auth/login');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await user.update({ failed_login_attempts: user.failed_login_attempts + 1 });
    req.flash('error', 'Invalid credentials.');
    return res.redirect('/auth/login');
  }

  await user.update({ last_login: new Date(), failed_login_attempts: 0 });
  await log(user.id, 'login', 'User logged in.', 'users', user.id);

  const unreadCount = await Notification.count({ where: { user_id: user.id, is_read: false } });

  req.session.user = {
    id:         user.id,
    username:   user.username,
    role:       user.role?.role_name,
    name:       user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user.username,
    employeeId: user.employee_id,
    unreadCount,
  };

  // Redirect by role
  const role = user.role?.role_name;
  if (role === 'Administrator') return res.redirect('/admin/dashboard');
  if (role === 'Manager')       return res.redirect('/manager/dashboard');
  return res.redirect('/employee/dashboard');
};

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  if (req.session.user) {
    await log(req.session.user.id, 'logout', 'User logged out.', 'users', req.session.user.id);
  }
  req.session.destroy(() => res.redirect('/auth/login'));
};

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPage = (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password', error: req.flash('error'), success: req.flash('success'), demo_token: null });
};

const forgot = async (req, res) => {
  const { username } = req.body;
  if (!username) {
    req.flash('error', 'Username is required.');
    return res.redirect('/auth/forgot-password');
  }

  const user = await User.findOne({ where: { username, is_deleted: false } });
  if (!user) {
    return res.render('auth/forgot-password', {
      title: 'Forgot Password', error: null,
      success: 'If that username exists, a reset token has been generated.',
      demo_token: null,
    });
  }

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await user.update({ reset_token: token, reset_expires: expires });
  await log(user.id, 'password_reset_request', 'Password reset requested.', 'users', user.id);

  res.render('auth/forgot-password', {
    title: 'Forgot Password', error: null,
    success: 'Reset token generated. Copy the token below to reset your password.',
    demo_token: token,
  });
};

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPage = (req, res) => {
  const { token } = req.query;
  res.render('auth/reset-password', { title: 'Reset Password', token: token || '', error: req.flash('error'), success: req.flash('success') });
};

const reset = async (req, res) => {
  const { token, new_password, confirm_password } = req.body;

  if (!token || !new_password) {
    req.flash('error', 'Token and new password are required.');
    return res.redirect(`/auth/reset-password?token=${token || ''}`);
  }
  if (new_password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.redirect(`/auth/reset-password?token=${token}`);
  }
  if (new_password !== confirm_password) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect(`/auth/reset-password?token=${token}`);
  }

  const user = await User.findOne({
    where: { reset_token: token, reset_expires: { [Op.gt]: new Date() }, is_deleted: false },
  });

  if (!user) {
    req.flash('error', 'Invalid or expired reset token.');
    return res.redirect('/auth/reset-password');
  }

  await user.update({
    password:              await bcrypt.hash(new_password, 10),
    reset_token:           null,
    reset_expires:         null,
    failed_login_attempts: 0,
  });
  await log(user.id, 'password_reset', 'Password was reset successfully.', 'users', user.id);

  req.flash('success', 'Password updated. You can now log in.');
  res.redirect('/auth/login');
};

module.exports = { loginPage, login, logout, forgotPage, forgot, resetPage, reset };
