
const express = require('express');
const router = express.Router();
const { Product, BoM } = require('../db');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

// GET all active products
router.get('/', async (req, res, next) => {
    try {
        const products = await Product.findAll({
            where: { is_active: true },
            order: [['version', 'DESC']],
        });
        res.json(products);
    } catch (e) { next(e); }
});

// GET version history by product name
router.get('/history/:name', async (req, res, next) => {
    try {
        const products = await Product.findAll({
            where: { name: req.params.name },
            order: [['version', 'ASC']],
        });
        res.json(products);
    } catch (e) { next(e); }
});

// GET single product
router.get('/:id', async (req, res, next) => {
    try {
        const p = await Product.findByPk(req.params.id);
        if (!p) return res.status(404).json({ error: 'Product not found' });
        res.json(p);
    } catch (e) { next(e); }
});

// POST create product (initial — not via ECO)
router.post('/', requireRole('Admin', 'Engineering'), async (req, res, next) => {
    try {
        const { name, sale_price, cost_price, image_url } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });
        const p = await Product.create({
            name, sale_price, cost_price, image_url,
            version: 1, is_active: true, parent_id: null,
        });
        res.status(201).json(p);
    } catch (e) { next(e); }
});

// PUT is BLOCKED — immutability rule
router.put('/:id', (_req, res) => {
    res.status(405).json({
        error: 'IMMUTABILITY_VIOLATION: Direct updates not allowed. Create an ECO.',
    });
});

module.exports = router;