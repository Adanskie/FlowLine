const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Roles
  const adminRole    = await prisma.role.upsert({ where: { role_name: 'Administrator' }, update: {}, create: { role_name: 'Administrator', description: 'Full system access' } });
  const managerRole  = await prisma.role.upsert({ where: { role_name: 'Manager' },       update: {}, create: { role_name: 'Manager',       description: 'Task creation and approval' } });
  await prisma.role.upsert({ where: { role_name: 'Employee' }, update: {}, create: { role_name: 'Employee', description: 'Task execution' } });

  // Workflow stages
  const stageData = [
    { stage_name: 'Pending',     step_order: 1, is_terminal: false },
    { stage_name: 'In Progress', step_order: 2, is_terminal: false },
    { stage_name: 'For Review',  step_order: 3, is_terminal: false },
    { stage_name: 'Completed',   step_order: 4, is_terminal: true  },
    { stage_name: 'Overdue',     step_order: 5, is_terminal: false },
  ];
  for (const s of stageData) {
    await prisma.workflowStage.upsert({ where: { stage_name: s.stage_name }, update: {}, create: s });
  }

  // Priorities
  for (const p of ['Low', 'Medium', 'High']) {
    await prisma.taskPriority.upsert({ where: { priority_name: p }, update: {}, create: { priority_name: p } });
  }

  // Departments
  const itDept = await prisma.department.upsert({ where: { department_name: 'IT' }, update: {}, create: { department_name: 'IT', description: 'Information Technology' } });
  const hrDept = await prisma.department.upsert({ where: { department_name: 'HR' }, update: {}, create: { department_name: 'HR', description: 'Human Resources' } });
  await prisma.department.upsert({ where: { department_name: 'Operations' }, update: {}, create: { department_name: 'Operations', description: 'Operations' } });

  // Positions
  const adminPos   = await prisma.position.upsert({ where: { position_name: 'System Administrator' }, update: {}, create: { position_name: 'System Administrator' } });
  const managerPos = await prisma.position.upsert({ where: { position_name: 'Department Manager' },   update: {}, create: { position_name: 'Department Manager' } });
  await prisma.position.upsert({ where: { position_name: 'Staff' },   update: {}, create: { position_name: 'Staff' } });
  await prisma.position.upsert({ where: { position_name: 'Analyst' }, update: {}, create: { position_name: 'Analyst' } });

  // Admin account
  const adminEmp = await prisma.employee.upsert({
    where: { email: 'admin@flowline.local' },
    update: {},
    create: { first_name: 'System', last_name: 'Admin', email: 'admin@flowline.local', department_id: itDept.department_id, position_id: adminPos.position_id, status: 'Active' }
  });
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { employee_id: adminEmp.employee_id, role_id: adminRole.role_id, username: 'admin', password: await bcrypt.hash('password123', 10), status: 'active' }
  });

  // Manager account
  const managerEmp = await prisma.employee.upsert({
    where: { email: 'manager@flowline.local' },
    update: {},
    create: { first_name: 'Maria', last_name: 'Cruz', email: 'manager@flowline.local', department_id: hrDept.department_id, position_id: managerPos.position_id, status: 'Active' }
  });
  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: { employee_id: managerEmp.employee_id, role_id: managerRole.role_id, username: 'manager', password: await bcrypt.hash('password123', 10), status: 'active' }
  });

  console.log('Seeding complete.');
  console.log('  admin    / password123  [Administrator]');
  console.log('  manager  / password123  [Manager]');
}

main().catch(console.error).finally(() => prisma.$disconnect());
