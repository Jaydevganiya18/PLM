const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const password_hash = await bcrypt.hash('password123', 10);

  // Users
  const users = [
    { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', password_hash },
    { name: 'Engineering User', email: 'eng@example.com', role: 'ENGINEERING', password_hash },
    { name: 'Approver User', email: 'approver@example.com', role: 'APPROVER', password_hash },
    { name: 'Operations User', email: 'ops@example.com', role: 'OPERATIONS', password_hash }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' }});
  
  // Stages
  const s1 = await prisma.ecoStage.upsert({
    where: { name: 'New' },
    update: {},
    create: { name: 'New', sequence_no: 1, approval_required: false, is_start_stage: true, is_final_stage: false, created_by: admin.id }
  });

  const s2 = await prisma.ecoStage.upsert({
    where: { name: 'Approval' },
    update: {},
    create: { name: 'Approval', sequence_no: 2, approval_required: true, is_start_stage: false, is_final_stage: false, created_by: admin.id }
  });

  const s3 = await prisma.ecoStage.upsert({
    where: { name: 'Done' },
    update: {},
    create: { name: 'Done', sequence_no: 3, approval_required: false, is_start_stage: false, is_final_stage: true, created_by: admin.id }
  });

  // Approval Rule
  const ruleCount = await prisma.approvalRule.count();
  if (ruleCount === 0) {
    await prisma.approvalRule.create({
      data: { stage_id: s2.id, approver_role: 'APPROVER', min_approvals: 1 }
    });
  }

  // Sample Products & BoM
  const prodExists = await prisma.product.findUnique({ where: { product_code: 'WOOD-TAB' }});
  if (!prodExists) {
    const p1 = await prisma.product.create({
      data: { product_code: 'WOOD-TAB', created_by: admin.id }
    });
    const pv1 = await prisma.productVersion.create({
      data: { product_id: p1.id, version_no: 1, name: 'Wooden Table', sale_price: 150.00, cost_price: 50.00, created_by: admin.id }
    });
    await prisma.product.update({ where: { id: p1.id }, data: { current_version_id: pv1.id } });

    const p2 = await prisma.product.create({
      data: { product_code: 'WOOD-LEG', created_by: admin.id }
    });
    const pv2 = await prisma.productVersion.create({
      data: { product_id: p2.id, version_no: 1, name: 'Table Leg', sale_price: 20.00, cost_price: 5.00, created_by: admin.id }
    });
    await prisma.product.update({ where: { id: p2.id }, data: { current_version_id: pv2.id } });

    const b1 = await prisma.bom.create({
      data: { bom_code: 'BOM-WOOD-TAB', product_id: p1.id, created_by: admin.id }
    });
    const bv1 = await prisma.bomVersion.create({
      data: { bom_id: b1.id, version_no: 1, created_by: admin.id }
    });
    
    await prisma.bomComponent.create({
      data: { bom_version_id: bv1.id, line_no: 1, component_product_id: p2.id, quantity: 4.0, uom: 'pcs' }
    });
    
    await prisma.bomOperation.create({
      data: { bom_version_id: bv1.id, line_no: 1, operation_name: 'Assembly', work_center: 'WC-01', duration_minutes: 30.0 }
    });

    await prisma.bom.update({ where: { id: b1.id }, data: { current_version_id: bv1.id } });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
