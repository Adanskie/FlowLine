const router  = require('express').Router();
const prisma  = require('../lib/prisma');
const path    = require('path');
const fs      = require('fs');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const where = { is_deleted: false };
  // Employees only see files on their assigned tasks
  if (req.user.role === 'Employee') {
    where.task = { assignments: { some: { employee_id: +req.user.employeeId } } };
  }
  if (req.query.search) where.file_name = { contains: req.query.search };
  const files = await prisma.attachment.findMany({ where, include: { task: true, uploadedBy: { include: { employee: true } } }, orderBy: { uploaded_at: 'desc' } });
  res.json(files);
});

router.get('/:id/download', async (req, res) => {
  const att = await prisma.attachment.findUnique({ where: { attachment_id: +req.params.id } });
  if (!att || att.is_deleted) return res.status(404).json({ error: 'File not found.' });
  const filePath = path.join(__dirname, '../../', att.file_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing from disk.' });
  res.download(filePath, att.file_name);
});

router.delete('/:id', authorize('Administrator','Manager'), async (req, res) => {
  const att = await prisma.attachment.findUnique({ where: { attachment_id: +req.params.id } });
  if (!att) return res.status(404).json({ error: 'Not found.' });
  const filePath = path.join(__dirname, '../../', att.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await prisma.attachment.update({ where: { attachment_id: +req.params.id }, data: { is_deleted: true } });
  res.json({ message: 'Deleted.' });
});

module.exports = router;
