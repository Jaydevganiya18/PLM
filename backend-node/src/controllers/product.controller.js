const { Product, ProductVersion, AuditLog } = require('../lib/prisma');
const { sequelize } = require('../lib/prisma');

const getAllProducts = async (req, res, next) => {
  try {
    const isOps = req.user.role === 'OPERATIONS';

    const where = isOps ? { status: 'ACTIVE' } : {};
    const products = await Product.findAll({
      where,
      include: [{ model: ProductVersion, as: 'current_version' }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isOps = req.user.role === 'OPERATIONS';

    const product = await Product.findOne({
      where: { id: parseInt(id) },
      include: [{ model: ProductVersion, as: 'current_version' }],
    });

    if (!product || (isOps && product.status !== 'ACTIVE')) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { product_code, name, sale_price, cost_price } = req.body;

    const existing = await Product.findOne({ where: { product_code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Product code already exists' });
    }

    const result = await sequelize.transaction(async (t) => {
      const p = await Product.create(
        { product_code, created_by: req.user.userId },
        { transaction: t }
      );

      const pv = await ProductVersion.create(
        {
          product_id: p.id,
          version_no: 1,
          name,
          sale_price,
          cost_price,
          effective_date: new Date(),
          created_by: req.user.userId,
        },
        { transaction: t }
      );

      await p.update({ current_version_id: pv.id }, { transaction: t });

      await AuditLog.create(
        {
          user_id: req.user.userId,
          action: 'CREATE_PRODUCT',
          affected_type: 'PRODUCT',
          affected_id: p.id,
          smart_summary: `Created product ${product_code} v1`,
        },
        { transaction: t }
      );

      // Reload with current_version included
      return Product.findOne({
        where: { id: p.id },
        include: [{ model: ProductVersion, as: 'current_version' }],
        transaction: t,
      });
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updateProductDirect = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sale_price, cost_price } = req.body;

    const product = await Product.findOne({ where: { id: parseInt(id) } });
    if (!product || !product.current_version_id) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await ProductVersion.update(
      { name, sale_price, cost_price },
      { where: { id: product.current_version_id } }
    );
    const updatedPv = await ProductVersion.findOne({ where: { id: product.current_version_id } });

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'UPDATE_PRODUCT_DIRECT',
      affected_type: 'PRODUCT',
      affected_id: product.id,
      smart_summary: `Admin directly updated product ${product.product_code}`,
    });

    res.json({ success: true, data: updatedPv });
  } catch (err) {
    next(err);
  }
};

const archiveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await sequelize.transaction(async (t) => {
      await Product.update(
        { status: 'ARCHIVED', archived_at: new Date() },
        { where: { id: parseInt(id) }, transaction: t }
      );
      const p = await Product.findOne({ where: { id: parseInt(id) }, transaction: t });

      if (p.current_version_id) {
        await ProductVersion.update(
          { status: 'ARCHIVED', archived_at: new Date() },
          { where: { id: p.current_version_id }, transaction: t }
        );
      }

      await AuditLog.create(
        {
          user_id: req.user.userId,
          action: 'ARCHIVE_PRODUCT',
          affected_type: 'PRODUCT',
          affected_id: p.id,
          smart_summary: `Archived product ${p.product_code}`,
        },
        { transaction: t }
      );

      return p;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getProductVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const versions = await ProductVersion.findAll({
      where: { product_id: parseInt(id) },
      order: [['version_no', 'DESC']],
      include: [
        {
          model: require('../lib/prisma').Eco,
          as: 'created_via_eco',
          attributes: ['eco_number', 'title'],
        },
      ],
    });
    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProducts, getProductById, createProduct, updateProductDirect, archiveProduct, getProductVersions,
};
