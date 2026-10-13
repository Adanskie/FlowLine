const { Op } = require('sequelize');
const { ActivityLog, User, Employee } = require('../models');

const index = async (req, res) => {
  const { user_id, action_type, from, to, search } = req.query;
  const where = {};
  if (user_id)     where.user_id     = +user_id;
  if (action_type) where.action_type = action_type;
  if (search)      where.description = { [Op.like]: `%${search}%` };
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to)   where.created_at[Op.lte] = new Date(to);
  }

  const [logs, users] = await Promise.all([
    ActivityLog.findAll({
      where,
      include: [{ model: User, as: 'user', include: [{ model: Employee, as: 'employee' }] }],
      order: [['created_at', 'DESC']],
      limit: 200,
    }),
    User.findAll({ where: { is_deleted: false }, include: [{ model: Employee, as: 'employee' }], order: [['username', 'ASC']] }),
  ]);

  res.render('admin/activity-logs/index', {
    title: 'Activity Logs', logs, users, query: req.query, user: req.session.user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

module.exports = { index };
