require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { sequelize, Role, WorkflowStage, TaskPriority, Department, Position, Employee, User } = require('../models');

async function seed() {
  await sequelize.authenticate();
  console.log('DB connected — seeding...');

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roles = ['Administrator', 'Manager', 'Employee'];
  for (const role_name of roles) {
    await Role.findOrCreate({ where: { role_name } });
  }
  console.log('✔ Roles seeded');

  // ── Workflow Stages ────────────────────────────────────────────────────────
  const stages = [
    { stage_name: 'Pending',     step_order: 1, is_terminal: false },
    { stage_name: 'In Progress', step_order: 2, is_terminal: false },
    { stage_name: 'For Review',  step_order: 3, is_terminal: false },
    { stage_name: 'Completed',   step_order: 4, is_terminal: true  },
    { stage_name: 'Overdue',     step_order: 5, is_terminal: false },
  ];
  for (const s of stages) {
    await WorkflowStage.findOrCreate({ where: { stage_name: s.stage_name }, defaults: s });
  }
  console.log('✔ Workflow stages seeded');

  // ── Task Priorities ────────────────────────────────────────────────────────
  const priorities = ['Low', 'Medium', 'High'];
  for (const priority_name of priorities) {
    await TaskPriority.findOrCreate({ where: { priority_name } });
  }
  console.log('✔ Task priorities seeded');

  // ── Default Department & Position ──────────────────────────────────────────
  const [dept]     = await Department.findOrCreate({ where: { department_name: 'Administration' }, defaults: { description: 'Default department' } });
  const [position] = await Position.findOrCreate({ where: { position_name: 'System Administrator' }, defaults: { description: 'Default position' } });
  console.log('✔ Default department & position seeded');

  // ── Admin Employee & User ──────────────────────────────────────────────────
  const adminRole = await Role.findOne({ where: { role_name: 'Administrator' } });

  let adminEmp = await Employee.findOne({ where: { email: 'admin@flowline.com', is_deleted: false } });
  if (!adminEmp) {
    adminEmp = await Employee.create({
      first_name: 'System', last_name: 'Administrator',
      email: 'admin@flowline.com', phone: '000-0000',
      department_id: dept.department_id, position_id: position.position_id,
      employment_type: 'Full-time', status: 'Active',
    });
  }

  const existingUser = await User.findOne({ where: { username: 'admin', is_deleted: false } });
  if (!existingUser) {
    await User.create({
      employee_id: adminEmp.employee_id,
      role_id:     adminRole.role_id,
      username:    'admin',
      password:    await bcrypt.hash('admin123', 10),
      status:      'active',
    });
    console.log('✔ Admin user seeded  (username: admin / password: admin123)');
  } else {
    console.log('ℹ Admin user already exists — skipped');
  }

  console.log('\n✅ Seeding complete.');
  await sequelize.close();
}

seed().catch(err => { console.error(err); process.exit(1); });
