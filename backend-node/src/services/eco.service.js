const {
  Eco, Product, ProductVersion, ProductAttachment, Bom, BomVersion, BomComponent, BomOperation, AuditLog, sequelize,
} = require('../lib/prisma');

/**
 * Capture a snapshot of the active product or BoM version.
 */
const captureSnapshot = async (ecoType, productId, bomId) => {
  if (ecoType === 'PRODUCT') {
    const p = await Product.findOne({
      where: { id: productId },
      include: [
        {
          model: ProductVersion,
          as: 'current_version',
          include: [{ model: ProductAttachment, as: 'attachments' }],
        },
      ],
    });
    if (!p || !p.current_version) throw new Error('No active product version to snapshot');
    return p.current_version.toJSON();
  } else if (ecoType === 'BOM') {
    const b = await Bom.findOne({
      where: { id: bomId },
      include: [
        {
          model: BomVersion,
          as: 'current_version',
          include: [
            { model: BomComponent, as: 'components' },
            { model: BomOperation, as: 'operations' },
          ],
        },
      ],
    });
    if (!b || !b.current_version) throw new Error('No active BoM version to snapshot');
    return b.current_version.toJSON();
  }
};

/**
 * Apply the ECO changes to the master data
 */
const applyEcoChanges = async (ecoId, userId) => {
  const eco = await Eco.findOne({ where: { id: ecoId } });
  if (!eco) throw new Error('ECO not found');

  const proposed = eco.proposed_changes;

  await sequelize.transaction(async (t) => {
    if (eco.eco_type === 'PRODUCT') {
      if (eco.version_update) {
        // Get the source version
        const lastVersion = await ProductVersion.findOne({
          where: { id: eco.source_product_version_id },
          transaction: t,
        });

        // Archive old version
        await ProductVersion.update(
          { status: 'ARCHIVED', archived_at: new Date() },
          { where: { id: lastVersion.id }, transaction: t }
        );

        // Create new version
        const newV = await ProductVersion.create(
          {
            product_id: eco.product_id,
            version_no: lastVersion.version_no + 1,
            name: proposed.name,
            sale_price: proposed.sale_price,
            cost_price: proposed.cost_price,
            effective_date: eco.effective_date || new Date(),
            created_via_eco_id: eco.id,
            created_by: userId,
          },
          { transaction: t }
        );

        // Copy attachments
        if (proposed.attachments && proposed.attachments.length > 0) {
          await ProductAttachment.bulkCreate(
            proposed.attachments.map((a) => ({
              product_version_id: newV.id,
              file_name: a.file_name,
              file_url: a.file_url,
              uploaded_by: userId,
            })),
            { transaction: t }
          );
        }

        // Update product current_version_id
        await Product.update(
          { current_version_id: newV.id },
          { where: { id: eco.product_id }, transaction: t }
        );
      } else {
        // Update same version
        await ProductVersion.update(
          {
            name: proposed.name,
            sale_price: proposed.sale_price,
            cost_price: proposed.cost_price,
            effective_date: eco.effective_date,
          },
          { where: { id: eco.source_product_version_id }, transaction: t }
        );

        // Attachment logic: Delete all, recreate
        await ProductAttachment.destroy({
          where: { product_version_id: eco.source_product_version_id },
          transaction: t,
        });
        if (proposed.attachments && proposed.attachments.length > 0) {
          await ProductAttachment.bulkCreate(
            proposed.attachments.map((a) => ({
              product_version_id: eco.source_product_version_id,
              file_name: a.file_name,
              file_url: a.file_url,
              uploaded_by: userId,
            })),
            { transaction: t }
          );
        }
      }

    } else if (eco.eco_type === 'BOM') {
      if (eco.version_update) {
        const lastVersion = await BomVersion.findOne({
          where: { id: eco.source_bom_version_id },
          transaction: t,
        });

        await BomVersion.update(
          { status: 'ARCHIVED', archived_at: new Date() },
          { where: { id: lastVersion.id }, transaction: t }
        );

        const newV = await BomVersion.create(
          {
            bom_id: eco.bom_id,
            version_no: lastVersion.version_no + 1,
            effective_date: eco.effective_date || new Date(),
            created_via_eco_id: eco.id,
            created_by: userId,
          },
          { transaction: t }
        );

        if (proposed.components?.length > 0) {
          await BomComponent.bulkCreate(
            proposed.components.map((c, i) => ({
              bom_version_id: newV.id,
              line_no: i + 1,
              component_product_id: parseInt(c.component_product_id),
              quantity: c.quantity,
              uom: c.uom,
            })),
            { transaction: t }
          );
        }

        if (proposed.operations?.length > 0) {
          await BomOperation.bulkCreate(
            proposed.operations.map((o, i) => ({
              bom_version_id: newV.id,
              line_no: i + 1,
              operation_name: o.operation_name,
              work_center: o.work_center,
              duration_minutes: o.duration_minutes,
            })),
            { transaction: t }
          );
        }

        await Bom.update(
          { current_version_id: newV.id },
          { where: { id: eco.bom_id }, transaction: t }
        );
      } else {
        // Update same version
        await BomComponent.destroy({ where: { bom_version_id: eco.source_bom_version_id }, transaction: t });
        await BomOperation.destroy({ where: { bom_version_id: eco.source_bom_version_id }, transaction: t });

        if (proposed.components?.length > 0) {
          await BomComponent.bulkCreate(
            proposed.components.map((c, i) => ({
              bom_version_id: eco.source_bom_version_id,
              line_no: i + 1,
              component_product_id: parseInt(c.component_product_id),
              quantity: c.quantity,
              uom: c.uom,
            })),
            { transaction: t }
          );
        }

        if (proposed.operations?.length > 0) {
          await BomOperation.bulkCreate(
            proposed.operations.map((o, i) => ({
              bom_version_id: eco.source_bom_version_id,
              line_no: i + 1,
              operation_name: o.operation_name,
              work_center: o.work_center,
              duration_minutes: o.duration_minutes,
            })),
            { transaction: t }
          );
        }
      }
    }
  }); // end transaction

  // Audit log outside transaction (non-critical)
  await AuditLog.create({
    user_id: userId,
    action: 'APPLY_ECO',
    affected_type: 'ECO',
    affected_id: ecoId,
    eco_id: ecoId,
    smart_summary: `Applied ECO ${eco.eco_number} changes to master data`,
  }).catch(() => {}); // log failures silently
};

module.exports = { captureSnapshot, applyEcoChanges };
