const prisma = require('../lib/prisma');

/**
 * Capture a snapshot of the active product or BoM version.
 */
const captureSnapshot = async (ecoType, productId, bomId) => {
  if (ecoType === 'PRODUCT') {
    const p = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        current_version: {
          include: { attachments: true }
        }
      }
    });
    if (!p || !p.current_version) throw new Error("No active product version to snapshot");
    return p.current_version;
  } else if (ecoType === 'BOM') {
    const b = await prisma.bom.findUnique({
      where: { id: bomId },
      include: {
        current_version: {
          include: {
            components: true,
            operations: true
          }
        }
      }
    });
    if (!b || !b.current_version) throw new Error("No active BoM version to snapshot");
    return b.current_version;
  }
};

/**
 * Apply the ECO changes to the master data
 */
const applyEcoChanges = async (ecoId, userId) => {
  const eco = await prisma.eco.findUnique({ where: { id: ecoId } });
  if (!eco) throw new Error("ECO not found");

  const proposed = eco.proposed_changes;

  await prisma.$transaction(async (tx) => {
    if (eco.eco_type === 'PRODUCT') {
      if (eco.version_update) {
        // Create new version
        const lastVersion = await tx.productVersion.findUnique({ where: { id: eco.source_product_version_id } });
        
        // Archive old version
        await tx.productVersion.update({
          where: { id: lastVersion.id },
          data: { status: 'ARCHIVED', archived_at: new Date() }
        });

        // New version
        const newV = await tx.productVersion.create({
          data: {
            product_id: eco.product_id,
            version_no: lastVersion.version_no + 1,
            name: proposed.name,
            sale_price: proposed.sale_price,
            cost_price: proposed.cost_price,
            effective_date: eco.effective_date || new Date(),
            created_via_eco_id: eco.id,
            created_by: userId
          }
        });

        // Copy attachments (simplified logic: ideally would duplicate paths or reference same S3)
        // Here we just duplicate DB records
        if (proposed.attachments && proposed.attachments.length > 0) {
          await tx.productAttachment.createMany({
            data: proposed.attachments.map(a => ({
              product_version_id: newV.id,
              file_name: a.file_name,
              file_url: a.file_url,
              uploaded_by: userId
            }))
          });
        }

        // Update product 
        await tx.product.update({
          where: { id: eco.product_id },
          data: { current_version_id: newV.id }
        });
      } else {
        // Update same version
        await tx.productVersion.update({
          where: { id: eco.source_product_version_id },
          data: {
            name: proposed.name,
            sale_price: proposed.sale_price,
            cost_price: proposed.cost_price,
            effective_date: eco.effective_date
          }
        });
        
        // Attachment logic: Delete all, recreate
        await tx.productAttachment.deleteMany({ where: { product_version_id: eco.source_product_version_id }});
        if (proposed.attachments && proposed.attachments.length > 0) {
          await tx.productAttachment.createMany({
            data: proposed.attachments.map(a => ({
              product_version_id: eco.source_product_version_id,
              file_name: a.file_name,
              file_url: a.file_url,
              uploaded_by: userId
            }))
          });
        }
      }

    } else if (eco.eco_type === 'BOM') {
      if (eco.version_update) {
        const lastVersion = await tx.bomVersion.findUnique({ where: { id: eco.source_bom_version_id } });
        
        await tx.bomVersion.update({
          where: { id: lastVersion.id },
          data: { status: 'ARCHIVED', archived_at: new Date() }
        });

        const newV = await tx.bomVersion.create({
          data: {
            bom_id: eco.bom_id,
            version_no: lastVersion.version_no + 1,
            effective_date: eco.effective_date || new Date(),
            created_via_eco_id: eco.id,
            created_by: userId
          }
        });

        if (proposed.components?.length > 0) {
          await tx.bomComponent.createMany({
            data: proposed.components.map((c, i) => ({
              bom_version_id: newV.id,
              line_no: i + 1,
              component_product_id: parseInt(c.component_product_id),
              quantity: c.quantity,
              uom: c.uom
            }))
          });
        }

        if (proposed.operations?.length > 0) {
          await tx.bomOperation.createMany({
            data: proposed.operations.map((o, i) => ({
              bom_version_id: newV.id,
              line_no: i + 1,
              operation_name: o.operation_name,
              work_center: o.work_center,
              duration_minutes: o.duration_minutes
            }))
          });
        }

        await tx.bom.update({
          where: { id: eco.bom_id },
          data: { current_version_id: newV.id }
        });
      } else {
        // Update same version
        await tx.bomComponent.deleteMany({ where: { bom_version_id: eco.source_bom_version_id } });
        await tx.bomOperation.deleteMany({ where: { bom_version_id: eco.source_bom_version_id } });

        if (proposed.components?.length > 0) {
          await tx.bomComponent.createMany({
            data: proposed.components.map((c, i) => ({
              bom_version_id: eco.source_bom_version_id,
              line_no: i + 1,
              component_product_id: parseInt(c.component_product_id),
              quantity: c.quantity,
              uom: c.uom
            }))
          });
        }

        if (proposed.operations?.length > 0) {
          await tx.bomOperation.createMany({
            data: proposed.operations.map((o, i) => ({
              bom_version_id: eco.source_bom_version_id,
              line_no: i + 1,
              operation_name: o.operation_name,
              work_center: o.work_center,
              duration_minutes: o.duration_minutes
            }))
          });
        }
      }
    }

  }); // end transaction

  // Audit log outside transaction (non-critical)
  await prisma.auditLog.create({
    data: {
      user_id: userId, action: 'APPLY_ECO', affected_type: 'ECO', affected_id: ecoId, eco_id: ecoId,
      smart_summary: `Applied ECO ${eco.eco_number} changes to master data`
    }
  }).catch(() => {}); // log failures silently
};

module.exports = { captureSnapshot, applyEcoChanges };
