const { Op } = require('sequelize');
const {
  Task, WorkflowStage, TaskPriority, TaskAssignment, TaskUpdate,
  TaskStageHistory, TaskComment, Approval, Attachment,
  Employee, User, Department, Position,
} = require('../models');
const { log }  = require('../lib/activityLog');
const { send } = require('../lib/notify');
const upload   = require('../middleware/upload');

// ── Shared include for full task detail ───────────────────────────────────────
const taskDetailInclude = [
  { model: WorkflowStage, as: 'stage' },
  { model: TaskPriority,  as: 'priority' },
  { model: User, as: 'creator', include: [{ model: Employee, as: 'employee' }] },
  {
    model: TaskAssignment, as: 'assignments',
    include: [{ model: Employee, as: 'employee', include: [{ model: Position, as: 'position' }] }],
  },
  { model: TaskUpdate, as: 'updates', order: [['update_date', 'DESC']] },
  {
    model: TaskStageHistory, as: 'stageHistory',
    include: [
      { model: User, as: 'changedBy', include: [{ model: Employee, as: 'employee' }] },
      { model: WorkflowStage, as: 'oldStage' },
      { model: WorkflowStage, as: 'newStage' },
    ],
    order: [['changed_at', 'DESC']],
  },
  {
    model: TaskComment, as: 'comments',
    where: { is_deleted: false }, required: false,
    include: [{ model: User, as: 'user', include: [{ model: Employee, as: 'employee' }] }],
    order: [['created_at', 'ASC']],
  },
  {
    model: Approval, as: 'approvals',
    include: [{ model: User, as: 'approver', include: [{ model: Employee, as: 'employee' }] }],
    order: [['requested_at', 'DESC']],
  },
  {
    model: Attachment, as: 'attachments',
    where: { is_deleted: false }, required: false,
    include: [{ model: User, as: 'uploadedBy', include: [{ model: Employee, as: 'employee' }] }],
  },
];

// ── Helper: get task filter by role ──────────────────────────────────────────
const baseWhere = (user, query = {}) => {
  const where = { is_deleted: false };
  if (user.role === 'Employee') where['$assignments.employee_id$'] = +user.employeeId;
  if (user.role === 'Manager')  where.created_by_user_id = user.id;
  if (query.search)      where.task_title   = { [Op.like]: `%${query.search}%` };
  if (query.priority_id) where.priority_id  = +query.priority_id;
  if (query.stage_id)    where.stage_id     = +query.stage_id;
  return where;
};

// ── Board (Kanban view) ───────────────────────────────────────────────────────
const board = async (req, res) => {
  const user   = req.session.user;
  const where  = baseWhere(user, req.query);
  const baseInclude = [
    { model: WorkflowStage, as: 'stage' },
    { model: TaskPriority,  as: 'priority' },
    {
      model: TaskAssignment, as: 'assignments',
      include: [{ model: Employee, as: 'employee' }],
    },
  ];

  const includeOpt = user.role === 'Employee'
    ? [...baseInclude, { model: TaskAssignment, as: 'assignments', where: { employee_id: +user.employeeId }, required: true, include: [{ model: Employee, as: 'employee' }] }]
    : baseInclude;

  const [tasks, stages, priorities] = await Promise.all([
    Task.findAll({ where, include: includeOpt, order: [['created_at', 'DESC']] }),
    WorkflowStage.findAll({ order: [['step_order', 'ASC']] }),
    TaskPriority.findAll(),
  ]);

  const grouped = {};
  stages.forEach(s => { grouped[s.stage_name] = []; });
  tasks.forEach(t => {
    const sn = t.stage?.stage_name;
    if (sn && grouped[sn] !== undefined) grouped[sn].push(t);
  });

  const rolePrefix = user.role === 'Administrator' ? 'admin' : user.role === 'Manager' ? 'manager' : 'employee';

  res.render(`${rolePrefix}/tasks/board`, {
    title: 'Task Board', grouped, stages, priorities, query: req.query,
    user, success: req.flash('success'), error: req.flash('error'),
  });
};

// ── New Form ──────────────────────────────────────────────────────────────────
const newForm = async (req, res) => {
  const user = req.session.user;
  const [priorities, employees] = await Promise.all([
    TaskPriority.findAll(),
    Employee.findAll({ where: { is_deleted: false }, order: [['first_name', 'ASC']] }),
  ]);
  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';
  res.render(`${rolePrefix}/tasks/form`, {
    title: 'New Task', task: {}, priorities, employees,
    action: `/${rolePrefix}/tasks`, method: 'POST',
    user, error: req.flash('error'),
  });
};

// ── Show ──────────────────────────────────────────────────────────────────────
const show = async (req, res) => {
  const user = req.session.user;
  const task = await Task.findOne({
    where: { task_id: +req.params.id, is_deleted: false },
    include: taskDetailInclude,
  });
  if (!task) { req.flash('error', 'Task not found.'); return res.redirect('back'); }

  const stages = await WorkflowStage.findAll({ order: [['step_order', 'ASC']] });
  const canManage = user.role === 'Administrator' || user.role === 'Manager';
  const rolePrefix = user.role === 'Administrator' ? 'admin' : user.role === 'Manager' ? 'manager' : 'employee';

  res.render(`${rolePrefix}/tasks/show`, {
    title: task.task_title, task, stages, canManage,
    user, success: req.flash('success'), error: req.flash('error'),
  });
};

// ── Edit Form ─────────────────────────────────────────────────────────────────
const editForm = async (req, res) => {
  const user = req.session.user;
  const task = await Task.findOne({
    where: { task_id: +req.params.id, is_deleted: false },
    include: [{ model: TaskAssignment, as: 'assignments' }],
  });
  if (!task) { req.flash('error', 'Task not found.'); return res.redirect('back'); }

  const [priorities, employees] = await Promise.all([
    TaskPriority.findAll(),
    Employee.findAll({ where: { is_deleted: false }, order: [['first_name', 'ASC']] }),
  ]);

  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';
  res.render(`${rolePrefix}/tasks/form`, {
    title: 'Edit Task', task, priorities, employees,
    action: `/${rolePrefix}/tasks/${task.task_id}?_method=PUT`, method: 'POST',
    user, error: req.flash('error'),
  });
};

// ── Create ────────────────────────────────────────────────────────────────────
const store = async (req, res) => {
  const user = req.session.user;
  const { task_title, task_description, priority_id, start_date, due_date, employee_ids } = req.body;
  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';

  try {
    const pendingStage = await WorkflowStage.findOne({ where: { stage_name: 'Pending' } });
    const ids = Array.isArray(employee_ids) ? employee_ids.map(Number)
              : employee_ids ? JSON.parse(employee_ids) : [];

    const task = await Task.create({
      stage_id: pendingStage.stage_id,
      task_title, task_description,
      priority_id:        +priority_id,
      start_date:         start_date ? new Date(start_date) : null,
      due_date:           new Date(due_date),
      created_by_user_id: user.id,
    });

    await TaskStageHistory.create({
      task_id: task.task_id, changed_by_user_id: user.id,
      new_stage_id: pendingStage.stage_id, remarks: 'Task created.',
    });

    const notifyUserIds = [];
    for (const empId of ids) {
      await TaskAssignment.create({ task_id: task.task_id, employee_id: empId, assigned_by_user_id: user.id });
      const emp = await Employee.findByPk(empId, { include: [{ model: User, as: 'user' }] });
      if (emp?.user) notifyUserIds.push(emp.user.id);
    }

    if (req.files?.length) {
      for (const file of req.files) {
        await Attachment.create({
          task_id: task.task_id, uploaded_by_user_id: user.id,
          file_name: file.originalname, file_path: `uploads/${file.filename}`,
          file_type: file.originalname.split('.').pop(),
        });
      }
    }

    if (notifyUserIds.length) {
      await send(notifyUserIds, 'assignment', 'New Task Assigned', `You have been assigned: "${task_title}".`, task.task_id, user.id);
    }

    await log(user.id, 'create', `Created task: ${task_title}`, 'tasks', task.task_id);
    req.flash('success', 'Task created.');
    res.redirect(`/${rolePrefix}/tasks`);
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/${rolePrefix}/tasks/new`);
  }
};

// ── Update ────────────────────────────────────────────────────────────────────
const update = async (req, res) => {
  const user = req.session.user;
  const id   = +req.params.id;
  const { task_title, task_description, priority_id, start_date, due_date, employee_ids } = req.body;
  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';

  try {
    const task = await Task.findOne({
      where: { task_id: id, is_deleted: false },
      include: [{ model: TaskAssignment, as: 'assignments' }],
    });
    if (!task) { req.flash('error', 'Task not found.'); return res.redirect(`/${rolePrefix}/tasks`); }

    await task.update({
      task_title, task_description,
      priority_id:       +priority_id,
      start_date:        start_date ? new Date(start_date) : null,
      due_date:          new Date(due_date),
      updated_by_user_id: user.id,
    });

    if (employee_ids !== undefined) {
      const newIds = (Array.isArray(employee_ids) ? employee_ids : JSON.parse(employee_ids || '[]')).map(Number);
      const existing = task.assignments.map(a => a.employee_id);
      const toRemove = existing.filter(eid => !newIds.includes(eid));
      const toAdd    = newIds.filter(eid => !existing.includes(eid));
      if (toRemove.length) await TaskAssignment.destroy({ where: { task_id: id, employee_id: { [Op.in]: toRemove } } });
      for (const empId of toAdd) {
        await TaskAssignment.create({ task_id: id, employee_id: empId, assigned_by_user_id: user.id });
      }
    }

    await log(user.id, 'update', `Updated task: ${task_title}`, 'tasks', id);
    req.flash('success', 'Task updated.');
    res.redirect(`/${rolePrefix}/tasks`);
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/${rolePrefix}/tasks/${id}/edit`);
  }
};

// ── Delete ────────────────────────────────────────────────────────────────────
const destroy = async (req, res) => {
  const user = req.session.user;
  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';
  await Task.update({ is_deleted: true }, { where: { task_id: +req.params.id } });
  await log(user.id, 'delete', `Deleted task id ${req.params.id}`, 'tasks', +req.params.id);
  req.flash('success', 'Task deleted.');
  res.redirect(`/${rolePrefix}/tasks`);
};

// ── Change Stage (Admin/Manager) ──────────────────────────────────────────────
const changeStage = async (req, res) => {
  const user = req.session.user;
  const id   = +req.params.id;
  const { stage_id, remarks } = req.body;
  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';

  const task = await Task.findOne({
    where: { task_id: id, is_deleted: false },
    include: [{ model: TaskAssignment, as: 'assignments', include: [{ model: Employee, as: 'employee', include: [{ model: User, as: 'user' }] }] }],
  });
  if (!task) { req.flash('error', 'Task not found.'); return res.redirect('back'); }

  const oldStageId = task.stage_id;
  await task.update({ stage_id: +stage_id, updated_by_user_id: user.id });
  await TaskStageHistory.create({ task_id: id, changed_by_user_id: user.id, old_stage_id: oldStageId, new_stage_id: +stage_id, remarks });

  const stage = await WorkflowStage.findByPk(+stage_id);
  const uids  = task.assignments.map(a => a.employee?.user?.id).filter(Boolean);
  if (uids.length) await send(uids, 'status', 'Task Stage Updated', `Task "${task.task_title}" moved to ${stage.stage_name}.`, id, user.id);
  await log(user.id, 'update', `Changed task ${id} to ${stage.stage_name}`, 'tasks', id);

  req.flash('success', `Stage changed to ${stage.stage_name}.`);
  res.redirect(`/${rolePrefix}/tasks/${id}`);
};

// ── Approve (Admin/Manager) ───────────────────────────────────────────────────
const approve = async (req, res) => {
  const user = req.session.user;
  const id   = +req.params.id;
  const { approval_status, remarks } = req.body;
  const rolePrefix = user.role === 'Administrator' ? 'admin' : 'manager';

  const task = await Task.findOne({
    where: { task_id: id, is_deleted: false },
    include: [{ model: TaskAssignment, as: 'assignments', include: [{ model: Employee, as: 'employee', include: [{ model: User, as: 'user' }] }] }],
  });
  if (!task) { req.flash('error', 'Not found.'); return res.redirect('back'); }

  await Approval.create({ task_id: id, approver_user_id: user.id, approval_status, remarks, approval_date: new Date() });

  const stageName = approval_status === 'Approved' ? 'Completed' : 'In Progress';
  const newStage  = await WorkflowStage.findOne({ where: { stage_name: stageName } });
  await task.update({ stage_id: newStage.stage_id, updated_by_user_id: user.id });
  await TaskStageHistory.create({
    task_id: id, changed_by_user_id: user.id,
    old_stage_id: task.stage_id, new_stage_id: newStage.stage_id,
    remarks: approval_status === 'Approved' ? 'Approved.' : 'Returned for revision.',
  });

  const uids = task.assignments.map(a => a.employee?.user?.id).filter(Boolean);
  if (uids.length) {
    await send(uids, 'approval', 'Task Review Decision',
      `Task "${task.task_title}": ${approval_status}.${remarks ? ` Remarks: ${remarks}` : ''}`, id, user.id);
  }
  await log(user.id, 'approval', `Reviewed task ${id}: ${approval_status}`, 'tasks', id);
  req.flash('success', `Task ${approval_status}.`);
  res.redirect(`/${rolePrefix}/tasks/${id}`);
};

// ── Submit for Review (Employee) ──────────────────────────────────────────────
const submitForReview = async (req, res) => {
  const user = req.session.user;
  const id   = +req.params.id;

  const task  = await Task.findByPk(id);
  if (!task) { req.flash('error', 'Not found.'); return res.redirect('back'); }
  const stage = await WorkflowStage.findOne({ where: { stage_name: 'For Review' } });

  await task.update({ stage_id: stage.stage_id, updated_by_user_id: user.id });
  await TaskStageHistory.create({
    task_id: id, changed_by_user_id: user.id,
    old_stage_id: task.stage_id, new_stage_id: stage.stage_id, remarks: 'Submitted for review.',
  });
  await send([task.created_by_user_id], 'approval', 'Task Ready for Review',
    `Task "${task.task_title}" was submitted for review.`, id, user.id);
  await log(user.id, 'update', `Submitted task ${id} for review`, 'tasks', id);

  req.flash('success', 'Submitted for review.');
  res.redirect(`/employee/tasks/${id}`);
};

// ── Post Progress (Employee) ──────────────────────────────────────────────────
const postProgress = async (req, res) => {
  const user = req.session.user;
  const id   = +req.params.id;
  const { update_message, progress_percent } = req.body;

  const task = await Task.findByPk(id);
  if (!task) { req.flash('error', 'Not found.'); return res.redirect('back'); }

  await TaskUpdate.create({ task_id: id, employee_id: +user.employeeId, update_message, progress_percent: +progress_percent });

  const pending    = await WorkflowStage.findOne({ where: { stage_name: 'Pending' } });
  const inProgress = await WorkflowStage.findOne({ where: { stage_name: 'In Progress' } });
  if (task.stage_id === pending.stage_id) {
    await task.update({ stage_id: inProgress.stage_id });
    await TaskStageHistory.create({
      task_id: id, changed_by_user_id: user.id,
      old_stage_id: pending.stage_id, new_stage_id: inProgress.stage_id, remarks: 'Progress update posted.',
    });
  }

  await log(user.id, 'update', `Posted progress on task ${id}`, 'task_updates', id);
  req.flash('success', 'Progress saved.');
  res.redirect(`/employee/tasks/${id}`);
};

// ── Add Comment ───────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
  const user = req.session.user;
  const id   = +req.params.id;
  await TaskComment.create({ task_id: id, user_id: user.id, comment_text: req.body.comment_text });
  req.flash('success', 'Comment added.');
  res.redirect('back');
};

// ── Delete Comment ────────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  await TaskComment.update({ is_deleted: true }, { where: { comment_id: +req.params.cid } });
  req.flash('success', 'Comment removed.');
  res.redirect('back');
};

// ── Upload Attachment ─────────────────────────────────────────────────────────
const uploadAttachment = async (req, res) => {
  const user = req.session.user;
  const id   = +req.params.id;
  if (!req.file) { req.flash('error', 'No file provided.'); return res.redirect('back'); }
  await Attachment.create({
    task_id: id, uploaded_by_user_id: user.id,
    file_name: req.file.originalname,
    file_path: `uploads/${req.file.filename}`,
    file_type: req.file.originalname.split('.').pop(),
  });
  req.flash('success', 'File uploaded.');
  res.redirect('back');
};

module.exports = {
  board, newForm, show, editForm, store, update, destroy,
  changeStage, approve, submitForReview, postProgress,
  addComment, deleteComment, uploadAttachment,
};
