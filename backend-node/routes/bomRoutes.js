// =============================================================================
// backend-node/routes/bomRoutes.js
// =============================================================================
const express = require('express');
const router = express.Router();
const { BoM, Product } = require('../db');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

// GET all active BoMs
router.get('/', async (req, res, next) => {
    try {
        const boms = await BoM.findAll({
            where: { is_active: true },
            include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'version'] }],
        });
        res.json(boms);
    } catch (e) { next(e); }
});

// GET single BoM
router.get('/:id', async (req, res, next) => {
    try {
        const b = await BoM.findByPk(req.params.id, {
            include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'version'] }],
        });
        if (!b) return res.status(404).json({ error: 'BoM not found' });
        res.json(b);
    } catch (e) { next(e); }
});

// POST create initial BoM
router.post('/', requireRole('Admin', 'Engineering'), async (req, res, next) => {
    try {
        const { product_id, components, operations } = req.body;
        if (!product_id) return res.status(400).json({ error: 'product_id required' });

        const product = await Product.findOne({ where: { id: product_id, is_active: true } });
        if (!product) return res.status(404).json({ error: 'Active Product not found' });

        const b = await BoM.create({
            product_id, components: components || [], operations: operations || [],
            version: 1, is_active: true, parent_id: null,
        });
        res.status(201).json(b);
    } catch (e) { next(e); }
});

// PUT is BLOCKED
router.put('/:id', (_req, res) => {
    res.status(405).json({
        error: 'IMMUTABILITY_VIOLATION: Direct BoM updates not allowed. Create an ECO.',
    });
});

module.exports = router;