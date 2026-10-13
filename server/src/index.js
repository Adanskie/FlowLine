require('dotenv').config();

// ── Startup checks ────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    'FATAL: JWT_SECRET is missing or shorter than 32 characters.\n' +
    'Set a strong JWT_SECRET (32+ characters) in server/.env and restart.'
  );
  process.exit(1);
}

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Static uploads ── removed: files are served through the authenticated /api/files route ──

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/departments',   require('./routes/departments'));
app.use('/api/teams',         require('./routes/teams'));
app.use('/api/positions',     require('./routes/positions'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/files',         require('./routes/files'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const { runOverdueJob } = require('./jobs/overdueJob');
const overdueIntervalMs = (parseInt(process.env.OVERDUE_CHECK_MINUTES) || 15) * 60 * 1000;

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Flowline API running on http://localhost:${PORT}`);
  runOverdueJob();
  setInterval(runOverdueJob, overdueIntervalMs);
});
