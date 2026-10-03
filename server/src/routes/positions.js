const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { log } = require('../lib/activityLog');

router.use(authenticate, authorize('Administrator'));

router.get('/', async (_, res) => {
  const positions = await prisma.position.findMany({
    include: { _count: { select: { employees: { where: { is_deleted: false } } } } },
    orderBy: { position_name: 'asc' }
  });
  res.json(positions);
});

router.post('/', async (req, res) => {
  const { position_name, description } = req.body;
  const pos = await prisma.position.create({ data: { position_name, description } });
  await log(req.user.id, 'create', `Created position: ${position_name}`, 'positions', pos.position_id);
  res.status(201).json(pos);
});

router.put('/:id', async (req, res) => {
  const pos = await prisma.position.update({ where: { position_id: +req.params.id }, data: req.body });
  await log(req.user.id, 'update', `Updated position: ${pos.position_name}`, 'positions', pos.position_id);
  res.json(pos);
});

router.delete('/:id', async (req, res) => {
  await prisma.position.delete({ where: { position_id: +req.params.id } });
  res.json({ message: 'Deleted.' });
});

module.exports = router;
