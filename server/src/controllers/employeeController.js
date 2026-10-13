const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { log } = require('../lib/activityLog');

const include = {
  department: true,
  position: true,
  team: true,
  user: { include: { role: true } }
};

const index = async (req, res) => {
  const { search, department_id, status } = req.query;
  const where = { is_deleted: false };
  if (department_id) where.department_id = +department_id;
  if (status)        where.status = status;
  if (search) {
    where.OR = [
      { first_name: { contains: search } },
      { last_name:  { contains: search } },
      { email:      { contains: search } },
    ];
  }
  const employees = await prisma.employee.findMany({ where, include, orderBy: { created_at: 'desc' } });
  res.json(employees);
};

const show = async (req, res) => {
  const emp = await prisma.employee.findUnique({ where: { employee_id: +req.params.id }, include });
  if (!emp || emp.is_deleted) return res.status(404).json({ error: 'Employee not found.' });
  res.json(emp);
};

const store = async (req, res) => {
  const { first_name, last_name, email, phone, department_id, position_id, supervisor_id,
          employment_type, hire_date, role_id, username, password, team_id } = req.body;

  const exists = await prisma.employee.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already in use.' });

  const userExists = await prisma.user.findUnique({ where: { username } });
  if (userExists) return res.status(409).json({ error: 'Username already taken.' });

  const profile_photo_url = req.file ? `uploads/${req.file.filename}` : null;

  const emp = await prisma.employee.create({
    data: {
      first_name, last_name, email, phone, status: 'Active', profile_photo_url,
      department_id: department_id ? +department_id : null,
      position_id:   position_id   ? +position_id   : null,
      supervisor_id: supervisor_id ? +supervisor_id : null,
      team_id:       team_id       ? +team_id       : null,
      employment_type, hire_date: hire_date ? new Date(hire_date) : null,
    }
  });

  await prisma.user.create({
    data: {
      employee_id: emp.employee_id,
      role_id:     role_id ? +role_id : null,
      username,
      password: await bcrypt.hash(password, 10),
      status: 'active',
    }
  });

  await log(req.user.id, 'create', `Created employee: ${first_name} ${last_name}`, 'employees', emp.employee_id);
  res.status(201).json(emp);
};

const update = async (req, res) => {
  const { first_name, last_name, email, phone, department_id, position_id, supervisor_id,
          employment_type, hire_date, status, role_id, username, password, team_id } = req.body;

  const emp = await prisma.employee.findUnique({ where: { employee_id: +req.params.id }, include: { user: true } });
  if (!emp || emp.is_deleted) return res.status(404).json({ error: 'Employee not found.' });

  const profile_photo_url = req.file ? `uploads/${req.file.filename}` : emp.profile_photo_url;

  const updated = await prisma.employee.update({
    where: { employee_id: +req.params.id },
    data: {
      first_name, last_name, email, phone, status, profile_photo_url,
      department_id: department_id ? +department_id : null,
      position_id:   position_id   ? +position_id   : null,
      supervisor_id: supervisor_id ? +supervisor_id : null,
      team_id:       team_id       ? +team_id       : null,
      employment_type, hire_date: hire_date ? new Date(hire_date) : null,
    }
  });

  if (emp.user) {
    const userUpdate = { role_id: role_id ? +role_id : null, username };
    if (password) userUpdate.password = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: emp.user.id }, data: userUpdate });
  }

  await log(req.user.id, 'update', `Updated employee: ${first_name} ${last_name}`, 'employees', +req.params.id);
  res.json(updated);
};

const destroy = async (req, res) => {
  const emp = await prisma.employee.findUnique({ where: { employee_id: +req.params.id }, include: { user: true } });
  if (!emp || emp.is_deleted) return res.status(404).json({ error: 'Not found.' });

  // Soft-delete: mark as archived, never remove from DB.
  // All related tasks, comments, approvals and activity logs are preserved —
  // the audit trail stays intact even after the employee leaves the company.
  await prisma.employee.update({
    where: { employee_id: +req.params.id },
    data: { is_deleted: true, status: 'Archived' }
  });
  if (emp.user) {
    await prisma.user.update({
      where: { id: emp.user.id },
      data: { is_deleted: true, status: 'inactive' }
    });
  }

  await log(req.user.id, 'archive', `Archived employee: ${emp.first_name} ${emp.last_name}`, 'employees', +req.params.id);
  res.json({ message: 'Employee archived. All historical records are preserved.' });
};

module.exports = { index, show, store, update, destroy };
