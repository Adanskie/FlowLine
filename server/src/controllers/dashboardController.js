const { Op } = require('sequelize');
const {
  Task, WorkflowStage, TaskAssignment, Employee,
  Attendance, Notification,
} = require('../models');

const show = async (req, res) => {
  const user      = req.session.user;
  const isAdmin   = user.role === 'Administrator';
  const isManager = user.role === 'Manager';
  const isEmp     = user.role === 'Employee';

  const completedStage = await WorkflowStage.findOne({ where: { stage_name: 'Completed' } });
  const forReviewStage = await WorkflowStage.findOne({ where: { stage_name: 'For Review' } });
  const completedId    = completedStage?.stage_id;

  // ── Task filter by role ───────────────────────────────────────────────────
  const taskWhere = { is_deleted: false };
  if (isManager) taskWhere.created_by_user_id = user.id;

  // For employees we need a subquery via TaskAssignment
  const employeeTaskIds = isEmp
    ? (await TaskAssignment.findAll({ where: { employee_id: +user.employeeId }, attributes: ['task_id'] })).map(a => a.task_id)
    : null;

  if (isEmp) taskWhere.task_id = { [Op.in]: employeeTaskIds || [] };

  // ── Stage counts ──────────────────────────────────────────────────────────
  const stages      = await WorkflowStage.findAll({ order: [['step_order', 'ASC']] });
  const stageCounts = await Promise.all(stages.map(async s => ({
    stage: s.stage_name,
    count: await Task.count({ where: { ...taskWhere, stage_id: s.stage_id } }),
  })));

  const totalTasks     = stageCounts.reduce((a, s) => a + s.count, 0);
  const completedCount = stageCounts.find(s => s.stage === 'Completed')?.count ?? 0;
  const overdueCount   = await Task.count({ where: { ...taskWhere, due_date: { [Op.lt]: new Date() }, stage_id: { [Op.ne]: completedId } } });

  // ── Weekly completions (last 7 days) ──────────────────────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyRaw = await Task.findAll({
    where: { ...taskWhere, stage_id: completedId, updated_at: { [Op.gte]: sevenDaysAgo } },
    attributes: ['updated_at'],
  });
  const weeklyMap = {};
  weeklyRaw.forEach(t => {
    const d = t.updated_at.toISOString().split('T')[0];
    weeklyMap[d] = (weeklyMap[d] || 0) + 1;
  });
  const weeklyChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key   = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    return { date: key, label, count: weeklyMap[key] || 0 };
  });

  // ── Team Workload ─────────────────────────────────────────────────────────
  let teamWorkload = [];
  if (isAdmin || isManager) {
    const workloadTaskWhere = { ...taskWhere, stage_id: { [Op.ne]: completedId } };
    const assignments = await TaskAssignment.findAll({
      include: [{ model: Task, as: 'task', where: workloadTaskWhere, required: true, attributes: [] }],
      attributes: ['employee_id'],
    });

    const countByEmp = {};
    assignments.forEach(a => { countByEmp[a.employee_id] = (countByEmp[a.employee_id] || 0) + 1; });

    const empIds = Object.keys(countByEmp).map(Number);
    const emps   = await Employee.findAll({ where: { employee_id: { [Op.in]: empIds }, is_deleted: false } });

    const overdueAssign = await TaskAssignment.findAll({
      include: [{
        model: Task, as: 'task',
        where: { ...workloadTaskWhere, due_date: { [Op.lt]: new Date() } },
        required: true, attributes: [],
      }],
      attributes: ['employee_id'],
    });
    const overdueByEmp = {};
    overdueAssign.forEach(a => { overdueByEmp[a.employee_id] = (overdueByEmp[a.employee_id] || 0) + 1; });

    teamWorkload = emps.map(emp => ({
      employee_id:  emp.employee_id,
      name:         `${emp.first_name} ${emp.last_name}`,
      active_tasks: countByEmp[emp.employee_id] ?? 0,
      overdue_tasks: overdueByEmp[emp.employee_id] ?? 0,
    })).sort((a, b) => b.active_tasks - a.active_tasks);
  }

  // ── Admin extras ──────────────────────────────────────────────────────────
  let totalEmployees = 0, presentToday = 0, forReviewCount = 0;
  if (isAdmin) {
    const today = new Date().toISOString().split('T')[0];
    totalEmployees = await Employee.count({ where: { is_deleted: false } });
    presentToday   = await Attendance.count({ where: { date: today, attendance_status: 'Present' } });
    forReviewCount = stageCounts.find(s => s.stage === 'For Review')?.count ?? 0;
  }

  // ── Manager extras ────────────────────────────────────────────────────────
  let pendingApproval = 0;
  if (isManager && forReviewStage) {
    pendingApproval = await Task.count({ where: { created_by_user_id: user.id, stage_id: forReviewStage.stage_id, is_deleted: false } });
  }

  // ── Recent tasks ──────────────────────────────────────────────────────────
  const recentTasks = await Task.findAll({
    where: taskWhere,
    include: [
      { model: WorkflowStage, as: 'stage' },
      { model: require('../models').TaskPriority, as: 'priority' },
      { model: TaskAssignment, as: 'assignments', include: [{ model: Employee, as: 'employee' }], limit: 3 },
    ],
    order: [['created_at', 'DESC']],
    limit: 6,
  });

  // Refresh unread count in session
  const unreadCount = await Notification.count({ where: { user_id: user.id, is_read: false } });
  req.session.user.unreadCount = unreadCount;

  const rolePrefix = isAdmin ? 'admin' : isManager ? 'manager' : 'employee';
  res.render(`${rolePrefix}/dashboard`, {
    title: 'Dashboard',
    totalTasks, completedCount, overdueCount,
    stageCounts, weeklyChart, teamWorkload,
    totalEmployees, presentToday, pendingApproval, forReviewCount,
    recentTasks, user: req.session.user,
  });
};

module.exports = { show };
