const router  = require('express').Router();
const prisma  = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('Administrator'));

router.get('/', async (req, res) => {
  const { user_id, action_type, from, to, search } = req.query;
  const where = {};
  if (user_id)     where.user_id     = +user_id;
  if (action_type) where.action_type = action_type;
  if (search)      where.description = { contains: search };
  if (from || to)  { where.created_at = {}; if (from) where.created_at.gte = new Date(from); if (to) where.created_at.lte = new Date(to); }
  const logs = await prisma.activityLog.findMany({ where, include: { user: { include: { employee: true } } }, orderBy: { created_at: 'desc' }, take: 200 });
  res.json(logs);
});

module.exports = router;
