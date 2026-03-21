const express = require('express');
const { 
  getEcoReport, getProductVersionHistory, getBomChangeHistory, 
  getArchivedProducts, getActiveMatrix 
} = require('../controllers/report.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN'])); // Admin only reports

router.get('/eco', getEcoReport);
router.get('/product-version-history', getProductVersionHistory);
router.get('/bom-change-history', getBomChangeHistory);
router.get('/archived-products', getArchivedProducts);
router.get('/active-matrix', getActiveMatrix);

module.exports = router;
