// =============================================================================
// backend-node/src/seed.js  –  Run: npm run seed
// ~300+ records per model (except Users)
// WARNING: Clears existing data first!
// =============================================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');

const {
  sequelize, User, Product, ProductVersion, ProductAttachment,
  Bom, BomVersion, BomComponent, BomOperation,
  EcoStage, ApprovalRule, Eco, EcoApproval, EcoStageHistory, AuditLog,
} = require('./db');

// ── Helpers ─────────────────────────────────────────────────────────────────
const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randDec = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const ago     = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const pad     = (n, len = 3) => String(n).padStart(len, '0');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected\n');

    // ── 1. CLEAR ─────────────────────────────────────────────────────────────
    console.log('🗑️  Clearing old data...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const M of [
      AuditLog, EcoStageHistory, EcoApproval, Eco, ApprovalRule, EcoStage,
      BomComponent, BomOperation, BomVersion, Bom,
      ProductAttachment, ProductVersion, Product, User,
    ]) { await M.destroy({ where: {}, truncate: true }); }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   Done ✅\n');

    // ── 2. USERS (keep 12) ───────────────────────────────────────────────────
    console.log('👤 Creating users...');
    const hash = await bcrypt.hash('password123', 10);
    const usersData = [
      { name: 'Arjun Sharma',   email: 'admin@plm.com',       role: 'ADMIN'       },
      { name: 'Priya Patel',    email: 'admin2@plm.com',      role: 'ADMIN'       },
      { name: 'Rohan Mehta',    email: 'eng1@plm.com',         role: 'ENGINEERING' },
      { name: 'Sneha Gupta',    email: 'eng2@plm.com',         role: 'ENGINEERING' },
      { name: 'Vikram Singh',   email: 'eng3@plm.com',         role: 'ENGINEERING' },
      { name: 'Kavita Joshi',   email: 'eng4@plm.com',         role: 'ENGINEERING' },
      { name: 'Ankit Verma',    email: 'approver1@plm.com',    role: 'APPROVER'    },
      { name: 'Deepika Nair',   email: 'approver2@plm.com',    role: 'APPROVER'    },
      { name: 'Manish Tiwari',  email: 'approver3@plm.com',    role: 'APPROVER'    },
      { name: 'Sunita Rao',     email: 'ops1@plm.com',         role: 'OPERATIONS'  },
      { name: 'Rajesh Kumar',   email: 'ops2@plm.com',         role: 'OPERATIONS'  },
      { name: 'Pooja Agarwal',  email: 'ops3@plm.com',         role: 'OPERATIONS'  },
    ];
    const users = await User.bulkCreate(usersData.map(u => ({ ...u, password_hash: hash, is_active: true })));
    const [admin] = users;
    const engineers = users.filter(u => u.role === 'ENGINEERING');
    const approvers = users.filter(u => u.role === 'APPROVER');
    console.log(`   ${users.length} users ✅`);

    // ── 3. ECO STAGES ────────────────────────────────────────────────────────
    console.log('🔧 Creating ECO stages...');
    const stages = await EcoStage.bulkCreate([
      { name: 'Engineering Review', sequence_no: 1, approval_required: false, is_start_stage: true,  is_final_stage: false, is_active: true, created_by: admin.id },
      { name: 'Approval',           sequence_no: 2, approval_required: true,  is_start_stage: false, is_final_stage: true, is_active: true, created_by: admin.id },
    ]);
    const [stageReview, stageApproval] = stages;
    const stageFinal = stageApproval; // Map final stage references to Approval

    await ApprovalRule.bulkCreate([
      { stage_id: stageApproval.id, approver_role: 'APPROVER', min_approvals: 1, is_active: true },
    ]);
    console.log(`   2 stages + 1 approval rule ✅`);

    // ── 4. PRODUCTS (160 products) ───────────────────
    console.log('📦 Creating 160 products (~400 versions)...');
    
    const prefixes = ['Pro', 'Industrial', 'Advanced', 'Ultra', 'Heavy-Duty', 'Micro', 'Precision', 'Auto', 'Core'];
    const roots = ['Pump', 'Valve', 'Gear', 'Motor', 'Actuator', 'Sensor', 'Conveyor', 'Panel', 'Filter', 'Bearing', 'Drive', 'Switch', 'Controller'];
    const suffixes = ['Assembly', 'Unit', 'Module', 'System', 'Set', 'Kit', 'Array'];

    const products = [];
    const allProductVersionIds = [];

    for (let i = 0; i < 160; i++) {
        const pName = `${rand(prefixes)} ${rand(roots)} ${rand(suffixes)}`;
      const creator  = rand(engineers);
      const basePrice = randDec(2000, 100000);
      const isActive  = i < 140; // 140 active, 20 archived
      const createdAt = ago(randInt(60, 400));

      const p = await Product.create({
        product_code: `P-${pad(i+1, 4)}`,
        status:       isActive ? 'ACTIVE' : 'ARCHIVED',
        created_by:   creator.id,
        archived_at:  isActive ? null : ago(randInt(5, 30)),
        created_at:   createdAt,
      });

      // How many versions? 1-4
      const numVersions = randInt(1, 4);
      let lastPvId = null;

      for (let v = 1; v <= numVersions; v++) {
        const isLast = (v === numVersions);
        const priceMulti = 1 + (v - 1) * 0.08;
        const pv = await ProductVersion.create({
          product_id:        p.id,
          version_no:        v,
          name:              pName + (v > 1 ? ` Rev-${String.fromCharCode(64 + v)}` : ''),
          sale_price:        parseFloat((basePrice * priceMulti).toFixed(2)),
          cost_price:        parseFloat((basePrice * priceMulti * 0.7).toFixed(2)),
          effective_date:    ago(randInt(2, 60)),
          status:            (isLast && isActive) ? 'ACTIVE' : 'ARCHIVED',
          created_by:        rand(engineers).id,
          created_at:        new Date(createdAt.getTime() + v * 7 * 24 * 60 * 60 * 1000),
          archived_at:       (!isLast || !isActive) ? ago(randInt(1, 10)) : null,
        });
        if (isLast) lastPvId = pv.id;
        allProductVersionIds.push(pv.id);
      }

      await p.update({ current_version_id: lastPvId });
      products.push(p);
    }
    const activeProducts = products.filter(p => p.status === 'ACTIVE');
    console.log(`   ${products.length} products, ${allProductVersionIds.length} versions ✅`);

    // ── 5. BOMs (155 BOMs) ──
    console.log('🗂️  Creating 155 BOMs (~450 versions)...');
    const uoms = ['PCS', 'KG', 'MTR', 'LTR', 'SET', 'BOX', 'NOS', 'ROL', 'PKT'];
    const workCenters = ['Assembly A', 'Assembly B', 'Welding', 'Machining', 'Testing', 'QC', 'Painting', 'Packaging'];
    const opNames     = ['Assemble', 'Weld', 'Machine', 'Test', 'Calibrate', 'Inspect', 'Paint', 'Package', 'Polish'];

    const boms = [];

    for (let i = 0; i < 155; i++) {
      const parentProduct = activeProducts[i % activeProducts.length];
      const creator       = rand(engineers);
      const isActive      = i < 135;
      const createdAt     = ago(randInt(30, 300));

      const b = await Bom.create({
        bom_code:   `BOM-${pad(i+1, 4)}`,
        product_id: parentProduct.id,
        status:     isActive ? 'ACTIVE' : 'ARCHIVED',
        created_by: creator.id,
        archived_at: isActive ? null : ago(randInt(5, 20)),
        created_at:  createdAt,
      });

      const numVersions = randInt(2, 4);
      let lastBvId = null;
      const componentRows = [];
      const operationRows = [];

      for (let v = 1; v <= numVersions; v++) {
        const isLast = (v === numVersions);
        const bv = await BomVersion.create({
          bom_id:            b.id,
          version_no:        v,
          status:            (isLast && isActive) ? 'ACTIVE' : 'ARCHIVED',
          effective_date:    ago(randInt(2, 60)),
          created_by:        rand(engineers).id,
          created_at:        new Date(createdAt.getTime() + v * 5 * 24 * 60 * 60 * 1000),
          archived_at:       (!isLast || !isActive) ? ago(randInt(1, 8)) : null,
        });
        if (isLast) lastBvId = bv.id;

        // Components: 4-8 per version
        const compCount = randInt(4, 9);
        const usedProds = [...activeProducts].sort(() => 0.5 - Math.random()).slice(0, compCount);
        for (let j = 0; j < usedProds.length; j++) {
          componentRows.push({
            bom_version_id: bv.id, line_no: j + 1,
            component_product_id: usedProds[j].id,
            quantity: randDec(1, 50), uom: rand(uoms),
          });
        }

        // Operations: 3-6 per version
        const opCount = randInt(3, 7);
        for (let k = 0; k < opCount; k++) {
          operationRows.push({
            bom_version_id: bv.id, line_no: k + 1,
            operation_name: rand(opNames),
            work_center:    rand(workCenters),
            duration_minutes: randDec(10, 480),
          });
        }
      }

      // Bulk insert components and operations for all versions
      if (componentRows.length) await BomComponent.bulkCreate(componentRows);
      if (operationRows.length) await BomOperation.bulkCreate(operationRows);

      await b.update({ current_version_id: lastBvId });
      boms.push(b);
    }
    const activeBoms = boms.filter(b => b.status === 'ACTIVE');
    console.log(`   ${boms.length} BOMs, ${await BomVersion.count()} versions, ${await BomComponent.count()} components, ${await BomOperation.count()} operations ✅`);

    // ── 6. ECOs (300) ────────────────────────────────────────────────────────
    console.log('📋 Creating 300 ECOs...');

    const ecoDistribution = [
      { status: 'DRAFT',       count: 50 },
      { status: 'IN_PROGRESS', count: 80 },
      { status: 'APPLIED',     count: 120 },
      { status: 'REJECTED',    count: 50 },
    ];

    const rejectionReasons = [
      'Insufficient cost justification', 'Fails compliance standards',
      'Conflicts with active ECO', 'Budget exceeded', 'Needs impact analysis',
      'Missing approval documentation', 'Design not validated', 'Supplier not qualified',
    ];
    const approvalComments = [
      'Approved. Changes verified.', 'Checked against compliance docs.',
      'Cost within budget.', 'Engineering sign-off received.', null, null,
    ];
    const ecoTitles = {
        PRODUCT: [
          'Update pricing for market adjustment', 'Revise specifications per customer feedback',
          'Material substitution for cost reduction', 'Design improvement Rev-B',
          'Safety compliance update', 'Weight reduction initiative',
          'Performance upgrade - Phase 2', 'Supplier change adaptation',
          'Dimensional tolerance update', 'Surface finish improvement',
        ],
        BOM: [
          'Revise component quantities', 'Assembly sequence optimization',
          'Replace obsolete components', 'Add quality control step',
          'Reduce cycle time', 'Update work centers', 'Add packaging step',
          'Material requirements revision', 'Operations rebalancing',
          'BOM restructure for efficiency',
        ],
      };

    let ecoCounter = 1;
    const ecoApprovalRows = [];
    const ecoHistoryRows  = [];

    for (const { status, count } of ecoDistribution) {
      for (let n = 0; n < count; n++) {
        const isProduct = Math.random() > 0.45;
        const requester = rand(engineers);
        const daysAgo   = randInt(1, 200);
        const ecoNum    = `ECO-${pad(ecoCounter++, 4)}`;

        let productId, bomId, sourceProductVersionId, sourceBomVersionId;
        let originalSnapshot = {}, proposedChanges = {};
        let currentStageId = null, startedAt = null, approvedAt = null, appliedAt = null;

        if (isProduct) {
          const p  = rand(activeProducts);
          const pv = await ProductVersion.findOne({ where: { product_id: p.id, status: 'ACTIVE' } });
          if (!pv) continue;
          productId = p.id;
          sourceProductVersionId = pv.id;
          originalSnapshot = { id: pv.id, name: pv.name, sale_price: pv.sale_price, cost_price: pv.cost_price };
          proposedChanges  = {
            name:       pv.name + rand([' Improved', ' Rev-B', ' Updated', ' v2', '']),
            sale_price: parseFloat((parseFloat(pv.sale_price) * randDec(0.93, 1.18)).toFixed(2)),
            cost_price: parseFloat((parseFloat(pv.cost_price) * randDec(0.92, 1.12)).toFixed(2)),
          };
        } else {
          const b  = rand(activeBoms);
          const bv = await BomVersion.findOne({ where: { bom_id: b.id, status: 'ACTIVE' } });
          if (!bv) continue;
          const comps = await BomComponent.findAll({ where: { bom_version_id: bv.id } });
          const ops   = await BomOperation.findAll({ where: { bom_version_id: bv.id } });
          productId = b.product_id;
          bomId     = b.id;
          sourceBomVersionId = bv.id;
          originalSnapshot = { id: bv.id, components: comps.map(c => c.toJSON()), operations: ops.map(o => o.toJSON()) };
          proposedChanges  = {
            components: comps.map(c => ({
              component_product_id: c.component_product_id,
              quantity: parseFloat((parseFloat(c.quantity) * randDec(0.8, 1.3)).toFixed(4)),
              uom: c.uom,
            })),
            operations: ops.map(o => ({
              operation_name: o.operation_name, work_center: o.work_center,
              duration_minutes: parseFloat((parseFloat(o.duration_minutes) * randDec(0.85, 1.25)).toFixed(2)),
            })),
          };
        }

        if (status === 'IN_PROGRESS') {
          currentStageId = rand([stageReview.id, stageApproval.id]);
          startedAt = ago(randInt(1, daysAgo));
        } else if (status === 'APPLIED') {
          currentStageId = stageFinal.id;
          startedAt  = ago(randInt(10, daysAgo));
          approvedAt = ago(randInt(3, 9));
          appliedAt  = ago(randInt(0, 2));
        }

        const eco = await Eco.create({
          eco_number:  ecoNum,
          title:       rand(ecoTitles[isProduct ? 'PRODUCT' : 'BOM']),
          eco_type:    isProduct ? 'PRODUCT' : 'BOM',
          product_id:  productId,
          bom_id:      bomId || null,
          source_product_version_id: sourceProductVersionId || null,
          source_bom_version_id:     sourceBomVersionId || null,
          original_snapshot: originalSnapshot,
          proposed_changes:  proposedChanges,
          current_stage_id:  currentStageId,
          status,
          version_update:    Math.random() > 0.15,
          rejection_reason:  status === 'REJECTED' ? rand(rejectionReasons) : null,
          effective_date:    ago(randInt(-15, 45)),
          requested_by:      requester.id,
          started_at:        startedAt,
          approved_at:       approvedAt,
          applied_at:        appliedAt,
          created_at:        ago(daysAgo),
        });

        // Stage history entries
        if (status !== 'DRAFT') {
          ecoHistoryRows.push({ eco_id: eco.id, from_stage_id: null, to_stage_id: stageReview.id, action: 'STARTED', acted_by: requester.id, created_at: startedAt || ago(daysAgo - 1) });

          if (['APPLIED', 'REJECTED', 'IN_PROGRESS'].includes(status) && currentStageId !== stageReview.id) {
            ecoHistoryRows.push({ eco_id: eco.id, from_stage_id: stageReview.id, to_stage_id: stageApproval.id, action: 'VALIDATED', acted_by: rand(engineers).id, created_at: ago(randInt(2, daysAgo - 1)) });
          }

          if (status === 'APPLIED') {
            const approver = rand(approvers);
            ecoApprovalRows.push({ eco_id: eco.id, stage_id: stageApproval.id, approver_id: approver.id, action: 'APPROVED', comment: rand(approvalComments), created_at: approvedAt });
            ecoHistoryRows.push({ eco_id: eco.id, from_stage_id: stageApproval.id, to_stage_id: stageFinal.id, action: 'STAGE_APPROVED', acted_by: approver.id, created_at: approvedAt || ago(3) });
          }

          if (status === 'REJECTED') {
            ecoApprovalRows.push({ eco_id: eco.id, stage_id: stageApproval.id, approver_id: rand(approvers).id, action: 'REJECTED', comment: eco.rejection_reason, created_at: ago(randInt(1, daysAgo)) });
          }
        }
      }
    }

    // Bulk insert approvals & history
    if (ecoApprovalRows.length) await EcoApproval.bulkCreate(ecoApprovalRows);
    if (ecoHistoryRows.length)  await EcoStageHistory.bulkCreate(ecoHistoryRows);
    console.log(`   ${await Eco.count()} ECOs, ${await EcoApproval.count()} approvals, ${await EcoStageHistory.count()} history entries ✅`);

    // ── 7. AUDIT LOGS (300+) ─────────────────────────────────────────────────
    console.log('📝 Creating 300+ audit logs...');
    const allUsers = [...engineers, ...approvers, admin];
    const auditDefs = [
      ['LOGIN','USER'], ['SIGNUP','USER'], ['CREATE_PRODUCT','PRODUCT'],
      ['UPDATE_PRODUCT_DIRECT','PRODUCT'], ['ARCHIVE_PRODUCT','PRODUCT'],
      ['CREATE_BOM','BOM'], ['UPDATE_BOM_DIRECT','BOM'], ['ARCHIVE_BOM','BOM'],
      ['CREATE_ECO_DRAFT','ECO'], ['APPLY_ECO','ECO'],
      ['CREATE_ECO_STAGE','ECO_STAGE'], ['UPDATE_ECO_STAGE','ECO_STAGE'],
      ['CREATE_APPROVAL_RULE','APPROVAL_RULE'],
    ];
    const auditRows = [];
    for (let i = 0; i < 350; i++) {
        const user = rand(allUsers);
        const [action, type] = rand(auditDefs);
        auditRows.push({
          user_id:      user.id,
          action,
          affected_type: type,
          affected_id:  randInt(1, 100),
          eco_id:       action.includes('ECO') ? randInt(1, 300) : null,
          smart_summary: `${user.name} performed ${action} on ${type}`,
          created_at:   ago(randInt(0, 200)),
        });
      }
      await AuditLog.bulkCreate(auditRows);
      console.log(`   ${await AuditLog.count()} audit logs ✅`);

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅  SEED COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`👤 Users             : ${await User.count()}`);
    console.log(`📦 Products          : ${await Product.count()}`);
    console.log(`📄 Product Versions  : ${await ProductVersion.count()}`);
    console.log(`🗂️  BOMs              : ${await Bom.count()}`);
    console.log(`📄 BOM Versions      : ${await BomVersion.count()}`);
    console.log(`🔩 BOM Components    : ${await BomComponent.count()}`);
    console.log(`⚙️  BOM Operations    : ${await BomOperation.count()}`);
    console.log(`🔧 ECO Stages        : ${await EcoStage.count()}`);
    console.log(`📋 ECOs              : ${await Eco.count()}`);
    console.log(`✅ ECO Approvals     : ${await EcoApproval.count()}`);
    console.log(`📜 Stage History     : ${await EcoStageHistory.count()}`);
    console.log(`📝 Audit Logs        : ${await AuditLog.count()}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔐 Password for all users: password123');
    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
