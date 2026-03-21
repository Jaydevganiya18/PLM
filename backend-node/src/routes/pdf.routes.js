const express = require('express');
const { generateEcoPdf, generateUnifiedReportPdf } = require('../controllers/pdf.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/eco/:id', generateEcoPdf);
router.get('/report/all', generateUnifiedReportPdf);

module.exports = router;

