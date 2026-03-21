const prisma = require('../lib/prisma');

const getAllProducts = async (req, res, next) => {
  try {
    const isOps = req.user.role === 'OPERATIONS';

    const products = await prisma.product.findMany({
      where: isOps ? { status: 'ACTIVE' } : {},
      include: {
        current_version: true
      },
      orderBy: { created_at: 'desc' },
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

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { current_version: true }
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
    // Only Admin can create directly outside ECO
    const { product_code, name, sale_price, cost_price } = req.body;

    const existing = await prisma.product.findUnique({ where: { product_code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Product code already exists' });
    }

    // Wrap in transaction
    const newProduct = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          product_code,
          created_by: req.user.userId,
        }
      });

      const pv = await tx.productVersion.create({
        data: {
          product_id: p.id,
          version_no: 1,
          name,
          sale_price,
          cost_price,
          effective_date: new Date(),
          created_by: req.user.userId,
        }
      });

      const updatedP = await tx.product.update({
        where: { id: p.id },
        data: { current_version_id: pv.id },
        include: { current_version: true }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.userId, action: 'CREATE_PRODUCT', affected_type: 'PRODUCT', affected_id: p.id,
          smart_summary: `Created product ${product_code} v1`
        }
      });

      return updatedP;
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    next(err);
  }
};

const updateProductDirect = async (req, res, next) => {
  try {
    // Only Admin
    const { id } = req.params;
    const { name, sale_price, cost_price } = req.body;

    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!product || !product.current_version_id) return res.status(404).json({ success: false, message: 'Product not found' });

    const updatedPv = await prisma.productVersion.update({
      where: { id: product.current_version_id },
      data: { name, sale_price, cost_price }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId, action: 'UPDATE_PRODUCT_DIRECT', affected_type: 'PRODUCT', affected_id: product.id,
        smart_summary: `Admin directly updated product ${product.product_code}`
      }
    });

    res.json({ success: true, data: updatedPv });
  } catch (err) {
    next(err);
  }
};

const archiveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: parseInt(id) },
        data: { status: 'ARCHIVED', archived_at: new Date() }
      });

      if (p.current_version_id) {
        await tx.productVersion.update({
          where: { id: p.current_version_id },
          data: { status: 'ARCHIVED', archived_at: new Date() }
        });
      }

      await tx.auditLog.create({
        data: {
          user_id: req.user.userId, action: 'ARCHIVE_PRODUCT', affected_type: 'PRODUCT', affected_id: p.id,
          smart_summary: `Archived product ${p.product_code}`
        }
      });

      return p;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const getProductVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const versions = await prisma.productVersion.findMany({
      where: { product_id: parseInt(id) },
      orderBy: { version_no: 'desc' },
      include: {
        created_via_eco: { select: { eco_number: true, title: true } }
      }
    });
    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProducts, getProductById, createProduct, updateProductDirect, archiveProduct, getProductVersions
};
