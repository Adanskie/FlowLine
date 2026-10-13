const router = require('express').Router();
const { login, me, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, forgotLimiter } = require('../middleware/rateLimit');

router.post('/login',           loginLimiter,  login);
router.get('/me',               authenticate,  me);
router.post('/logout',          authenticate,  logout);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
