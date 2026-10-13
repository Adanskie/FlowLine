require('dotenv').config();

// ── Startup checks ────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET missing or shorter than 32 characters.');
  process.exit(1);
}

const express      = require('express');
const path         = require('path');
const morgan       = require('morgan');
const helmet       = require('helmet');
const session      = require('express-session');
const flash        = require('connect-flash');
const ejsLayouts   = require('express-ejs-layouts');
const { sequelize } = require('./models');

const app = express();

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
      imgSrc:     ["'self'", 'data:'],
      fontSrc:    ["'self'", 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net'],
    },
  },
}));
app.use(morgan('dev'));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session & Flash ───────────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'flowline_fallback_secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 8 * 60 * 60 * 1000 }, // 8 h
}));
app.use(flash());

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Template helper functions ─────────────────────────────────────────────────
app.locals.stageBadge = (name) => {
  const map = { 'Pending':'badge-pending','In Progress':'badge-progress','For Review':'badge-review','Completed':'badge-completed','Overdue':'badge-overdue' };
  return `<span class="badge ${map[name]||'badge-progress'}">${name||''}</span>`;
};
app.locals.priorityBadge = (name) => {
  const map = { 'Low':'badge-low','Medium':'badge-medium','High':'badge-high' };
  return `<span class="badge ${map[name]||'badge-medium'}">${name||''}</span>`;
};
app.locals.statusBadge = (s) => {
  const map = { 'Active':'badge-active','Inactive':'badge-inactive','Archived':'badge-archived' };
  return `<span class="badge ${map[s]||'badge-inactive'}">${s||''}</span>`;
};
app.locals.attendanceBadge = (s) => {
  const map = { 'Present':'badge-present','Absent':'badge-absent','On Leave':'badge-leave' };
  return `<span class="badge ${map[s]||'badge-inactive'}">${s||''}</span>`;
};
app.locals.notifColor = (type) => {
  const map = { assignment:'#4f46e5', status:'#0284c7', approval:'#16a34a', deadline:'#dc2626' };
  return map[type] || '#6b7280';
};
app.locals.notifIcon = (type) => {
  const map = { assignment:'fa-list-check', status:'fa-arrows-rotate', approval:'fa-circle-check', deadline:'fa-clock' };
  return map[type] || 'fa-bell';
};

// ── Global view locals ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user         = req.session.user || null;
  res.locals.success      = req.flash('success');
  res.locals.error        = req.flash('error');
  res.locals.currentPath  = req.path;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',     require('./routes/auth'));
app.use('/admin',    require('./routes/admin'));
app.use('/manager',  require('./routes/manager'));
app.use('/employee', require('./routes/employee'));

// Root redirect
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const role = req.session.user.role;
  if (role === 'Administrator') return res.redirect('/admin/dashboard');
  if (role === 'Manager')       return res.redirect('/manager/dashboard');
  return res.redirect('/employee/dashboard');
});

// Dashboard shortcut (used by auth controller after login)
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const role = req.session.user.role;
  if (role === 'Administrator') return res.redirect('/admin/dashboard');
  if (role === 'Manager')       return res.redirect('/manager/dashboard');
  return res.redirect('/employee/dashboard');
});

// ── Error pages ───────────────────────────────────────────────────────────────
app.get('/403', (req, res) => res.status(403).render('errors/403', { title: 'Access Denied', user: req.session.user || null }));
app.use((req, res) => res.status(404).render('errors/404', { title: 'Not Found', user: req.session.user || null }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).render('errors/500', { title: 'Server Error', user: req.session.user || null, message: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const { runOverdueJob } = require('./jobs/overdueJob');
const overdueIntervalMs = (parseInt(process.env.OVERDUE_CHECK_MINUTES) || 15) * 60 * 1000;
const PORT = process.env.PORT || 3001;

sequelize.authenticate()
  .then(() => {
    console.log('Database connected.');
    app.listen(PORT, () => {
      console.log(`Flowline running on http://localhost:${PORT}`);
      runOverdueJob();
      setInterval(runOverdueJob, overdueIntervalMs);
    });
  })
  .catch(err => {
    console.error('Unable to connect to database:', err.message);
    process.exit(1);
  });
