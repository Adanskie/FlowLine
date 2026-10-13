const { Op } = require('sequelize');
const { Attendance, Employee, Department } = require('../models');
const { log } = require('../lib/activityLog');

const index = async (req, res) => {
  const user = req.session.user;
  const { employee_id, from, to, attendance_status } = req.query;
  const where = {};

  if (user.role === 'Employee') {
    where.employee_id = +user.employeeId;
  } else if (employee_id) {
    where.employee_id = +employee_id;
  }

  if (from || to) {
    where.date = {};
    if (from) where.date[Op.gte] = from;
    if (to)   where.date[Op.lte] = to;
  }
  if (attendance_status) where.attendance_status = attendance_status;

  const [records, employees] = await Promise.all([
    Attendance.findAll({
      where,
      include: [{ model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] }],
      order: [['date', 'DESC']],
    }),
    user.role !== 'Employee'
      ? Employee.findAll({ where: { is_deleted: false }, order: [['first_name', 'ASC']] })
      : Promise.resolve([]),
  ]);

  const rolePrefix = user.role === 'Administrator' ? 'admin' : user.role === 'Manager' ? 'manager' : 'employee';

  // Today's record for employee self-service
  let todayRecord = null;
  if (user.role === 'Employee') {
    const today = new Date().toISOString().split('T')[0];
    todayRecord = records.find(r => r.date === today) || null;
  }

  res.render(`${rolePrefix}/attendance/index`, {
    title: 'Attendance', records, employees, todayRecord,
    query: req.query, user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

const store = async (req, res) => {
  const { employee_id, date, time_in, time_out, attendance_status } = req.body;
  try {
    const exists = await Attendance.findOne({ where: { employee_id: +employee_id, date } });
    if (exists) { req.flash('error', 'Record already exists for this employee on that date.'); return res.redirect('back'); }
    const rec = await Attendance.create({ employee_id: +employee_id, date, time_in, time_out, attendance_status });
    await log(req.session.user.id, 'create', `Logged attendance for employee ${employee_id}`, 'attendance', rec.attendance_id);
    req.flash('success', 'Attendance logged.');
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('back');
};

const timeIn = async (req, res) => {
  const user  = req.session.user;
  const empId = +user.employeeId;
  const today = new Date().toISOString().split('T')[0];
  try {
    const exists = await Attendance.findOne({ where: { employee_id: empId, date: today } });
    if (exists) { req.flash('error', 'Already timed in today.'); return res.redirect('/employee/attendance'); }
    const now = new Date();
    const ti  = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    await Attendance.create({ employee_id: empId, date: today, time_in: ti, attendance_status: 'Present' });
    req.flash('success', `Timed in at ${ti}.`);
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/employee/attendance');
};

const timeOut = async (req, res) => {
  const user  = req.session.user;
  const empId = +user.employeeId;
  const today = new Date().toISOString().split('T')[0];
  try {
    const rec = await Attendance.findOne({ where: { employee_id: empId, date: today } });
    if (!rec)       { req.flash('error', 'No time-in found for today.'); return res.redirect('/employee/attendance'); }
    if (rec.time_out) { req.flash('error', 'Already timed out today.'); return res.redirect('/employee/attendance'); }
    const now = new Date();
    const to  = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    await rec.update({ time_out: to });
    req.flash('success', `Timed out at ${to}.`);
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/employee/attendance');
};

const update = async (req, res) => {
  const rec = await Attendance.findByPk(+req.params.id);
  if (!rec) { req.flash('error', 'Not found.'); return res.redirect('back'); }
  await rec.update(req.body);
  req.flash('success', 'Updated.');
  res.redirect('back');
};

const destroy = async (req, res) => {
  const rec = await Attendance.findByPk(+req.params.id);
  if (rec) await rec.destroy();
  req.flash('success', 'Deleted.');
  res.redirect('back');
};

module.exports = { index, store, timeIn, timeOut, update, destroy };
