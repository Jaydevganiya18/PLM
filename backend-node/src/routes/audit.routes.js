const express = require('express');
const { getAuditLogs } = require('../controllers/audit.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN'])); // Admin only

router.get('/', getAuditLogs);

module.exports = router;
