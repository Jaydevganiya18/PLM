const prisma = require('../lib/prisma');

const getEcoReport = async (req, res, next) => {
  try {
    const ecos = await prisma.eco.findMany({
      include: {
        product: { select: { product_code: true, name: true } },
        bom: { select: { bom_code: true } },
        current_stage: { select: { name: true } },
        requester: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: ecos });
  } catch (err) {
    next(err);
  }
};

const getProductVersionHistory = async (req, res, next) => {
  try {
    const history = await prisma.productVersion.findMany({
      include: {
        product: { select: { product_code: true } },
        created_via_eco: { select: { eco_number: true } }
      },
      orderBy: [
        { product_id: 'asc' },
        { version_no: 'desc' }
      ]
    });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const getBomChangeHistory = async (req, res, next) => {
  try {
    const history = await prisma.bomVersion.findMany({
      include: {
        bom: { select: { bom_code: true, product: { select: { product_code: true } } } },
        created_via_eco: { select: { eco_number: true } },
        _count: { select: { components: true, operations: true } }
      },
      orderBy: [
        { bom_id: 'asc' },
        { version_no: 'desc' }
      ]
    });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const getArchivedProducts = async (req, res, next) => {
  try {
    const archived = await prisma.product.findMany({
      where: { status: 'ARCHIVED' },
      include: {
        current_version: true
      },
      orderBy: { archived_at: 'desc' }
    });
    res.json({ success: true, data: archived });
  } catch (err) {
    next(err);
  }
};

const getActiveMatrix = async (req, res, next) => {
  try {
    const matrix = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        current_version: { select: { version_no: true, name: true, status: true } },
        boms: {
          where: { status: 'ACTIVE' },
          include: { current_version: { select: { version_no: true, status: true } } }
        }
      }
    });
    res.json({ success: true, data: matrix });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEcoReport, getProductVersionHistory, getBomChangeHistory, getArchivedProducts, getActiveMatrix
};
