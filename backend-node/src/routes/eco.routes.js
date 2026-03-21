const express = require('express');
const { 
  getAllEcos, getEcoById, createEcoDraft, updateEcoDraft, 
  startEco, validateEco, approveEco, rejectEco 
} = require('../controllers/eco.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Viewing
router.get('/', getAllEcos);
router.get('/:id', getEcoById);

// Creation/Edit (Eng & Admin)
router.post('/', requireRole(['ADMIN', 'ENGINEERING']), createEcoDraft);
router.put('/:id', requireRole(['ADMIN', 'ENGINEERING']), updateEcoDraft);
router.post('/:id/start', requireRole(['ADMIN', 'ENGINEERING']), startEco);

// Workflow Actions
router.post('/:id/validate', requireRole(['ADMIN', 'APPROVER', 'ENGINEERING']), validateEco);
router.post('/:id/approve', requireRole(['ADMIN', 'APPROVER']), approveEco);
router.post('/:id/reject', requireRole(['ADMIN', 'APPROVER']), rejectEco);

module.exports = router;
