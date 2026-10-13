const sequelize = require('../../config/database');

const Role             = require('./Role');
const Department       = require('./Department');
const Position         = require('./Position');
const Team             = require('./Team');
const Employee         = require('./Employee');
const User             = require('./User');
const WorkflowStage    = require('./WorkflowStage');
const TaskPriority     = require('./TaskPriority');
const Task             = require('./Task');
const TaskAssignment   = require('./TaskAssignment');
const TaskUpdate       = require('./TaskUpdate');
const TaskStageHistory = require('./TaskStageHistory');
const TaskComment      = require('./TaskComment');
const Approval         = require('./Approval');
const Attachment       = require('./Attachment');
const Notification     = require('./Notification');
const Attendance       = require('./Attendance');
const ActivityLog      = require('./ActivityLog');

// ── Role ↔ User ───────────────────────────────────────────────────────────────
Role.hasMany(User,    { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role,  { foreignKey: 'role_id', as: 'role' });

// ── Department ────────────────────────────────────────────────────────────────
Department.hasMany(Employee, { foreignKey: 'department_id', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Department.hasMany(Team, { foreignKey: 'department_id', as: 'teams' });
Team.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// ── Position ↔ Employee ───────────────────────────────────────────────────────
Position.hasMany(Employee, { foreignKey: 'position_id', as: 'employees' });
Employee.belongsTo(Position, { foreignKey: 'position_id', as: 'position' });

// ── Employee self-ref (supervisor) ────────────────────────────────────────────
Employee.belongsTo(Employee, { foreignKey: 'supervisor_id', as: 'supervisor' });
Employee.hasMany(Employee,   { foreignKey: 'supervisor_id', as: 'subordinates' });

// ── Team ↔ Employee ───────────────────────────────────────────────────────────
Team.belongsTo(Employee, { foreignKey: 'team_lead_id', as: 'teamLead' });
Team.hasMany(Employee,   { foreignKey: 'team_id',      as: 'members' });
Employee.belongsTo(Team, { foreignKey: 'team_id',      as: 'team' });
Employee.hasMany(Team,   { foreignKey: 'team_lead_id', as: 'ledTeams' });

// ── Employee ↔ User ───────────────────────────────────────────────────────────
Employee.hasOne(User,    { foreignKey: 'employee_id', as: 'user' });
User.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// ── WorkflowStage ↔ Task ──────────────────────────────────────────────────────
WorkflowStage.hasMany(Task, { foreignKey: 'stage_id', as: 'tasks' });
Task.belongsTo(WorkflowStage, { foreignKey: 'stage_id', as: 'stage' });

// ── TaskPriority ↔ Task ───────────────────────────────────────────────────────
TaskPriority.hasMany(Task, { foreignKey: 'priority_id', as: 'tasks' });
Task.belongsTo(TaskPriority, { foreignKey: 'priority_id', as: 'priority' });

// ── User ↔ Task (creator / updater) ──────────────────────────────────────────
User.hasMany(Task, { foreignKey: 'created_by_user_id', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'creator' });

User.hasMany(Task, { foreignKey: 'updated_by_user_id', as: 'updatedTasks' });
Task.belongsTo(User, { foreignKey: 'updated_by_user_id', as: 'updater' });

// ── Task ↔ TaskAssignment ─────────────────────────────────────────────────────
Task.hasMany(TaskAssignment,     { foreignKey: 'task_id',     as: 'assignments' });
TaskAssignment.belongsTo(Task,   { foreignKey: 'task_id',     as: 'task' });

Employee.hasMany(TaskAssignment,     { foreignKey: 'employee_id', as: 'taskAssignments' });
TaskAssignment.belongsTo(Employee,   { foreignKey: 'employee_id', as: 'employee' });

User.hasMany(TaskAssignment,     { foreignKey: 'assigned_by_user_id', as: 'assignedBy' });
TaskAssignment.belongsTo(User,   { foreignKey: 'assigned_by_user_id', as: 'assignedBy' });

// ── Task ↔ TaskUpdate ─────────────────────────────────────────────────────────
Task.hasMany(TaskUpdate,     { foreignKey: 'task_id',     as: 'updates' });
TaskUpdate.belongsTo(Task,   { foreignKey: 'task_id',     as: 'task' });
Employee.hasMany(TaskUpdate, { foreignKey: 'employee_id', as: 'taskUpdates' });
TaskUpdate.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// ── Task ↔ TaskStageHistory ───────────────────────────────────────────────────
Task.hasMany(TaskStageHistory, { foreignKey: 'task_id', as: 'stageHistory' });
TaskStageHistory.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

User.hasMany(TaskStageHistory, { foreignKey: 'changed_by_user_id', as: 'stageHistories' });
TaskStageHistory.belongsTo(User, { foreignKey: 'changed_by_user_id', as: 'changedBy' });

WorkflowStage.hasMany(TaskStageHistory, { foreignKey: 'old_stage_id', as: 'oldStageHistory' });
TaskStageHistory.belongsTo(WorkflowStage, { foreignKey: 'old_stage_id', as: 'oldStage' });

WorkflowStage.hasMany(TaskStageHistory, { foreignKey: 'new_stage_id', as: 'newStageHistory' });
TaskStageHistory.belongsTo(WorkflowStage, { foreignKey: 'new_stage_id', as: 'newStage' });

// ── Task ↔ TaskComment ────────────────────────────────────────────────────────
Task.hasMany(TaskComment,   { foreignKey: 'task_id', as: 'comments' });
TaskComment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
User.hasMany(TaskComment,   { foreignKey: 'user_id', as: 'comments' });
TaskComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Task ↔ Approval ───────────────────────────────────────────────────────────
Task.hasMany(Approval,    { foreignKey: 'task_id',          as: 'approvals' });
Approval.belongsTo(Task,  { foreignKey: 'task_id',          as: 'task' });
User.hasMany(Approval,    { foreignKey: 'approver_user_id', as: 'approvals' });
Approval.belongsTo(User,  { foreignKey: 'approver_user_id', as: 'approver' });

// ── Task ↔ Attachment ─────────────────────────────────────────────────────────
Task.hasMany(Attachment,    { foreignKey: 'task_id',              as: 'attachments' });
Attachment.belongsTo(Task,  { foreignKey: 'task_id',              as: 'task' });
User.hasMany(Attachment,    { foreignKey: 'uploaded_by_user_id',  as: 'attachments' });
Attachment.belongsTo(User,  { foreignKey: 'uploaded_by_user_id',  as: 'uploadedBy' });

// ── Notification ──────────────────────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: 'user_id',        as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id',      as: 'user' });
User.hasMany(Notification, { foreignKey: 'sender_user_id', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'sender_user_id', as: 'sender' });

// ── Attendance ────────────────────────────────────────────────────────────────
Employee.hasMany(Attendance,    { foreignKey: 'employee_id', as: 'attendance' });
Attendance.belongsTo(Employee,  { foreignKey: 'employee_id', as: 'employee' });

// ── ActivityLog ───────────────────────────────────────────────────────────────
User.hasMany(ActivityLog,    { foreignKey: 'user_id', as: 'activityLogs' });
ActivityLog.belongsTo(User,  { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Role, Department, Position, Team, Employee, User,
  WorkflowStage, TaskPriority, Task,
  TaskAssignment, TaskUpdate, TaskStageHistory, TaskComment,
  Approval, Attachment, Notification, Attendance, ActivityLog,
};
