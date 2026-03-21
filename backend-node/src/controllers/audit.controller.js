const prisma = require('../lib/prisma');

const getAuditLogs = async (req, res, next) => {
  try {
    // Basic pagination and filtering can be added here
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 100 // Limit for safety
    });
    
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
