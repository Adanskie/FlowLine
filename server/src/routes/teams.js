const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { log } = require('../lib/activityLog');

// GET — Administrator and Manager
router.get('/', authenticate, authorize('Administrator', 'Manager'), async (_, res) => {
  const teams = await prisma.team.findMany({
    where: { is_deleted: false },
    include: {
      department: true,
      teamLead: { select: { employee_id: true, first_name: true, last_name: true } },
      members:  { where: { is_deleted: false }, select: { employee_id: true, first_name: true, last_name: true } },
    },
    orderBy: { team_name: 'asc' },
  });
  res.json(teams);
});

// POST, PUT, DELETE — Administrator only
router.post('/', authenticate, authorize('Administrator'), async (req, res) => {
  const { team_name, department_id, team_lead_id } = req.body;
  const team = await prisma.team.create({
    data: {
      team_name,
      department_id: +department_id,
      team_lead_id: team_lead_id ? +team_lead_id : null,
    },
  });
  await log(req.user.id, 'create', `Created team: ${team_name}`, 'teams', team.team_id);
  res.status(201).json(team);
});

router.put('/:id', authenticate, authorize('Administrator'), async (req, res) => {
  const { team_name, department_id, team_lead_id } = req.body;
  const team = await prisma.team.update({
    where: { team_id: +req.params.id },
    data: {
      team_name,
      department_id: +department_id,
      team_lead_id: team_lead_id ? +team_lead_id : null,
    },
  });
  await log(req.user.id, 'update', `Updated team: ${team_name}`, 'teams', team.team_id);
  res.json(team);
});

router.delete('/:id', authenticate, authorize('Administrator'), async (req, res) => {
  // Soft delete: mark team as deleted and unlink all members
  await prisma.employee.updateMany({
    where: { team_id: +req.params.id },
    data:  { team_id: null },
  });
  await prisma.team.update({
    where: { team_id: +req.params.id },
    data:  { is_deleted: true },
  });
  await log(req.user.id, 'delete', `Deleted team id ${req.params.id}`, 'teams', +req.params.id);
  res.json({ message: 'Deleted.' });
});

module.exports = router;
