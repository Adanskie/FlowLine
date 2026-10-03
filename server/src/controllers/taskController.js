const prisma  = require('../lib/prisma');
const { log } = require('../lib/activityLog');
const { send } = require('../lib/notify');

const taskInclude = {
  stage: true, priority: true,
  creator: { include: { employee: true } },
  assignments: { include: { employee: { include: { position: true } } } },
  updates:     { orderBy: { update_date: 'desc' } },
  stageHistory:{ include: { changedBy: { include: { employee: true } }, oldStage: true, newStage: true }, orderBy: { changed_at: 'desc' } },
  comments:    { where: { is_deleted: false }, include: { user: { include: { employee: true } } }, orderBy: { created_at: 'asc' } },
  approvals:   { include: { approver: { include: { employee: true } } }, orderBy: { requested_at: 'desc' } },
  attachments: { where: { is_deleted: false }, include: { uploadedBy: { include: { employee: true } } } },
};

const index = async (req, res) => {
  const { search, priority_id, stage_id, employee_id } = req.query;
  const where = { is_deleted: false };

  // Employees only see their own assigned tasks
  if (req.user.role === 'Employee') {
    where.assignments = { some: { employee_id: +req.user.employeeId } };
  }
  // Managers only see tasks they created
  if (req.user.role === 'Manager') {
    where.created_by_user_id = req.user.id;
  }

  if (search)      where.task_title = { contains: search };
  if (priority_id) where.priority_id = +priority_id;
  if (stage_id)    where.stage_id    = +stage_id;
  if (employee_id) where.assignments = { some: { employee_id: +employee_id } };

  const tasks = await prisma.task.findMany({
    where,
    include: { stage: true, priority: true, assignments: { include: { employee: true } }, updates: { orderBy: { update_date: 'desc' }, take: 1 } },
    orderBy: { created_at: 'desc' }
  });
  res.json(tasks);
};

const show = async (req, res) => {
  const task = await prisma.task.findUnique({ where: { task_id: +req.params.id }, include: taskInclude });
  if (!task || task.is_deleted) return res.status(404).json({ error: 'Task not found.' });
  res.json(task);
};

const store = async (req, res) => {
  const { task_title, task_description, priority_id, start_date, due_date, employee_ids } = req.body;
  const ids = Array.isArray(employee_ids) ? employee_ids.map(Number) : JSON.parse(employee_ids || '[]');

  const pendingStage = await prisma.workflowStage.findFirst({ where: { stage_name: 'Pending' } });

  const task = await prisma.task.create({
    data: {
      stage_id: pendingStage.stage_id,
      task_title, task_description,
      priority_id: +priority_id,
      start_date:  start_date ? new Date(start_date) : null,
      due_date:    new Date(due_date),
      created_by_user_id: req.user.id,
    }
  });

  // Stage history
  await prisma.taskStageHistory.create({
    data: { task_id: task.task_id, changed_by_user_id: req.user.id, new_stage_id: pendingStage.stage_id, remarks: 'Task created.' }
  });

  // Assignments
  const notifyUserIds = [];
  for (const empId of ids) {
    await prisma.taskAssignment.create({ data: { task_id: task.task_id, employee_id: empId, assigned_by_user_id: req.user.id } });
    const emp = await prisma.employee.findUnique({ where: { employee_id: empId }, include: { user: true } });
    if (emp?.user) notifyUserIds.push(emp.user.id);
  }

  // File attachments
  if (req.files?.length) {
    for (const file of req.files) {
      await prisma.attachment.create({
        data: { task_id: task.task_id, uploaded_by_user_id: req.user.id, file_name: file.originalname, file_path: `uploads/${file.filename}`, file_type: file.originalname.split('.').pop() }
      });
    }
  }

  if (notifyUserIds.length) {
    await send(notifyUserIds, 'assignment', 'New Task Assigned', `You have been assigned: "${task_title}".`, task.task_id, req.user.id);
  }

  await log(req.user.id, 'assignment', `Created task: ${task_title}`, 'tasks', task.task_id);
  res.status(201).json(task);
};

const update = async (req, res) => {
  const { task_title, task_description, priority_id, start_date, due_date, employee_ids } = req.body;
  const task = await prisma.task.findUnique({ where: { task_id: +req.params.id }, include: { assignments: true } });
  if (!task || task.is_deleted) return res.status(404).json({ error: 'Not found.' });

  const updated = await prisma.task.update({
    where: { task_id: +req.params.id },
    data: { task_title, task_description, priority_id: +priority_id, start_date: start_date ? new Date(start_date) : null, due_date: new Date(due_date), updated_by_user_id: req.user.id }
  });

  // Sync assignments
  if (employee_ids) {
    const newIds = (Array.isArray(employee_ids) ? employee_ids : JSON.parse(employee_ids)).map(Number);
    const existing = task.assignments.map(a => a.employee_id);
    const toRemove = existing.filter(id => !newIds.includes(id));
    const toAdd    = newIds.filter(id => !existing.includes(id));
    if (toRemove.length) await prisma.taskAssignment.deleteMany({ where: { task_id: task.task_id, employee_id: { in: toRemove } } });
    for (const empId of toAdd) {
      await prisma.taskAssignment.create({ data: { task_id: task.task_id, employee_id: empId, assigned_by_user_id: req.user.id } });
    }
  }

  await log(req.user.id, 'update', `Updated task: ${task_title}`, 'tasks', +req.params.id);
  res.json(updated);
};

const destroy = async (req, res) => {
  await prisma.task.update({ where: { task_id: +req.params.id }, data: { is_deleted: true } });
  await log(req.user.id, 'delete', `Deleted task id ${req.params.id}`, 'tasks', +req.params.id);
  res.json({ message: 'Task deleted.' });
};

const changeStage = async (req, res) => {
  const { stage_id, remarks } = req.body;
  const task = await prisma.task.findUnique({ where: { task_id: +req.params.id }, include: { assignments: { include: { employee: { include: { user: true } } } } } });
  const old  = task.stage_id;
  await prisma.task.update({ where: { task_id: +req.params.id }, data: { stage_id: +stage_id, updated_by_user_id: req.user.id } });
  await prisma.taskStageHistory.create({ data: { task_id: +req.params.id, changed_by_user_id: req.user.id, old_stage_id: old, new_stage_id: +stage_id, remarks } });
  const stage = await prisma.workflowStage.findUnique({ where: { stage_id: +stage_id } });
  const uids  = task.assignments.map(a => a.employee?.user?.id).filter(Boolean);
  if (uids.length) await send(uids, 'status', 'Task Stage Updated', `Task "${task.task_title}" moved to ${stage.stage_name}.`, +req.params.id, req.user.id);
  await log(req.user.id, 'update', `Changed task ${req.params.id} to ${stage.stage_name}`, 'tasks', +req.params.id);
  res.json({ message: `Stage changed to ${stage.stage_name}.` });
};

const approve = async (req, res) => {
  const { approval_status, remarks } = req.body;
  const task = await prisma.task.findUnique({ where: { task_id: +req.params.id }, include: { assignments: { include: { employee: { include: { user: true } } } } } });

  await prisma.approval.create({ data: { task_id: +req.params.id, approver_user_id: req.user.id, approval_status, remarks, approval_date: new Date() } });

  const stageName  = approval_status === 'Approved' ? 'Completed' : 'In Progress';
  const newStage   = await prisma.workflowStage.findFirst({ where: { stage_name: stageName } });
  await prisma.task.update({ where: { task_id: +req.params.id }, data: { stage_id: newStage.stage_id, updated_by_user_id: req.user.id } });
  await prisma.taskStageHistory.create({ data: { task_id: +req.params.id, changed_by_user_id: req.user.id, old_stage_id: task.stage_id, new_stage_id: newStage.stage_id, remarks: approval_status === 'Approved' ? 'Approved.' : 'Returned for revision.' } });

  const uids = task.assignments.map(a => a.employee?.user?.id).filter(Boolean);
  if (uids.length) await send(uids, 'approval', 'Task Review Decision', `Task "${task.task_title}": ${approval_status}.${remarks ? ` Remarks: ${remarks}` : ''}`, +req.params.id, req.user.id);
  await log(req.user.id, 'approval', `Reviewed task ${req.params.id}: ${approval_status}`, 'tasks', +req.params.id);
  res.json({ message: `Task ${approval_status}.` });
};

const submitForReview = async (req, res) => {
  const task     = await prisma.task.findUnique({ where: { task_id: +req.params.id } });
  const stage    = await prisma.workflowStage.findFirst({ where: { stage_name: 'For Review' } });
  const oldStage = task.stage_id;
  await prisma.task.update({ where: { task_id: +req.params.id }, data: { stage_id: stage.stage_id, updated_by_user_id: req.user.id } });
  await prisma.taskStageHistory.create({ data: { task_id: +req.params.id, changed_by_user_id: req.user.id, old_stage_id: oldStage, new_stage_id: stage.stage_id, remarks: 'Submitted for review.' } });
  await send(task.created_by_user_id, 'approval', 'Task Ready for Review', `Task "${task.task_title}" was submitted for review.`, +req.params.id, req.user.id);
  await log(req.user.id, 'update', `Submitted task ${req.params.id} for review`, 'tasks', +req.params.id);
  res.json({ message: 'Submitted for review.' });
};

const postProgress = async (req, res) => {
  const { update_message, progress_percent } = req.body;
  const task = await prisma.task.findUnique({ where: { task_id: +req.params.id } });

  await prisma.taskUpdate.create({ data: { task_id: +req.params.id, employee_id: +req.user.employeeId, update_message, progress_percent: +progress_percent } });

  // Auto-move to In Progress if still Pending
  const pending    = await prisma.workflowStage.findFirst({ where: { stage_name: 'Pending' } });
  const inProgress = await prisma.workflowStage.findFirst({ where: { stage_name: 'In Progress' } });
  if (task.stage_id === pending.stage_id) {
    await prisma.task.update({ where: { task_id: +req.params.id }, data: { stage_id: inProgress.stage_id } });
    await prisma.taskStageHistory.create({ data: { task_id: +req.params.id, changed_by_user_id: req.user.id, old_stage_id: pending.stage_id, new_stage_id: inProgress.stage_id, remarks: 'Progress update posted.' } });
  }

  await log(req.user.id, 'update', `Posted progress on task ${req.params.id}`, 'task_updates', +req.params.id);
  res.json({ message: 'Progress saved.' });
};

const addComment = async (req, res) => {
  const comment = await prisma.taskComment.create({ data: { task_id: +req.params.id, user_id: req.user.id, comment_text: req.body.comment_text } });
  res.status(201).json(comment);
};

const deleteComment = async (req, res) => {
  await prisma.taskComment.update({ where: { comment_id: +req.params.cid }, data: { is_deleted: true } });
  res.json({ message: 'Comment removed.' });
};

const uploadAttachment = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided.' });
  const att = await prisma.attachment.create({
    data: { task_id: +req.params.id, uploaded_by_user_id: req.user.id, file_name: req.file.originalname, file_path: `uploads/${req.file.filename}`, file_type: req.file.originalname.split('.').pop() }
  });
  res.status(201).json(att);
};

module.exports = { index, show, store, update, destroy, changeStage, approve, submitForReview, postProgress, addComment, deleteComment, uploadAttachment };
