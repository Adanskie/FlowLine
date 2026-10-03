const router  = require('express').Router();
const prisma  = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { user_id: req.user.id },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  // Mark all as read
  await prisma.notification.updateMany({ where: { user_id: req.user.id, is_read: false }, data: { is_read: true } });
  res.json(notifications);
});

router.get('/unread-count', async (req, res) => {
  const count = await prisma.notification.count({ where: { user_id: req.user.id, is_read: false } });
  res.json({ count });
});

router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({ where: { user_id: req.user.id }, data: { is_read: true } });
  res.json({ message: 'All marked as read.' });
});

router.post('/:id/read', async (req, res) => {
  await prisma.notification.update({ where: { notification_id: +req.params.id }, data: { is_read: true } });
  res.json({ message: 'Marked as read.' });
});

module.exports = router;
