const path = require('path');
const fs   = require('fs');
const { Op } = require('sequelize');
const { Attachment, Task, TaskAssignment, User, Employee } = require('../models');

const index = async (req, res) => {
  const user  = req.session.user;
  const where = { is_deleted: false };

  if (user.role === 'Employee') {
    where['$task.assignments.employee_id$'] = +user.employeeId;
  }
  if (req.query.search) where.file_name = { [Op.like]: `%${req.query.search}%` };

  const includeOpt = user.role === 'Employee'
    ? [
        { model: Task, as: 'task', include: [{ model: TaskAssignment, as: 'assignments', where: { employee_id: +user.employeeId }, required: true }] },
        { model: User, as: 'uploadedBy', include: [{ model: Employee, as: 'employee' }] },
      ]
    : [
        { model: Task, as: 'task' },
        { model: User, as: 'uploadedBy', include: [{ model: Employee, as: 'employee' }] },
      ];

  const files = await Attachment.findAll({
    where: { is_deleted: false, ...(req.query.search ? { file_name: { [Op.like]: `%${req.query.search}%` } } : {}) },
    include: includeOpt,
    order: [['uploaded_at', 'DESC']],
  });

  const rolePrefix = user.role === 'Administrator' ? 'admin' : user.role === 'Manager' ? 'manager' : 'employee';
  res.render(`${rolePrefix}/files/index`, {
    title: 'Files', files, query: req.query, user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

const download = async (req, res) => {
  const user = req.session.user;
  const att  = await Attachment.findOne({ where: { attachment_id: +req.params.id, is_deleted: false } });
  if (!att) { req.flash('error', 'File not found.'); return res.redirect('back'); }

  if (user.role === 'Employee') {
    const assigned = await TaskAssignment.findOne({ where: { task_id: att.task_id, employee_id: +user.employeeId } });
    if (!assigned) { req.flash('error', 'Access denied.'); return res.redirect('back'); }
  }

  const filePath = path.join(__dirname, '../../uploads', path.basename(att.file_path));
  if (!fs.existsSync(filePath)) { req.flash('error', 'File missing from disk.'); return res.redirect('back'); }
  res.download(filePath, att.file_name);
};

const destroy = async (req, res) => {
  const att = await Attachment.findByPk(+req.params.id);
  if (att) {
    const filePath = path.join(__dirname, '../../uploads', path.basename(att.file_path));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await att.update({ is_deleted: true });
    req.flash('success', 'File deleted.');
  }
  res.redirect('back');
};

module.exports = { index, download, destroy };
