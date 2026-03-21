// =============================================================================
// backend-node/routes/ecoRoutes.js
// =============================================================================
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ecoController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getAllECOs);
router.get('/:id', ctrl.getECOById);
router.post('/', requireRole('Engineering', 'Admin'), ctrl.createECO);
router.patch('/:id/submit', requireRole('Engineering', 'Admin'), ctrl.submitECO);
router.post('/:id/approve', requireRole('Approver', 'Admin'), ctrl.approveECO);
router.post('/:id/reject', requireRole('Approver', 'Admin'), ctrl.rejectECO);
router.post('/:id/clone', requireRole('Engineering', 'Admin'), ctrl.cloneECO);

module.exports = router;