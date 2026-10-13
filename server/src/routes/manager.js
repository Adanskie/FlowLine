const router   = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const dashboard  = require('../controllers/dashboardController');
const task       = require('../controllers/taskController');
const attendance = require('../controllers/attendanceController');
const file       = require('../controllers/fileController');
const report     = require('../controllers/reportController');
const notif      = require('../controllers/notificationController');

router.use(authenticate, authorize('Manager'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', dashboard.show);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.get('/tasks',          task.board);
router.get('/tasks/new',      task.newForm);
router.post('/tasks',         upload.array('attachments', 10), task.store);
router.get('/tasks/:id',      task.show);
router.get('/tasks/:id/edit', task.editForm);
router.post('/tasks/:id',     upload.array('attachments', 10), (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return task.update(req, res, next);
  if (req.query._method === 'DELETE' || req.body._method === 'DELETE') return task.destroy(req, res, next);
  next();
});
router.post('/tasks/:id/change-stage',         task.changeStage);
router.post('/tasks/:id/approve',              task.approve);
router.post('/tasks/:id/comment',              task.addComment);
router.post('/tasks/:id/comments/:cid/delete', task.deleteComment);
router.post('/tasks/:id/attachments',          upload.single('file'), task.uploadAttachment);

// ── Attendance ────────────────────────────────────────────────────────────────
router.get('/attendance',  attendance.index);
router.post('/attendance', attendance.store);
router.post('/attendance/:id', (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return attendance.update(req, res, next);
  next();
});

// ── Files ─────────────────────────────────────────────────────────────────────
router.get('/files',               file.index);
router.get('/files/:id/download',  file.download);
router.post('/files/:id/delete',   file.destroy);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports',              report.index);
router.get('/reports/export/excel', report.exportExcel);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',           notif.index);
router.post('/notifications/read-all', notif.markAllRead);
router.post('/notifications/:id/read', notif.markRead);

module.exports = router;
