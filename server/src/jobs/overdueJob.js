const prisma  = require('../lib/prisma');
const { log } = require('../lib/activityLog');
const { send } = require('../lib/notify');

let running = false;

const runOverdueJob = async () => {
  if (running) {
    console.log('[overdueJob] Skipping — previous run still in progress.');
    return;
  }
  running = true;

  try {
    // Look up the Overdue stage by name. Never create it.
    const overdueStage = await prisma.workflowStage.findFirst({ where: { stage_name: 'Overdue' } });
    if (!overdueStage) {
      console.warn('[overdueJob] Overdue stage not found in workflow_stages. Skipping.');
      return;
    }

    // Look up eligible source stages (Pending, In Progress only).
    const eligibleStages = await prisma.workflowStage.findMany({
      where: { stage_name: { in: ['Pending', 'In Progress'] } },
    });
    const eligibleIds = eligibleStages.map(s => s.stage_id);

    // Start of today (server local midnight) so tasks due today are NOT yet overdue.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all eligible tasks.
    const tasks = await prisma.task.findMany({
      where: {
        is_deleted: false,
        stage_id:   { in: eligibleIds },
        due_date:   { lt: today },
      },
      include: {
        assignments: { include: { employee: { include: { user: true } } } },
        creator:     true,
      },
    });

    if (tasks.length === 0) {
      console.log('[overdueJob] No overdue tasks found.');
      return;
    }

    console.log(`[overdueJob] Marking ${tasks.length} task(s) as overdue.`);

    for (const task of tasks) {
      try {
        // Single transaction: update stage + write stage history + activity log.
        await prisma.$transaction(async tx => {
          await tx.task.update({
            where: { task_id: task.task_id },
            data:  { stage_id: overdueStage.stage_id, updated_by_user_id: task.created_by_user_id },
          });

          await tx.taskStageHistory.create({
            data: {
              task_id:            task.task_id,
              changed_by_user_id: task.created_by_user_id,
              old_stage_id:       task.stage_id,
              new_stage_id:       overdueStage.stage_id,
              remarks:            'Automatically marked overdue.',
            },
          });

          await tx.activityLog.create({
            data: {
              user_id:        task.created_by_user_id,
              action_type:    'update',
              description:    `Task ${task.task_id} automatically marked overdue.`,
              table_affected: 'tasks',
              record_id:      task.task_id,
            },
          });
        });

        // Notify assigned employees + the creator (deduplicated).
        const assignedUserIds = task.assignments
          .map(a => a.employee?.user?.id)
          .filter(Boolean);

        const notifyIds = Array.from(new Set([...assignedUserIds, task.created_by_user_id]));

        await send(
          notifyIds,
          'deadline',
          'Task Overdue',
          `Task "${task.task_title}" is overdue.`,
          task.task_id,
          null,
        );

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
