const { Notification } = require('../models');

/**
 * Send a notification to one or more user IDs.
 * @param {number|number[]} userIds
 */
const send = async (userIds, type, title, message, referenceId = null, senderUserId = null) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const data = ids.map(uid => ({
    user_id: uid,
    sender_user_id: senderUserId,
    notification_type: type,
    reference_id: referenceId,
    title,
    message,
    is_read: false,
  }));
  try {
    await Notification.bulkCreate(data);
  } catch (e) {
    console.error('Notify error:', e.message);
  }
};

module.exports = { send };
