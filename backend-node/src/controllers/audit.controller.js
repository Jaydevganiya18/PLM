const { AuditLog, User } = require('../lib/prisma');

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
