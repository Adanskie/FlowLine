const router   = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const dashboard  = require('../controllers/dashboardController');
const employee   = require('../controllers/employeeController');
const department = require('../controllers/departmentController');
const team       = require('../controllers/teamController');
const position   = require('../controllers/positionController');
const task       = require('../controllers/taskController');
const attendance = require('../controllers/attendanceController');
const file       = require('../controllers/fileController');
const report     = require('../controllers/reportController');
const actLog     = require('../controllers/activityLogController');
const notif      = require('../controllers/notificationController');

// All admin routes require auth + Administrator role
router.use(authenticate, authorize('Administrator'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', dashboard.show);

// ── Employees ─────────────────────────────────────────────────────────────────
router.get('/employees',           employee.index);
router.get('/employees/new',       employee.newForm);
router.post('/employees',          upload.single('profile_photo'), employee.store);
router.get('/employees/:id',       employee.show);
router.get('/employees/:id/edit',  employee.editForm);
router.post('/employees/:id',      upload.single('profile_photo'), (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return employee.update(req, res, next);
  next();
});
router.post('/employees/:id/delete', employee.destroy);

// ── Departments ───────────────────────────────────────────────────────────────
router.get('/departments',              department.index);
router.post('/departments',             department.store);
router.post('/departments/:id',         (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return department.update(req, res, next);
  if (req.query._method === 'DELETE' || req.body._method === 'DELETE') return department.destroy(req, res, next);
  next();
});

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/teams',     team.index);
router.post('/teams',    team.store);
router.post('/teams/:id', (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return team.update(req, res, next);
  if (req.query._method === 'DELETE' || req.body._method === 'DELETE') return team.destroy(req, res, next);
  next();
});

// ── Positions ─────────────────────────────────────────────────────────────────
router.get('/positions',     position.index);
router.post('/positions',    position.store);
router.post('/positions/:id', (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return position.update(req, res, next);
  if (req.query._method === 'DELETE' || req.body._method === 'DELETE') return position.destroy(req, res, next);
  next();
});

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.get('/tasks',               task.board);
router.get('/tasks/new',           task.newForm);
router.post('/tasks',              upload.array('attachments', 10), task.store);
router.get('/tasks/:id',           task.show);
router.get('/tasks/:id/edit',      task.editForm);
router.post('/tasks/:id',          upload.array('attachments', 10), (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return task.update(req, res, next);
  if (req.query._method === 'DELETE' || req.body._method === 'DELETE') return task.destroy(req, res, next);
  next();
});
router.post('/tasks/:id/change-stage',     task.changeStage);
router.post('/tasks/:id/approve',          task.approve);
router.post('/tasks/:id/comment',          task.addComment);
router.post('/tasks/:id/comments/:cid/delete', task.deleteComment);
router.post('/tasks/:id/attachments',      upload.single('file'), task.uploadAttachment);

// ── Attendance ────────────────────────────────────────────────────────────────
router.get('/attendance',      attendance.index);
router.post('/attendance',     attendance.store);
router.post('/attendance/:id', (req, res, next) => {
  if (req.query._method === 'PUT' || req.body._method === 'PUT') return attendance.update(req, res, next);
  if (req.query._method === 'DELETE' || req.body._method === 'DELETE') return attendance.destroy(req, res, next);
  next();
});

// ── Files ─────────────────────────────────────────────────────────────────────
router.get('/files',                 file.index);
router.get('/files/:id/download',    file.download);
router.post('/files/:id/delete',     file.destroy);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports',               report.index);
router.get('/reports/export/excel',  report.exportExcel);

// ── Activity Logs ─────────────────────────────────────────────────────────────
router.get('/activity-logs', actLog.index);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications',             notif.index);
router.post('/notifications/read-all',   notif.markAllRead);
router.post('/notifications/:id/read',   notif.markRead);

module.exports = router;
