const router  = require('express').Router();
const prisma  = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const completedStage  = await prisma.workflowStage.findFirst({ where: { stage_name: 'Completed' } });
  const forReviewStage  = await prisma.workflowStage.findFirst({ where: { stage_name: 'For Review' } });
  const completedId     = completedStage?.stage_id;
  const today           = new Date().toISOString().split('T')[0];

  const isAdmin   = req.user.role === 'Administrator';
  const isManager = req.user.role === 'Manager';
  const isEmp     = req.user.role === 'Employee';

  // ── Common stage counts ───────────────────────────────────────────────────
  const taskWhere = { is_deleted: false };
  if (isManager) taskWhere.created_by_user_id = req.user.id;
  if (isEmp)     taskWhere.assignments = { some: { employee_id: +req.user.employeeId } };

  const stages   = await prisma.workflowStage.findMany({ orderBy: { step_order: 'asc' } });
  const stageCounts = await Promise.all(stages.map(async s => ({
    stage: s.stage_name,
    count: await prisma.task.count({ where: { ...taskWhere, stage_id: s.stage_id } })
  })));

  const totalTasks     = stageCounts.reduce((a, s) => a + s.count, 0);
  const completedCount = stageCounts.find(s => s.stage === 'Completed')?.count ?? 0;
  const overdueCount   = await prisma.task.count({ where: { ...taskWhere, due_date: { lt: new Date() }, stage_id: { not: completedId } } });

  // ── Weekly completions chart (last 7 days) ────────────────────────────────
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); sevenDaysAgo.setHours(0,0,0,0);
  const weeklyRaw = await prisma.task.findMany({
    where: { ...taskWhere, stage_id: completedId, updated_at: { gte: sevenDaysAgo } },
    select: { updated_at: true }
  });
  const weeklyMap = {};
  weeklyRaw.forEach(t => { const d = t.updated_at.toISOString().split('T')[0]; weeklyMap[d] = (weeklyMap[d] || 0) + 1; });
  const weeklyChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { date: key, label: d.toLocaleDateString('en',{ weekday:'short' }), count: weeklyMap[key] || 0 };
  });

  // ── Team Workload ─────────────────────────────────────────────────────────
  let teamWorkload = [];
  if (isAdmin || isManager) {
    const workloadWhere = isManager ? { created_by_user_id: req.user.id } : {};
    const raw = await prisma.taskAssignment.groupBy({
      by: ['employee_id'],
      where: { task: { ...workloadWhere, is_deleted: false, stage_id: { not: completedId } } },
      _count: { task_id: true }
    });
    const empIds = raw.map(r => r.employee_id);
    const emps   = await prisma.employee.findMany({ where: { employee_id: { in: empIds }, is_deleted: false }, select: { employee_id: true, first_name: true, last_name: true } });
    const overdueMap = await prisma.taskAssignment.groupBy({
      by: ['employee_id'],
      where: { task: { ...workloadWhere, is_deleted: false, stage_id: { not: completedId }, due_date: { lt: new Date() } } },
      _count: { task_id: true }
    });
    const overdueById = Object.fromEntries(overdueMap.map(r => [r.employee_id, r._count.task_id]));
    teamWorkload = raw.map(r => {
      const emp = emps.find(e => e.employee_id === r.employee_id);
      return { employee_id: r.employee_id, name: emp ? `${emp.first_name} ${emp.last_name}` : '?', first_name: emp?.first_name ?? '', active_tasks: r._count.task_id, overdue_tasks: overdueById[r.employee_id] ?? 0 };
    }).sort((a, b) => b.active_tasks - a.active_tasks);
  }

  // ── Admin extras ──────────────────────────────────────────────────────────
  let totalEmployees = 0, presentToday = 0, forReviewCount = 0;
  if (isAdmin) {
    totalEmployees = await prisma.employee.count({ where: { is_deleted: false } });
    presentToday   = await prisma.attendance.count({ where: { date: new Date(today), attendance_status: 'Present' } });
    forReviewCount = stageCounts.find(s => s.stage === 'For Review')?.count ?? 0;
  }

  // ── Manager extras ────────────────────────────────────────────────────────
  let pendingApproval = 0;
  if (isManager) {
    pendingApproval = await prisma.task.count({ where: { created_by_user_id: req.user.id, stage_id: forReviewStage?.stage_id, is_deleted: false } });
  }

  // ── Recent tasks ──────────────────────────────────────────────────────────
  const recentTasks = await prisma.task.findMany({
    where: { ...taskWhere },
    include: { stage: true, priority: true, assignments: { include: { employee: true }, take: 3 } },
    orderBy: { created_at: 'desc' }, take: 6
  });

  res.json({ totalTasks, completedCount, overdueCount, stageCounts, weeklyChart, teamWorkload, totalEmployees, presentToday, pendingApproval, forReviewCount, recentTasks });
});

module.exports = router;
