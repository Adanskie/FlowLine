const router  = require('express').Router();
const prisma  = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const ExcelJS = require('exceljs');

router.use(authenticate, authorize('Administrator','Manager'));

router.get('/', async (req, res) => {
  const { date_from, date_to, department_id, employee_id } = req.query;
  const from = date_from ? new Date(date_from) : new Date(new Date().setDate(1));
  const to   = date_to   ? new Date(date_to)   : new Date();
  to.setHours(23,59,59,999);

  const completedStage = await prisma.workflowStage.findFirst({ where: { stage_name: 'Completed' } });
  const completedId    = completedStage?.stage_id;

  const taskWhere = { is_deleted: false, created_at: { gte: from, lte: to } };
  if (req.user.role === 'Manager') taskWhere.created_by_user_id = req.user.id;
  if (employee_id) taskWhere.assignments = { some: { employee_id: +employee_id } };

  const totalTasks     = await prisma.task.count({ where: taskWhere });
  const completedTasks = await prisma.task.count({ where: { ...taskWhere, stage_id: completedId } });
  const overdueTasks   = await prisma.task.count({ where: { ...taskWhere, due_date: { lt: new Date() }, stage_id: { not: completedId } } });
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Employee performance
  const employees = await prisma.employee.findMany({
    where: { is_deleted: false, ...(department_id ? { department_id: +department_id } : {}) },
    include: { department: true, position: true }
  });

  const performance = await Promise.all(employees.map(async emp => {
    const ids      = (await prisma.taskAssignment.findMany({ where: { employee_id: emp.employee_id }, select: { task_id: true } })).map(a => a.task_id);
    const assigned  = await prisma.task.count({ where: { task_id: { in: ids }, is_deleted: false, created_at: { gte: from, lte: to } } });
    const completed = await prisma.task.count({ where: { task_id: { in: ids }, stage_id: completedId, is_deleted: false } });
    const overdue   = await prisma.task.count({ where: { task_id: { in: ids }, due_date: { lt: new Date() }, stage_id: { not: completedId }, is_deleted: false } });
    return { employee: emp, assigned, completed, overdue, completion_rate: assigned > 0 ? Math.round(completed / assigned * 100) : 0 };
  }));

  const stages     = await prisma.workflowStage.findMany({ orderBy: { step_order: 'asc' } });
  const stageCounts = await Promise.all(stages.map(async s => ({ stage: s.stage_name, count: await prisma.task.count({ where: { ...taskWhere, stage_id: s.stage_id } }) })));

  const priorities     = await prisma.taskPriority.findMany();
  const priorityCounts = await Promise.all(priorities.map(async p => ({ priority: p.priority_name, count: await prisma.task.count({ where: { ...taskWhere, priority_id: p.priority_id } }) })));

  const attendanceSummary = await prisma.attendance.groupBy({
    by: ['attendance_status'],
    where: { date: { gte: from, lte: to } },
    _count: { attendance_id: true }
  });

  res.json({ totalTasks, completedTasks, overdueTasks, completionRate, performance: performance.sort((a,b) => b.completion_rate - a.completion_rate), stageCounts, priorityCounts, attendanceSummary, dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] });
});

// Excel export
router.get('/export/excel', async (req, res) => {
  const data = await getReportData(req);
  const wb   = new ExcelJS.Workbook();
  wb.creator  = 'Flowline';
  wb.created  = new Date();

  const summary = wb.addWorksheet('Summary');
  summary.addRow(['Flowline — Performance Report']);
  summary.addRow(['Period', `${data.dateFrom} to ${data.dateTo}`]);
  summary.addRow([]);
  summary.addRow(['Metric', 'Value']);
  summary.addRows([['Total Tasks', data.totalTasks],['Completed', data.completedTasks],['Overdue', data.overdueTasks],['Completion Rate', `${data.completionRate}%`]]);

  const perf = wb.addWorksheet('Employee Performance');
  perf.addRow(['Employee','Department','Assigned','Completed','Overdue','Rate %']);
  data.performance.forEach(r => perf.addRow([r.employee.first_name + ' ' + r.employee.last_name, r.employee.department?.department_name ?? '', r.assigned, r.completed, r.overdue, r.completion_rate]));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="flowline-report-${data.dateFrom}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

async function getReportData(req) {
  // Re-uses the same logic — simplified inline for DRY brevity
  const { date_from, date_to } = req.query;
  const from = date_from ? new Date(date_from) : new Date(new Date().setDate(1));
  const to   = date_to   ? new Date(date_to)   : new Date(); to.setHours(23,59,59,999);
  const completedStage = await prisma.workflowStage.findFirst({ where: { stage_name: 'Completed' } });
  const completedId = completedStage?.stage_id;
  const taskWhere = { is_deleted: false, created_at: { gte: from, lte: to } };
  if (req.user.role === 'Manager') taskWhere.created_by_user_id = req.user.id;
  const totalTasks     = await prisma.task.count({ where: taskWhere });
  const completedTasks = await prisma.task.count({ where: { ...taskWhere, stage_id: completedId } });
  const overdueTasks   = await prisma.task.count({ where: { ...taskWhere, due_date: { lt: new Date() }, stage_id: { not: completedId } } });
  const completionRate = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const employees      = await prisma.employee.findMany({ where: { is_deleted: false }, include: { department: true } });
  const performance    = await Promise.all(employees.map(async emp => {
    const ids      = (await prisma.taskAssignment.findMany({ where: { employee_id: emp.employee_id }, select: { task_id: true } })).map(a => a.task_id);
    const assigned  = await prisma.task.count({ where: { task_id: { in: ids }, is_deleted: false, created_at: { gte: from, lte: to } } });
    const completed = await prisma.task.count({ where: { task_id: { in: ids }, stage_id: completedId, is_deleted: false } });
    const overdue   = await prisma.task.count({ where: { task_id: { in: ids }, due_date: { lt: new Date() }, stage_id: { not: completedId }, is_deleted: false } });
    return { employee: emp, assigned, completed, overdue, completion_rate: assigned > 0 ? Math.round(completed / assigned * 100) : 0 };
  }));
  return { totalTasks, completedTasks, overdueTasks, completionRate, performance, dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] };
}

module.exports = router;
