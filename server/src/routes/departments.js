const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { log } = require('../lib/activityLog');

router.use(authenticate, authorize('Administrator'));

router.get('/', async (_, res) => {
  const depts = await prisma.department.findMany({
    where: { is_deleted: false },
    include: { _count: { select: { employees: { where: { is_deleted: false } } } } },
    orderBy: { department_name: 'asc' }
  });
  res.json(depts);
});

router.post('/', async (req, res) => {
  const { department_name, description } = req.body;
  const exists = await prisma.department.findUnique({ where: { department_name } });
  if (exists && !exists.is_deleted) return res.status(409).json({ error: 'Department already exists.' });
  const dept = await prisma.department.create({ data: { department_name, description } });
  await log(req.user.id, 'create', `Created department: ${department_name}`, 'departments', dept.department_id);
  res.status(201).json(dept);
});

router.put('/:id', async (req, res) => {
  const { department_name, description } = req.body;
  const dept = await prisma.department.update({ where: { department_id: +req.params.id }, data: { department_name, description } });
  await log(req.user.id, 'update', `Updated department: ${department_name}`, 'departments', dept.department_id);
  res.json(dept);
});

router.delete('/:id', async (req, res) => {
  await prisma.department.update({ where: { department_id: +req.params.id }, data: { is_deleted: true } });
  await log(req.user.id, 'delete', `Deleted department id ${req.params.id}`, 'departments', +req.params.id);
  res.json({ message: 'Deleted.' });
});

module.exports = router;
