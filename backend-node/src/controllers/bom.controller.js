const {
  Bom, BomVersion, BomComponent, BomOperation, Product, AuditLog, Eco, sequelize,
} = require('../lib/prisma');

const getAllBoms = async (req, res, next) => {
  try {
    const isOps = req.user.role === 'OPERATIONS';
    const where = isOps ? { status: 'ACTIVE' } : {};

    const boms = await Bom.findAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: BomVersion, as: 'current_version' },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: boms });
  } catch (err) {
    next(err);
  }
};

const getBomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isOps = req.user.role === 'OPERATIONS';

    const bom = await Bom.findOne({
      where: { id: parseInt(id) },
      include: [
        { model: Product, as: 'product' },
        {
          model: BomVersion,
          as: 'current_version',
          include: [
            { model: BomComponent, as: 'components', include: [{ model: Product, as: 'component_product' }] },
            { model: BomOperation, as: 'operations' },
          ],
        },
      ],
    });

    if (!bom || (isOps && bom.status !== 'ACTIVE')) {
      return res.status(404).json({ success: false, message: 'BoM not found' });
    }

    res.json({ success: true, data: bom });
  } catch (err) {
    next(err);
  }
};

const createBom = async (req, res, next) => {
  try {
    const { bom_code, product_id, components, operations } = req.body;

    const existingId = await Bom.findOne({ where: { bom_code } });
    if (existingId) return res.status(400).json({ success: false, message: 'BoM code already exists' });

    const newBom = await sequelize.transaction(async (t) => {
      const b = await Bom.create(
        { bom_code, product_id: parseInt(product_id), created_by: req.user.userId },
        { transaction: t }
      );

      const bv = await BomVersion.create(
        { bom_id: b.id, version_no: 1, effective_date: new Date(), created_by: req.user.userId },
        { transaction: t }
      );

      if (components && components.length > 0) {
        await BomComponent.bulkCreate(
          components.map((c, i) => ({
            bom_version_id: bv.id,
            line_no: i + 1,
            component_product_id: parseInt(c.component_product_id),
            quantity: c.quantity,
            uom: c.uom,
          })),
          { transaction: t }
        );
      }

      if (operations && operations.length > 0) {
        await BomOperation.bulkCreate(
          operations.map((o, i) => ({
            bom_version_id: bv.id,
            line_no: i + 1,
            operation_name: o.operation_name,
            work_center: o.work_center,
            duration_minutes: o.duration_minutes,
          })),
          { transaction: t }
        );
      }

      await b.update({ current_version_id: bv.id }, { transaction: t });

      await AuditLog.create(
        {
          user_id: req.user.userId,
          action: 'CREATE_BOM',
          affected_type: 'BOM',
          affected_id: b.id,
          smart_summary: `Created BoM ${bom_code} v1`,
        },
        { transaction: t }
      );

      return Bom.findOne({
        where: { id: b.id },
        include: [{ model: BomVersion, as: 'current_version' }],
        transaction: t,
      });
    });

    res.status(201).json({ success: true, data: newBom });
  } catch (err) {
    next(err);
  }
};

const updateBomDirect = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { components, operations } = req.body;

    const bom = await Bom.findOne({ where: { id: parseInt(id) } });
    if (!bom || !bom.current_version_id) {
      return res.status(404).json({ success: false, message: 'BoM not found' });
    }

    await sequelize.transaction(async (t) => {
      await BomComponent.destroy({ where: { bom_version_id: bom.current_version_id }, transaction: t });
      await BomOperation.destroy({ where: { bom_version_id: bom.current_version_id }, transaction: t });

      if (components && components.length > 0) {
        await BomComponent.bulkCreate(
          components.map((c, i) => ({
            bom_version_id: bom.current_version_id,
            line_no: i + 1,
            component_product_id: parseInt(c.component_product_id),
            quantity: c.quantity,
            uom: c.uom,
          })),
          { transaction: t }
        );
      }

      if (operations && operations.length > 0) {
        await BomOperation.bulkCreate(
          operations.map((o, i) => ({
            bom_version_id: bom.current_version_id,
            line_no: i + 1,
            operation_name: o.operation_name,
            work_center: o.work_center,
            duration_minutes: o.duration_minutes,
          })),
          { transaction: t }
        );
      }

      await AuditLog.create(
        {
          user_id: req.user.userId,
          action: 'UPDATE_BOM_DIRECT',
          affected_type: 'BOM',
          affected_id: bom.id,
          smart_summary: `Admin directly updated BoM ${bom.bom_code}`,
        },
        { transaction: t }
      );
    });

    res.json({ success: true, message: 'BoM updated directly' });
  } catch (err) {
    next(err);
  }
};

const archiveBom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await sequelize.transaction(async (t) => {
      await Bom.update(
        { status: 'ARCHIVED', archived_at: new Date() },
        { where: { id: parseInt(id) }, transaction: t }
      );
      const b = await Bom.findOne({ where: { id: parseInt(id) }, transaction: t });

      if (b.current_version_id) {
        await BomVersion.update(
          { status: 'ARCHIVED', archived_at: new Date() },
          { where: { id: b.current_version_id }, transaction: t }
        );
      }

      await AuditLog.create(
        {
          user_id: req.user.userId,
          action: 'ARCHIVE_BOM',
          affected_type: 'BOM',
          affected_id: b.id,
          smart_summary: `Archived BoM ${b.bom_code}`,
        },
        { transaction: t }
      );

      return b;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getBomVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const versions = await BomVersion.findAll({
      where: { bom_id: parseInt(id) },
      order: [['version_no', 'DESC']],
      include: [
        { model: Eco, as: 'created_via_eco', attributes: ['eco_number', 'title'] },
      ],
    });
    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
};

const getBomVersionComponents = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const components = await BomComponent.findAll({
      where: { bom_version_id: parseInt(versionId) },
      include: [{ model: Product, as: 'component_product' }],
      order: [['line_no', 'ASC']],
    });
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const getBomVersionOperations = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const operations = await BomOperation.findAll({
      where: { bom_version_id: parseInt(versionId) },
      order: [['line_no', 'ASC']],
    });
    res.json({ success: true, data: operations });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBoms, getBomById, createBom, updateBomDirect, archiveBom, getBomVersions,
  getBomVersionComponents, getBomVersionOperations,
};
