const express = require('express');
const { 
  getEcoStages, createEcoStage, updateEcoStage,
  getApprovalRules, createApprovalRule, updateApprovalRule
} = require('../controllers/settings.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN'])); // Only ADMIN can access settings

router.get('/eco-stages', getEcoStages);
router.post('/eco-stages', createEcoStage);
router.put('/eco-stages/:id', updateEcoStage);

router.get('/approval-rules', getApprovalRules);
router.post('/approval-rules', createApprovalRule);
router.put('/approval-rules/:id', updateApprovalRule);

module.exports = router;
