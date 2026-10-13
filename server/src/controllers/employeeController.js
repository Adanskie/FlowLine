const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Employee, User, Role, Department, Position, Team, Task, TaskAssignment } = require('../models');
const { log } = require('../lib/activityLog');

const include = [
  { model: Department, as: 'department' },
  { model: Position,   as: 'position' },
  { model: Team,       as: 'team' },
  { model: User,       as: 'user', include: [{ model: Role, as: 'role' }] },
];

// ── List ──────────────────────────────────────────────────────────────────────
const index = async (req, res) => {
  const { search, department_id, status } = req.query;
  const where = { is_deleted: false };
  if (department_id) where.department_id = +department_id;
  if (status)        where.status = status;
  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name:  { [Op.like]: `%${search}%` } },
      { email:      { [Op.like]: `%${search}%` } },
    ];
  }

  const [employees, departments] = await Promise.all([
    Employee.findAll({ where, include, order: [['created_at', 'DESC']] }),
    Department.findAll({ where: { is_deleted: false }, order: [['department_name', 'ASC']] }),
  ]);

  res.render('admin/employees/index', {
    title: 'Employees', employees, departments,
    query: req.query, user: req.session.user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

// ── New form ──────────────────────────────────────────────────────────────────
const newForm = async (req, res) => {
  const [departments, positions, roles, teams, employees] = await Promise.all([
    Department.findAll({ where: { is_deleted: false }, order: [['department_name', 'ASC']] }),
    Position.findAll({ order: [['position_name', 'ASC']] }),
    Role.findAll(),
    Team.findAll({ where: { is_deleted: false }, order: [['team_name', 'ASC']] }),
    Employee.findAll({ where: { is_deleted: false }, order: [['first_name', 'ASC']] }),
  ]);
  res.render('admin/employees/form', {
    title: 'Add Employee', employee: {}, departments, positions, roles, teams, employees,
    action: '/admin/employees', method: 'POST',
    user: req.session.user, error: req.flash('error'),
  });
};

// ── Show ──────────────────────────────────────────────────────────────────────
const show = async (req, res) => {
  const emp = await Employee.findOne({ where: { employee_id: +req.params.id, is_deleted: false }, include });
  if (!emp) { req.flash('error', 'Employee not found.'); return res.redirect('/admin/employees'); }

  const tasks = await Task.findAll({
    where: { is_deleted: false },
    include: [
      { model: TaskAssignment, as: 'assignments', where: { employee_id: emp.employee_id }, required: true },
      { model: require('../models').WorkflowStage, as: 'stage' },
      { model: require('../models').TaskPriority,  as: 'priority' },
    ],
    order: [['created_at', 'DESC']],
  });

  res.render('admin/employees/show', {
    title: `${emp.first_name} ${emp.last_name}`, emp, tasks,
    user: req.session.user, error: req.flash('error'),
  });
};

// ── Edit form ─────────────────────────────────────────────────────────────────
const editForm = async (req, res) => {
  const emp = await Employee.findOne({ where: { employee_id: +req.params.id, is_deleted: false }, include });
  if (!emp) { req.flash('error', 'Employee not found.'); return res.redirect('/admin/employees'); }

  const [departments, positions, roles, teams, employees] = await Promise.all([
    Department.findAll({ where: { is_deleted: false }, order: [['department_name', 'ASC']] }),
    Position.findAll({ order: [['position_name', 'ASC']] }),
    Role.findAll(),
    Team.findAll({ where: { is_deleted: false }, order: [['team_name', 'ASC']] }),
    Employee.findAll({ where: { is_deleted: false }, order: [['first_name', 'ASC']] }),
  ]);

  res.render('admin/employees/form', {
    title: 'Edit Employee', employee: emp, departments, positions, roles, teams, employees,
    action: `/admin/employees/${emp.employee_id}?_method=PUT`, method: 'POST',
    user: req.session.user, error: req.flash('error'),
  });
};

// ── Create ────────────────────────────────────────────────────────────────────
const store = async (req, res) => {
  const { first_name, last_name, email, phone, department_id, position_id, supervisor_id,
          employment_type, hire_date, role_id, username, password, team_id } = req.body;
  try {
    const exists     = await Employee.findOne({ where: { email } });
    if (exists) { req.flash('error', 'Email already in use.'); return res.redirect('/admin/employees/new'); }
    const userExists = await User.findOne({ where: { username } });
    if (userExists) { req.flash('error', 'Username already taken.'); return res.redirect('/admin/employees/new'); }

    const profile_photo_url = req.file ? `uploads/${req.file.filename}` : null;

    const emp = await Employee.create({
      first_name, last_name, email, phone, status: 'Active', profile_photo_url,
      department_id: department_id ? +department_id : null,
      position_id:   position_id   ? +position_id   : null,
      supervisor_id: supervisor_id ? +supervisor_id : null,
      team_id:       team_id       ? +team_id       : null,
      employment_type,
      hire_date: hire_date ? new Date(hire_date) : null,
    });

    await User.create({
      employee_id: emp.employee_id,
      role_id:     role_id ? +role_id : null,
      username,
      password:    await bcrypt.hash(password, 10),
      status:      'active',
    });

    await log(req.session.user.id, 'create', `Created employee: ${first_name} ${last_name}`, 'employees', emp.employee_id);
    req.flash('success', 'Employee created successfully.');
    res.redirect('/admin/employees');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/employees/new');
  }
};

// ── Update ────────────────────────────────────────────────────────────────────
const update = async (req, res) => {
  const id = +req.params.id;
  const { first_name, last_name, email, phone, department_id, position_id, supervisor_id,
          employment_type, hire_date, status, role_id, username, password, team_id } = req.body;
  try {
    const emp = await Employee.findOne({ where: { employee_id: id, is_deleted: false }, include: [{ model: User, as: 'user' }] });
    if (!emp) { req.flash('error', 'Employee not found.'); return res.redirect('/admin/employees'); }

    const profile_photo_url = req.file ? `uploads/${req.file.filename}` : emp.profile_photo_url;

    await emp.update({
      first_name, last_name, email, phone, status, profile_photo_url,
      department_id: department_id ? +department_id : null,
      position_id:   position_id   ? +position_id   : null,
      supervisor_id: supervisor_id ? +supervisor_id : null,
      team_id:       team_id       ? +team_id       : null,
      employment_type,
      hire_date: hire_date ? new Date(hire_date) : null,
    });

    if (emp.user) {
      const userUpdate = { role_id: role_id ? +role_id : null, username };
      if (password) userUpdate.password = await bcrypt.hash(password, 10);
      await emp.user.update(userUpdate);
    }

    await log(req.session.user.id, 'update', `Updated employee: ${first_name} ${last_name}`, 'employees', id);
    req.flash('success', 'Employee updated.');
    res.redirect('/admin/employees');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/admin/employees/${id}/edit`);
  }
};

// ── Archive ───────────────────────────────────────────────────────────────────
const destroy = async (req, res) => {
  const id = +req.params.id;
  const emp = await Employee.findOne({ where: { employee_id: id, is_deleted: false }, include: [{ model: User, as: 'user' }] });
  if (!emp) { req.flash('error', 'Employee not found.'); return res.redirect('/admin/employees'); }

  await emp.update({ is_deleted: true, status: 'Archived' });
  if (emp.user) await emp.user.update({ is_deleted: true, status: 'inactive' });

  await log(req.session.user.id, 'archive', `Archived employee: ${emp.first_name} ${emp.last_name}`, 'employees', id);
  req.flash('success', 'Employee archived.');
  res.redirect('/admin/employees');
};

module.exports = { index, newForm, show, editForm, store, update, destroy };
