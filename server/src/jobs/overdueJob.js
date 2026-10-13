const { Op }           = require('sequelize');
const { sequelize, Task, WorkflowStage, TaskStageHistory, ActivityLog, TaskAssignment, Employee, User } = require('../models');
const { send }         = require('../lib/notify');

let running = false;

const runOverdueJob = async () => {
  if (running) {
    console.log('[overdueJob] Skipping — previous run still in progress.');
    return;
  }
  running = true;

  try {
    const overdueStage = await WorkflowStage.findOne({ where: { stage_name: 'Overdue' } });
    if (!overdueStage) {
      console.warn('[overdueJob] Overdue stage not found. Skipping.');
      return;
    }

    const eligibleStages = await WorkflowStage.findAll({
      where: { stage_name: { [Op.in]: ['Pending', 'In Progress'] } },
    });
    const eligibleIds = eligibleStages.map(s => s.stage_id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await Task.findAll({
      where: {
        is_deleted: false,
        stage_id:   { [Op.in]: eligibleIds },
        due_date:   { [Op.lt]: today },
      },
      include: [
        {
          model: TaskAssignment,
          as: 'assignments',
          include: [{ model: Employee, as: 'employee', include: [{ model: User, as: 'user' }] }],
        },
      ],
    });

    if (tasks.length === 0) {
      console.log('[overdueJob] No overdue tasks found.');
      return;
    }

    console.log(`[overdueJob] Marking ${tasks.length} task(s) as overdue.`);

    for (const task of tasks) {
      try {
        await sequelize.transaction(async t => {
          await task.update(
            { stage_id: overdueStage.stage_id, updated_by_user_id: task.created_by_user_id },
            { transaction: t }
          );

          await TaskStageHistory.create({
            task_id:            task.task_id,
            changed_by_user_id: task.created_by_user_id,
            old_stage_id:       task.stage_id,
            new_stage_id:       overdueStage.stage_id,
            remarks:            'Automatically marked overdue.',
          }, { transaction: t });

          await ActivityLog.create({
            user_id:        task.created_by_user_id,
            action_type:    'update',
            description:    `Task ${task.task_id} automatically marked overdue.`,
            table_affected: 'tasks',
            record_id:      task.task_id,
          }, { transaction: t });
        });

        const assignedUserIds = task.assignments
          .map(a => a.employee?.user?.id)
          .filter(Boolean);

        const notifyIds = Array.from(new Set([...assignedUserIds, task.created_by_user_id]));

        await send(notifyIds, 'deadline', 'Task Overdue', `Task "${task.task_title}" is overdue.`, task.task_id, null);

        console.log(`[overdueJob] Marked task ${task.task_id} ("${task.task_title}") as overdue.`);
      } catch (taskErr) {
        console.error(`[overdueJob] Error processing task ${task.task_id}:`, taskErr.message);
      }
    }
  } catch (err) {
    console.error('[overdueJob] Unexpected error:', err.message);
  } finally {
    running = false;
  }
};

module.exports = { runOverdueJob };
