const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const {
  Task, WorkflowStage, TaskPriority, TaskAssignment,
  Employee, Department, Attendance,
} = require('../models');

async function buildReportData(user, query) {
  const { date_from, date_to, department_id, employee_id } = query;
  const from = date_from ? new Date(date_from) : new Date(new Date().setDate(1));
  const to   = date_to   ? new Date(date_to)   : new Date();
  to.setHours(23, 59, 59, 999);

  const completedStage = await WorkflowStage.findOne({ where: { stage_name: 'Completed' } });
  const completedId    = completedStage?.stage_id;

  const taskWhere = { is_deleted: false, created_at: { [Op.between]: [from, to] } };
  if (user.role === 'Manager') taskWhere.created_by_user_id = user.id;

  const totalTasks     = await Task.count({ where: taskWhere });
  const completedTasks = await Task.count({ where: { ...taskWhere, stage_id: completedId } });
  const overdueTasks   = await Task.count({ where: { ...taskWhere, due_date: { [Op.lt]: new Date() }, stage_id: { [Op.ne]: completedId } } });
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const empWhere = { is_deleted: false };
  if (department_id) empWhere.department_id = +department_id;

  const employees = await Employee.findAll({
    where: empWhere,
    include: [{ model: Department, as: 'department' }],
  });

  const performance = await Promise.all(employees.map(async emp => {
    const assignments = await TaskAssignment.findAll({ where: { employee_id: emp.employee_id }, attributes: ['task_id'] });
    const taskIds = assignments.map(a => a.task_id);
    if (!taskIds.length) return { employee: emp, assigned: 0, completed: 0, overdue: 0, completion_rate: 0 };

    const assigned  = await Task.count({ where: { task_id: { [Op.in]: taskIds }, is_deleted: false, created_at: { [Op.between]: [from, to] } } });
    const completed = await Task.count({ where: { task_id: { [Op.in]: taskIds }, stage_id: completedId, is_deleted: false } });
    const overdue   = await Task.count({ where: { task_id: { [Op.in]: taskIds }, due_date: { [Op.lt]: new Date() }, stage_id: { [Op.ne]: completedId }, is_deleted: false } });

    return { employee: emp, assigned, completed, overdue, completion_rate: assigned > 0 ? Math.round(completed / assigned * 100) : 0 };
  }));

  const stages      = await WorkflowStage.findAll({ order: [['step_order', 'ASC']] });
  const stageCounts = await Promise.all(stages.map(async s => ({
    stage: s.stage_name,
    count: await Task.count({ where: { ...taskWhere, stage_id: s.stage_id } }),
  })));

  const priorities     = await TaskPriority.findAll();
  const priorityCounts = await Promise.all(priorities.map(async p => ({
    priority: p.priority_name,
    count: await Task.count({ where: { ...taskWhere, priority_id: p.priority_id } }),
  })));

  const attendanceRaw = await Attendance.findAll({
    where: { date: { [Op.between]: [from, to] } },
    attributes: ['attendance_status'],
  });
  const attendanceSummary = {};
  attendanceRaw.forEach(r => {
    attendanceSummary[r.attendance_status] = (attendanceSummary[r.attendance_status] || 0) + 1;
  });

  const departments = await Department.findAll({ where: { is_deleted: false }, order: [['department_name', 'ASC']] });
  const empList     = await Employee.findAll({ where: { is_deleted: false }, order: [['first_name', 'ASC']] });

  return {
    totalTasks, completedTasks, overdueTasks, completionRate,
    performance: performance.sort((a, b) => b.completion_rate - a.completion_rate),
    stageCounts, priorityCounts, attendanceSummary,
    dateFrom: from.toISOString().split('T')[0],
    dateTo:   to.toISOString().split('T')[0],
    departments, employees: empList,
  };
}

const index = async (req, res) => {
  const user = req.session.user;
  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';

  const data = await buildReportData(user, req.query);
  res.render(`${rolePrefix}/reports/index`, {
    title: 'Reports', ...data, query: req.query, user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

const exportExcel = async (req, res) => {
  const user = req.session.user;
  const data = await buildReportData(user, req.query);

  const wb   = new ExcelJS.Workbook();
  wb.creator = 'Flowline';
  wb.created = new Date();

  const summary = wb.addWorksheet('Summary');
  summary.addRow(['Flowline — Performance Report']);
  summary.addRow(['Period', `${data.dateFrom} to ${data.dateTo}`]);
  summary.addRow([]);
  summary.addRow(['Metric', 'Value']);
  summary.addRows([
    ['Total Tasks',      data.totalTasks],
    ['Completed',        data.completedTasks],
    ['Overdue',          data.overdueTasks],
    ['Completion Rate',  `${data.completionRate}%`],
  ]);

  const perf = wb.addWorksheet('Employee Performance');
  perf.addRow(['Employee', 'Department', 'Assigned', 'Completed', 'Overdue', 'Rate %']);
  data.performance.forEach(r => perf.addRow([
    `${r.employee.first_name} ${r.employee.last_name}`,
    r.employee.department?.department_name ?? '',
    r.assigned, r.completed, r.overdue, r.completion_rate,
  ]));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="flowline-report-${data.dateFrom}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
};

module.exports = { index, exportExcel };
