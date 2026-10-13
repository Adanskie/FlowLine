const { ActivityLog } = require('../models');

const log = async (userId, actionType, description, tableAffected = null, recordId = null) => {
  try {
    await ActivityLog.create({
      user_id: userId,
      action_type: actionType,
      description,
      table_affected: tableAffected,
      record_id: recordId,
    });
  } catch (e) {
    console.error('ActivityLog error:', e.message);
  }
};

module.exports = { log };
