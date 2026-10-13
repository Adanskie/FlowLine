const router   = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const dashboard  = require('../controllers/dashboardController');
const task       = require('../controllers/taskController');
const attendance = require('../controllers/attendanceController');
const file       = require('../controllers/fileController');
const notif      = require('../controllers/notificationController');

router.use(authenticate, authorize('Employee'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', dashboard.show);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.get('/tasks',                           task.board);
router.get('/tasks/:id',                       task.show);
router.post('/tasks/:id/submit-review',        task.submitForReview);
router.post('/tasks/:id/progress',             task.postProgress);
router.post('/tasks/:id/comment',              task.addComment);
router.post('/tasks/:id/attachments',          upload.single('file'), task.uploadAttachment);

// ── Attendance ────────────────────────────────────────────────────────────────
router.get('/attendance',        attendance.index);
router.post('/attendance/time-in',  attendance.timeIn);
router.post('/attendance/time-out', attendance.timeOut);

// ── Files ─────────────────────────────────────────────────────────────────────
router.get('/files',              file.index);
router.get('/files/:id/download', file.download);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',           notif.index);
router.post('/notifications/read-all', notif.markAllRead);
router.post('/notifications/:id/read', notif.markRead);

module.exports = router;
