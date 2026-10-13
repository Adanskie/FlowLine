const { Notification } = require('../models');

const index = async (req, res) => {
  const user = req.session.user;

  const notifications = await Notification.findAll({
    where: { user_id: user.id },
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  // Mark all as read
  await Notification.update({ is_read: true }, { where: { user_id: user.id, is_read: false } });

  // Refresh unread count in session
  req.session.user.unreadCount = 0;

  const rolePrefix = user.role === 'Administrator' ? 'admin' : user.role === 'Manager' ? 'manager' : 'employee';
  res.render(`${rolePrefix}/notifications/index`, {
    title: 'Notifications', notifications, user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

const markRead = async (req, res) => {
  const user = req.session.user;
  await Notification.update({ is_read: true }, { where: { notification_id: +req.params.id, user_id: user.id } });
  res.redirect('back');
};

const markAllRead = async (req, res) => {
  const user = req.session.user;
  await Notification.update({ is_read: true }, { where: { user_id: user.id } });
  req.session.user.unreadCount = 0;
  res.redirect('back');
};

module.exports = { index, markRead, markAllRead };
