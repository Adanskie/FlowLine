const { Position, Employee } = require('../models');
const { log } = require('../lib/activityLog');

const index = async (req, res) => {
  const positions = await Position.findAll({
    include: [{ model: Employee, as: 'employees', where: { is_deleted: false }, required: false }],
    order: [['position_name', 'ASC']],
  });
  res.render('admin/positions/index', {
    title: 'Positions', positions, user: req.session.user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

const store = async (req, res) => {
  const { position_name, description } = req.body;
  try {
    const pos = await Position.create({ position_name, description });
    await log(req.session.user.id, 'create', `Created position: ${position_name}`, 'positions', pos.position_id);
    req.flash('success', 'Position created.');
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/admin/positions');
};

const update = async (req, res) => {
  const { position_name, description } = req.body;
  try {
    const pos = await Position.findByPk(+req.params.id);
    if (!pos) { req.flash('error', 'Not found.'); return res.redirect('/admin/positions'); }
    await pos.update({ position_name, description });
    await log(req.session.user.id, 'update', `Updated position: ${position_name}`, 'positions', pos.position_id);
    req.flash('success', 'Position updated.');
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/admin/positions');
};

const destroy = async (req, res) => {
  const pos = await Position.findByPk(+req.params.id);
  if (pos) {
    await pos.destroy();
    req.flash('success', 'Position deleted.');
  }
  res.redirect('/admin/positions');
};

module.exports = { index, store, update, destroy };
