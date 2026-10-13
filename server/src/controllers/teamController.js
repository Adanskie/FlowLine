const { Department, Team, Employee } = require('../models');
const { log } = require('../lib/activityLog');

const index = async (req, res) => {
  const [teams, departments, employees] = await Promise.all([
    Team.findAll({
      where: { is_deleted: false },
      include: [
        { model: Department, as: 'department' },
        { model: Employee,   as: 'teamLead' },
        { model: Employee,   as: 'members', where: { is_deleted: false }, required: false },
      ],
      order: [['team_name', 'ASC']],
    }),
    Department.findAll({ where: { is_deleted: false }, order: [['department_name', 'ASC']] }),
    Employee.findAll({ where: { is_deleted: false }, order: [['first_name', 'ASC']] }),
  ]);
  res.render('admin/teams/index', {
    title: 'Teams', teams, departments, employees, user: req.session.user,
    success: req.flash('success'), error: req.flash('error'),
  });
};

const store = async (req, res) => {
  const { team_name, department_id, team_lead_id } = req.body;
  try {
    const team = await Team.create({
      team_name,
      department_id: +department_id,
      team_lead_id: team_lead_id ? +team_lead_id : null,
    });
    await log(req.session.user.id, 'create', `Created team: ${team_name}`, 'teams', team.team_id);
    req.flash('success', 'Team created.');
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/admin/teams');
};

const update = async (req, res) => {
  const { team_name, department_id, team_lead_id } = req.body;
  try {
    const team = await Team.findByPk(+req.params.id);
    if (!team) { req.flash('error', 'Not found.'); return res.redirect('/admin/teams'); }
    await team.update({ team_name, department_id: +department_id, team_lead_id: team_lead_id ? +team_lead_id : null });
    await log(req.session.user.id, 'update', `Updated team: ${team_name}`, 'teams', team.team_id);
    req.flash('success', 'Team updated.');
  } catch (e) {
    req.flash('error', e.message);
  }
  res.redirect('/admin/teams');
};

const destroy = async (req, res) => {
  const team = await Team.findByPk(+req.params.id);
  if (team) {
    await Employee.update({ team_id: null }, { where: { team_id: team.team_id } });
    await team.update({ is_deleted: true });
    await log(req.session.user.id, 'delete', `Deleted team id ${req.params.id}`, 'teams', team.team_id);
    req.flash('success', 'Team deleted.');
  }
  res.redirect('/admin/teams');
};

module.exports = { index, store, update, destroy };
