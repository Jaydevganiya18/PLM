const express = require('express');
const { 
  getAllBoms, getBomById, createBom, 
  updateBomDirect, archiveBom, getBomVersions,
  getBomVersionComponents, getBomVersionOperations
} = require('../controllers/bom.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// All roles can view
router.get('/', getAllBoms);
router.get('/:id', getBomById);
router.get('/:id/versions', requireRole(['ADMIN', 'ENGINEERING', 'APPROVER']), getBomVersions);
router.get('/versions/:versionId/components', getBomVersionComponents);
router.get('/versions/:versionId/operations', getBomVersionOperations);

// Only ADMIN can direct edit/create/archive outside ECO
router.post('/', requireRole(['ADMIN']), createBom);
router.put('/:id', requireRole(['ADMIN']), updateBomDirect);
router.patch('/:id/archive', requireRole(['ADMIN']), archiveBom);

module.exports = router;
