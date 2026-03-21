const express = require('express');
const { 
  getAllProducts, getProductById, createProduct, 
  updateProductDirect, archiveProduct, getProductVersions 
} = require('../controllers/product.controller');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// All roles can view
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/:id/versions', requireRole(['ADMIN', 'ENGINEERING', 'APPROVER']), getProductVersions);

// Only ADMIN can direct edit/create/archive outside ECO
router.post('/', requireRole(['ADMIN']), createProduct);
router.put('/:id', requireRole(['ADMIN']), updateProductDirect);
router.patch('/:id/archive', requireRole(['ADMIN']), archiveProduct);

module.exports = router;
