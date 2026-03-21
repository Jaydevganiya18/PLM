const prisma = require('../lib/prisma');

const getAllBoms = async (req, res, next) => {
  try {
    const isOps = req.user.role === 'OPERATIONS';

    const boms = await prisma.bom.findMany({
      where: isOps ? { status: 'ACTIVE' } : {},
      include: {
        product: true,
        current_version: true
      },
      orderBy: { created_at: 'desc' },
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

    const bom = await prisma.bom.findUnique({
      where: { id: parseInt(id) },
      include: { 
        product: true,
        current_version: {
          include: {
            components: { include: { component_product: true } },
            operations: true
          }
        } 
      }
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
    // Only Admin can create directly outside ECO
    const { bom_code, product_id, components, operations } = req.body;

    const existingId = await prisma.bom.findUnique({ where: { bom_code } });
    if (existingId) return res.status(400).json({ success: false, message: 'BoM code already exists' });

    const newBom = await prisma.$transaction(async (tx) => {
      const b = await tx.bom.create({
        data: {
          bom_code,
          product_id: parseInt(product_id),
          created_by: req.user.userId,
        }
      });

      const bv = await tx.bomVersion.create({
        data: {
          bom_id: b.id,
          version_no: 1,
          effective_date: new Date(),
          created_by: req.user.userId,
        }
      });

      if (components && components.length > 0) {
        await tx.bomComponent.createMany({
          data: components.map((c, i) => ({
            bom_version_id: bv.id,
            line_no: i + 1,
            component_product_id: parseInt(c.component_product_id),
            quantity: c.quantity,
            uom: c.uom
          }))
        });
      }

      if (operations && operations.length > 0) {
        await tx.bomOperation.createMany({
          data: operations.map((o, i) => ({
            bom_version_id: bv.id,
            line_no: i + 1,
            operation_name: o.operation_name,
            work_center: o.work_center,
            duration_minutes: o.duration_minutes
          }))
        });
      }

      const updatedB = await tx.bom.update({
        where: { id: b.id },
        data: { current_version_id: bv.id },
        include: { current_version: true }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.userId, action: 'CREATE_BOM', affected_type: 'BOM', affected_id: b.id,
          smart_summary: `Created BoM ${bom_code} v1`
        }
      });

      return updatedB;
    });

    res.status(201).json({ success: true, data: newBom });
  } catch (err) {
    next(err);
  }
};

const updateBomDirect = async (req, res, next) => {
  // Directly replacing components and operations for the current active version (Admin only)
  try {
    const { id } = req.params;
    const { components, operations } = req.body;

    const bom = await prisma.bom.findUnique({ where: { id: parseInt(id) } });
    if (!bom || !bom.current_version_id) return res.status(404).json({ success: false, message: 'BoM not found' });

    await prisma.$transaction(async (tx) => {
      // Delete existing
      await tx.bomComponent.deleteMany({ where: { bom_version_id: bom.current_version_id } });
      await tx.bomOperation.deleteMany({ where: { bom_version_id: bom.current_version_id } });

      // Insert new
      if (components && components.length > 0) {
        await tx.bomComponent.createMany({
          data: components.map((c, i) => ({
            bom_version_id: bom.current_version_id,
            line_no: i + 1,
            component_product_id: parseInt(c.component_product_id),
            quantity: c.quantity,
            uom: c.uom
          }))
        });
      }

      if (operations && operations.length > 0) {
        await tx.bomOperation.createMany({
          data: operations.map((o, i) => ({
            bom_version_id: bom.current_version_id,
            line_no: i + 1,
            operation_name: o.operation_name,
            work_center: o.work_center,
            duration_minutes: o.duration_minutes
          }))
        });
      }

      await tx.auditLog.create({
        data: {
          user_id: req.user.userId, action: 'UPDATE_BOM_DIRECT', affected_type: 'BOM', affected_id: bom.id,
          smart_summary: `Admin directly updated BoM ${bom.bom_code}`
        }
      });
    });

    res.json({ success: true, message: 'BoM updated directly' });
  } catch (err) {
    next(err);
  }
};

const archiveBom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.bom.update({
        where: { id: parseInt(id) },
        data: { status: 'ARCHIVED', archived_at: new Date() }
      });

      if (b.current_version_id) {
        await tx.bomVersion.update({
          where: { id: b.current_version_id },
          data: { status: 'ARCHIVED', archived_at: new Date() }
        });
      }

      await tx.auditLog.create({
        data: {
          user_id: req.user.userId, action: 'ARCHIVE_BOM', affected_type: 'BOM', affected_id: b.id,
          smart_summary: `Archived BoM ${b.bom_code}`
        }
      });

      return b;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const getBomVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const versions = await prisma.bomVersion.findMany({
      where: { bom_id: parseInt(id) },
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

const getBomVersionComponents = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const components = await prisma.bomComponent.findMany({
      where: { bom_version_id: parseInt(versionId) },
      include: { component_product: true },
      orderBy: { line_no: 'asc' }
    });
    res.json({ success: true, data: components });
  } catch (err) {
    next(err);
  }
};

const getBomVersionOperations = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const operations = await prisma.bomOperation.findMany({
      where: { bom_version_id: parseInt(versionId) },
      orderBy: { line_no: 'asc' }
    });
    res.json({ success: true, data: operations });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBoms, getBomById, createBom, updateBomDirect, archiveBom, getBomVersions,
  getBomVersionComponents, getBomVersionOperations
};
