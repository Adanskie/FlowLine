const router  = require('express').Router();
const prisma  = require('../lib/prisma');
const { log } = require('../lib/activityLog');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// List (Admin/Manager: all; Employee: own)
router.get('/', async (req, res) => {
  const { employee_id, from, to, attendance_status } = req.query;
  const where = {};
  if (req.user.role === 'Employee') where.employee_id = +req.user.employeeId;
  else if (employee_id) where.employee_id = +employee_id;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to)   where.date.lte = new Date(to);
  }
  if (attendance_status) where.attendance_status = attendance_status;
  const records = await prisma.attendance.findMany({ where, include: { employee: { include: { department: true } } }, orderBy: { date: 'desc' } });
  res.json(records);
});

// Create
router.post('/', authorize('Administrator','Manager'), async (req, res) => {
  const { employee_id, date, time_in, time_out, attendance_status } = req.body;
  const exists = await prisma.attendance.findFirst({ where: { employee_id: +employee_id, date: new Date(date) } });
  if (exists) return res.status(409).json({ error: 'Record already exists for this employee on that date.' });
  const rec = await prisma.attendance.create({ data: { employee_id: +employee_id, date: new Date(date), time_in, time_out, attendance_status } });
  await log(req.user.id, 'create', `Logged attendance for employee ${employee_id}`, 'attendance', rec.attendance_id);
  res.status(201).json(rec);
});

// Employee self time-in
router.post('/time-in', authorize('Employee'), async (req, res) => {
  const empId = +req.user.employeeId;
  const today = new Date(); today.setHours(0,0,0,0);
  const exists = await prisma.attendance.findFirst({ where: { employee_id: empId, date: today } });
  if (exists) return res.status(409).json({ error: 'Already timed in today.' });
  const now = new Date();
  const rec = await prisma.attendance.create({ data: { employee_id: empId, date: today, time_in: `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`, attendance_status: 'Present' } });
  res.status(201).json(rec);
});

// Employee self time-out
router.post('/time-out', authorize('Employee'), async (req, res) => {
  const empId = +req.user.employeeId;
  const today = new Date(); today.setHours(0,0,0,0);
  const rec = await prisma.attendance.findFirst({ where: { employee_id: empId, date: today } });
  if (!rec) return res.status(404).json({ error: 'No time-in found for today.' });
  if (rec.time_out) return res.status(409).json({ error: 'Already timed out today.' });
  const now = new Date();
  const updated = await prisma.attendance.update({ where: { attendance_id: rec.attendance_id }, data: { time_out: `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}` } });
  res.json(updated);
});

// Update / Delete
router.put('/:id',    authorize('Administrator','Manager'), async (req, res) => {
  const rec = await prisma.attendance.update({ where: { attendance_id: +req.params.id }, data: req.body });
  res.json(rec);
});
router.delete('/:id', authorize('Administrator'), async (req, res) => {
  await prisma.attendance.delete({ where: { attendance_id: +req.params.id } });
  res.json({ message: 'Deleted.' });
});

module.exports = router;
