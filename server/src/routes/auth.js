const router = require('express').Router();
const ctrl   = require('../controllers/authController');

router.get('/login',           ctrl.loginPage);
router.post('/login',          ctrl.login);
router.get('/logout',          ctrl.logout);
router.get('/forgot-password', ctrl.forgotPage);
router.post('/forgot-password',ctrl.forgot);
router.get('/reset-password',  ctrl.resetPage);
router.post('/reset-password', ctrl.reset);

module.exports = router;
