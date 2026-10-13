const { Op } = require('sequelize');
const { Department, Employee } = require('../models');
const { log } = require('../lib/activityLog');

const index = async (req, res) => {
  const departments = await Department.findAll({
    where: { is_deleted: false },
    include: [{ model: Employee, as: 'employees', where: { is_deleted: false }, required: false }],
    order: [['department_name', 'ASC']],
  });
  res.render('admin/departments/index', {
    title: 'Departments', departments, user: req.session.user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

const store = async (req, res) => {
  const { department_name, description } = req.body;
  try {
    const exists = await Department.findOne({ where: { department_name, is_deleted: false } });
    if (exists) { req.flash('error', 'Department already exists.'); return res.redirect('/admin/departments'); }
    const dept = await Department.create({ department_name, description });
    await log(req.session.user.id, 'create', `Created department: ${department_name}`, 'departments', dept.department_id);
    req.flash('success', 'Department created.');
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/admin/departments');
};

const update = async (req, res) => {
  const { department_name, description } = req.body;
  try {
    const dept = await Department.findByPk(+req.params.id);
    if (!dept) { req.flash('error', 'Not found.'); return res.redirect('/admin/departments'); }
    await dept.update({ department_name, description });
    await log(req.session.user.id, 'update', `Updated department: ${department_name}`, 'departments', dept.department_id);
    req.flash('success', 'Department updated.');
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/admin/departments');
};

const destroy = async (req, res) => {
  const dept = await Department.findByPk(+req.params.id);
  if (dept) {
    await dept.update({ is_deleted: true });
    await log(req.session.user.id, 'delete', `Deleted department id ${req.params.id}`, 'departments', dept.department_id);
    req.flash('success', 'Department deleted.');
  }
  res.redirect('/admin/departments');
};

module.exports = { index, store, update, destroy };
