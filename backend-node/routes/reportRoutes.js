const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { ECO, Product, BoM, AuditLog, User } = require('../db');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/reports/eco-summary
router.get('/eco-summary', async (req, res, next) => {
    try {
        const allECOs = await ECO.findAll();
        const total = allECOs.length;

        const by_stage = { New: 0, Approval: 0, Done: 0, Rejected: 0 };
        const by_type = { Product: 0, BoM: 0 };

        allECOs.forEach((e) => {
            if (by_stage[e.stage] !== undefined) by_stage[e.stage]++;
            if (by_type[e.type] !== undefined) by_type[e.type]++;
        });

        // Avg approval time (Done ECOs only)
        const doneECOs = allECOs.filter(
            (e) => e.stage === 'Done' && e.approved_at && e.createdAt
        );
        const avgHours = doneECOs.length
            ? doneECOs.reduce((sum, e) => {
                const diff = new Date(e.approved_at) - new Date(e.createdAt);
                return sum + diff / (1000 * 60 * 60);
            }, 0) / doneECOs.length
            : 0;

        // Top products by ECO count
        const productECOs = await ECO.findAll({
            where: { type: 'Product', product_id: { [Op.ne]: null } },
            include: [{ model: Product, as: 'product', attributes: ['name'] }],
            attributes: ['product_id'],
        });
        const productCounts = {};
        productECOs.forEach((e) => {
            const name = e.product?.name || `Product #${e.product_id}`;
            productCounts[name] = (productCounts[name] || 0) + 1;
        });
        const top_products = Object.entries(productCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            total_ecos: total,
            by_stage,
            by_type,
            avg_approval_time_hours: Math.round(avgHours * 10) / 10,
            top_products_by_eco_count: top_products,
        });
    } catch (e) { next(e); }
});

// GET /api/reports/matrix
// Active Products + their active BoMs
router.get('/matrix', async (req, res, next) => {
    try {
        const products = await Product.findAll({
            where: { is_active: true },
            order: [['name', 'ASC']],
        });
        const result = await Promise.all(
            products.map(async (p) => {
                const boms = await BoM.findAll({ where: { product_id: p.id, is_active: true } });
                return { product: p, boms };
            })
        );
        res.json(result);
    } catch (e) { next(e); }
});

// GET /api/reports/version-lineage/:productId
// Full version tree via parent_id chain
router.get('/version-lineage/:productId', async (req, res, next) => {
    try {
        // Fetch all versions of same product name
        const root = await Product.findByPk(req.params.productId);
        if (!root) return res.status(404).json({ error: 'Product not found' });

        const allVersions = await Product.findAll({
            where: { name: root.name },
            order: [['version', 'ASC']],
        });

        // Build tree
        const map = {};
        allVersions.forEach((p) => { map[p.id] = { ...p.toJSON(), children: [] }; });

        const tree = [];
        allVersions.forEach((p) => {
            if (p.parent_id && map[p.parent_id]) {
                map[p.parent_id].children.push(map[p.id]);
            } else {
                tree.push(map[p.id]);
            }
        });

        res.json({ product_name: root.name, lineage: tree });
    } catch (e) { next(e); }
});

// GET /api/reports/audit-logs
router.get('/audit-logs', async (req, res, next) => {
    try {
        const logs = await AuditLog.findAll({
            include: [{ model: User, as: 'user', attributes: ['name', 'role'] }],
            order: [['timestamp', 'DESC']],
            limit: 100,
        });
        res.json(logs);
    } catch (e) { next(e); }
});

module.exports = router;