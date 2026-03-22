const {
  Eco, Product, ProductVersion, Bom, BomVersion, BomComponent, BomOperation, EcoStage, User,
} = require('../lib/prisma');

const getEcoReport = async (req, res, next) => {
  try {
    const ecos = await Eco.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['product_code'] },
        { model: Bom, as: 'bom', attributes: ['bom_code'] },
        { model: EcoStage, as: 'current_stage', attributes: ['name'] },
        { model: User, as: 'requester', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: ecos });
  } catch (err) {
    next(err);
  }
};

const getProductVersionHistory = async (req, res, next) => {
  try {
    const history = await ProductVersion.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['product_code'] },
        { model: Eco, as: 'created_via_eco', attributes: ['eco_number'] },
      ],
      order: [
        ['product_id', 'ASC'],
        ['version_no', 'DESC'],
      ],
    });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const getBomChangeHistory = async (req, res, next) => {
  try {
    const history = await BomVersion.findAll({
      include: [
        {
          model: Bom,
          as: 'bom',
          attributes: ['bom_code'],
          include: [{ model: Product, as: 'product', attributes: ['product_code'] }],
        },
        { model: Eco, as: 'created_via_eco', attributes: ['eco_number'] },
        { model: BomComponent, as: 'components', attributes: ['id'] },
        { model: BomOperation, as: 'operations', attributes: ['id'] },
      ],
      order: [
        ['bom_id', 'ASC'],
        ['version_no', 'DESC'],
      ],
    });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const getArchivedProducts = async (req, res, next) => {
  try {
    const archived = await Product.findAll({
      where: { status: 'ARCHIVED' },
      include: [{ model: ProductVersion, as: 'current_version' }],
      order: [['archived_at', 'DESC']],
    });
    res.json({ success: true, data: archived });
  } catch (err) {
    next(err);
  }
};

const getActiveMatrix = async (req, res, next) => {
  try {
    const matrix = await Product.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: ProductVersion,
          as: 'current_version',
          attributes: ['version_no', 'name', 'status'],
        },
        {
          model: Bom,
          as: 'boms',
          where: { status: 'ACTIVE' },
          required: false,
          include: [
            {
              model: BomVersion,
              as: 'current_version',
              attributes: ['version_no', 'status'],
            },
          ],
        },
      ],
    });
    res.json({ success: true, data: matrix });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEcoReport, getProductVersionHistory, getBomChangeHistory, getArchivedProducts, getActiveMatrix,
};
