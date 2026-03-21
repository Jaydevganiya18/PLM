// =============================================================================
// backend-node/seeders/seed.js
// Run: node seeders/seed.js
// Creates ALL tables + seeds demo data for all 4 roles
// =============================================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Product, BoM, ECO, AuditLog } = require('../db');

async function seed() {
  try {
    console.log('\n🔄 Connecting to MySQL...');
    await sequelize.authenticate();
    console.log('✅ MySQL connected\n');

    // force: true → DROP + RECREATE all tables (clean slate)
    console.log('🔄 Syncing all tables (force: true)...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables created:\n');
    console.log('   ✓ users');
    console.log('   ✓ products');
    console.log('   ✓ boms');
    console.log('   ✓ ecos');
    console.log('   ✓ audit_logs\n');

    // ── 1. USERS ─────────────────────────────────────────────────────────────
    console.log('🔄 Seeding users...');
    const password = await bcrypt.hash('password123', 10);

    const [admin, engineering, approver, operations] = await User.bulkCreate([
      {
        name:     'Parth Kachariya Shah',
        email:    'parth@logixwaveai.com',
        password,
        role:     'Admin',
      },
      {
        name:     'Jay Devganiya',
        email:    'jay@logixwaveai.com',
        password,
        role:     'Engineering',
      },
      {
        name:     'Pal Kaswala',
        email:    'pal@logixwaveai.com',
        password,
        role:     'Approver',
      },
      {
        name:     'Yashvi Nakrani',
        email:    'yashvi@logixwaveai.com',
        password,
        role:     'Operations',
      },
    ]);
    console.log('✅ Users seeded (4 users)\n');

    // ── 2. PRODUCTS ───────────────────────────────────────────────────────────
    console.log('🔄 Seeding products...');
    const [woodenTable, iphone, laptop] = await Product.bulkCreate([
      {
        name:       'Wooden Table',
        sale_price: 5000.00,
        cost_price: 3200.00,
        image_url:  null,
        version:    1,
        parent_id:  null,
        is_active:  true,
      },
      {
        name:       'iPhone 17',
        sale_price: 79999.00,
        cost_price: 52000.00,
        image_url:  null,
        version:    1,
        parent_id:  null,
        is_active:  true,
      },
      {
        name:       'Gaming Laptop',
        sale_price: 95000.00,
        cost_price: 68000.00,
        image_url:  null,
        version:    1,
        parent_id:  null,
        is_active:  true,
      },
    ]);
    console.log('✅ Products seeded (3 products)\n');

    // ── 3. BoMs ───────────────────────────────────────────────────────────────
    console.log('🔄 Seeding Bills of Materials...');
    const [tableBoM, iphoneBoM, laptopBoM] = await BoM.bulkCreate([
      {
        product_id: woodenTable.id,
        parent_id:  null,
        version:    1,
        is_active:  true,
        components: [
          { name: 'Wooden Legs',  qty: 4,  unit_cost: 150  },
          { name: 'Wooden Top',   qty: 1,  unit_cost: 800  },
          { name: 'Screws',       qty: 12, unit_cost: 2    },
          { name: 'Varnish',      qty: 1,  unit_cost: 200  },
        ],
        operations: [
          { name: 'Assembly', time: 60, work_center: 'Assembly Line' },
          { name: 'Painting', time: 30, work_center: 'Paint Floor'   },
          { name: 'Packing',  time: 20, work_center: 'Packaging Line'},
        ],
      },
      {
        product_id: iphone.id,
        parent_id:  null,
        version:    1,
        is_active:  true,
        components: [
          { name: 'Display Panel',  qty: 1, unit_cost: 8000  },
          { name: 'Battery',        qty: 1, unit_cost: 2500  },
          { name: 'Processor Chip', qty: 1, unit_cost: 15000 },
          { name: 'Camera Module',  qty: 2, unit_cost: 4000  },
          { name: 'Frame',          qty: 1, unit_cost: 3500  },
        ],
        operations: [
          { name: 'PCB Assembly',  time: 45, work_center: 'Clean Room'   },
          { name: 'Display Fit',   time: 20, work_center: 'Assembly Bay' },
          { name: 'QC Test',       time: 30, work_center: 'QC Station'   },
        ],
      },
      {
        product_id: laptop.id,
        parent_id:  null,
        version:    1,
        is_active:  true,
        components: [
          { name: 'Motherboard',  qty: 1, unit_cost: 18000 },
          { name: 'RAM 16GB',     qty: 2, unit_cost: 3500  },
          { name: 'SSD 512GB',    qty: 1, unit_cost: 6000  },
          { name: 'GPU Module',   qty: 1, unit_cost: 22000 },
          { name: 'LCD Screen',   qty: 1, unit_cost: 9000  },
          { name: 'Battery Pack', qty: 1, unit_cost: 4000  },
        ],
        operations: [
          { name: 'Board Assembly', time: 90,  work_center: 'Tech Bay'     },
          { name: 'Screen Fit',     time: 30,  work_center: 'Assembly Bay' },
          { name: 'Burn-in Test',   time: 120, work_center: 'QC Lab'       },
        ],
      },
    ]);
    console.log('✅ BoMs seeded (3 BoMs)\n');

    // ── 4. ECOs ───────────────────────────────────────────────────────────────
    console.log('🔄 Seeding ECOs...');

    // ECO 1 — New stage, BoM change (Wooden Table screws)
    const eco1 = await ECO.create({
      title:             'Wooden Table — Screw Quantity Optimization',
      type:              'BoM',
      bom_id:            tableBoM.id,
      product_id:        null,
      stage:             'New',
      version_update:    true,
      created_by:        engineering.id,
      approved_by:       null,
      risk_acknowledged: false,
      original_snapshot: tableBoM.toJSON(),
      proposed_changes: {
        components: [
          { name: 'Wooden Legs', qty: 4,  unit_cost: 150 },
          { name: 'Wooden Top',  qty: 1,  unit_cost: 800 },
          { name: 'Screws',      qty: 16, unit_cost: 2   }, // changed 12→16
          { name: 'Varnish',     qty: 1,  unit_cost: 200 },
          { name: 'Metal Bolts', qty: 8,  unit_cost: 5   }, // new component
        ],
        operations: [
          { name: 'Assembly',          time: 60, work_center: 'Assembly Line'  },
          { name: 'Painting',          time: 30, work_center: 'Paint Floor'    },
          { name: 'Quality Inspection',time: 10, work_center: 'QC Station'     }, // new op
          { name: 'Packing',           time: 20, work_center: 'Packaging Line' },
        ],
      },
    });

    // ECO 2 — Approval stage, Product price change (iPhone)
    const eco2 = await ECO.create({
      title:             'iPhone 17 — Cost Price Revision Q1 2026',
      type:              'Product',
      product_id:        iphone.id,
      bom_id:            null,
      stage:             'Approval',
      version_update:    true,
      created_by:        engineering.id,
      approved_by:       null,
      risk_acknowledged: false,
      original_snapshot: iphone.toJSON(),
      proposed_changes: {
        cost_price: 54500.00,  // increased from 52000
        sale_price: 82999.00,  // increased from 79999
      },
    });

    // ECO 3 — Done stage, BoM change (iPhone — already approved)
    const eco3 = await ECO.create({
      title:             'iPhone 17 — Camera Module Upgrade',
      type:              'BoM',
      bom_id:            iphoneBoM.id,
      product_id:        null,
      stage:             'Done',
      version_update:    true,
      created_by:        engineering.id,
      approved_by:       approver.id,
      approved_at:       new Date('2026-03-10T10:00:00Z'),
      risk_acknowledged: false,
      original_snapshot: iphoneBoM.toJSON(),
      proposed_changes: {
        components: [
          { name: 'Display Panel',     qty: 1, unit_cost: 8000  },
          { name: 'Battery',           qty: 1, unit_cost: 2500  },
          { name: 'Processor Chip',    qty: 1, unit_cost: 15000 },
          { name: 'Camera Module Pro', qty: 2, unit_cost: 5500  }, // upgraded
          { name: 'Frame',             qty: 1, unit_cost: 3500  },
        ],
      },
    });

    // ECO 4 — Rejected stage (Gaming Laptop)
    const eco4 = await ECO.create({
      title:             'Gaming Laptop — RAM Downgrade (REJECTED)',
      type:              'BoM',
      bom_id:            laptopBoM.id,
      product_id:        null,
      stage:             'Rejected',
      version_update:    false,
      created_by:        engineering.id,
      approved_by:       approver.id,
      risk_acknowledged: false,
      original_snapshot: laptopBoM.toJSON(),
      proposed_changes: {
        components: [
          { name: 'Motherboard',  qty: 1, unit_cost: 18000 },
          { name: 'RAM 8GB',      qty: 2, unit_cost: 1800  }, // downgraded from 16GB
          { name: 'SSD 512GB',    qty: 1, unit_cost: 6000  },
          { name: 'GPU Module',   qty: 1, unit_cost: 22000 },
          { name: 'LCD Screen',   qty: 1, unit_cost: 9000  },
          { name: 'Battery Pack', qty: 1, unit_cost: 4000  },
        ],
      },
      rejection_reason: 'RAM downgrade will violate product quality standards. Minimum 16GB required for gaming tier.',
    });

    // ECO 5 — Approval stage with risk acknowledged (Wooden Table)
    const eco5 = await ECO.create({
      title:             'Wooden Table — Premium Varnish Upgrade (+85% cost)',
      type:              'BoM',
      bom_id:            tableBoM.id,
      product_id:        null,
      stage:             'Approval',
      version_update:    true,
      created_by:        engineering.id,
      approved_by:       null,
      risk_acknowledged: true,  // engineer acknowledged the AI warning
      risk_acknowledged_at: new Date('2026-03-20T09:00:00Z'),
      original_snapshot: tableBoM.toJSON(),
      proposed_changes: {
        components: [
          { name: 'Wooden Legs',    qty: 4, unit_cost: 150 },
          { name: 'Wooden Top',     qty: 1, unit_cost: 800 },
          { name: 'Screws',         qty: 12, unit_cost: 2  },
          { name: 'Premium Varnish',qty: 2, unit_cost: 750 }, // 200→750, qty 1→2
        ],
      },
    });

    console.log('✅ ECOs seeded (5 ECOs)\n');

    // ── 5. AUDIT LOGS ─────────────────────────────────────────────────────────
    console.log('🔄 Seeding audit logs...');
    await AuditLog.bulkCreate([
      {
        user_id:       engineering.id,
        action:        'ECO_CREATED',
        affected_type: 'BoM',
        affected_id:   tableBoM.id,
        old_value:     null,
        new_value:     eco1.proposed_changes,
        smart_summary: 'Jay Patel (Engineering) created BoM ECO "Wooden Table — Screw Quantity Optimization".',
        timestamp:     new Date('2026-03-19T10:00:00Z'),
      },
      {
        user_id:       engineering.id,
        action:        'ECO_SUBMITTED',
        affected_type: 'Product',
        affected_id:   iphone.id,
        old_value:     { stage: 'New' },
        new_value:     { stage: 'Approval' },
        smart_summary: 'Jay Patel submitted ECO "iPhone 17 — Cost Price Revision Q1 2026" for approval.',
        timestamp:     new Date('2026-03-19T11:30:00Z'),
      },
      {
        user_id:       approver.id,
        action:        'ECO_APPROVED',
        affected_type: 'BoM',
        affected_id:   iphoneBoM.id,
        old_value:     { components: iphoneBoM.components },
        new_value:     eco3.proposed_changes,
        smart_summary: 'Pal Mehta (Approver) approved ECO "iPhone 17 — Camera Module Upgrade", upgrading Camera Module from ₹4000 to ₹5500.',
        timestamp:     new Date('2026-03-10T10:00:00Z'),
      },
      {
        user_id:       approver.id,
        action:        'ECO_REJECTED',
        affected_type: 'BoM',
        affected_id:   laptopBoM.id,
        old_value:     { stage: 'Approval' },
        new_value:     { stage: 'Rejected' },
        smart_summary: 'Pal Mehta rejected ECO "Gaming Laptop — RAM Downgrade" citing quality standards violation.',
        timestamp:     new Date('2026-03-18T14:00:00Z'),
      },
      {
        user_id:       engineering.id,
        action:        'RISK_ACKNOWLEDGED',
        affected_type: 'BoM',
        affected_id:   tableBoM.id,
        old_value:     null,
        new_value:     { risk_acknowledged: true },
        smart_summary: 'Jay Patel acknowledged AI anomaly warning before submitting ECO "Wooden Table — Premium Varnish Upgrade (+85% cost)".',
        timestamp:     new Date('2026-03-20T09:00:00Z'),
      },
    ]);
    console.log('✅ Audit logs seeded (5 entries)\n');

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════');
    console.log('✅ DATABASE SEED COMPLETE — LogixWaveAI PLM');
    console.log('═══════════════════════════════════════════════\n');

    console.log('📋 LOGIN CREDENTIALS (all passwords: password123)\n');
    console.log('   Role          | Name          | Email');
    console.log('   ─────────────────────────────────────────────');
    console.log('   Admin         | Fack Shah     | fack@logixwaveai.com');
    console.log('   Engineering   | Jay Patel     | jay@logixwaveai.com');
    console.log('   Approver      | Pal Mehta     | pal@logixwaveai.com');
    console.log('   Operations    | Yashvi Desai  | yashvi@logixwaveai.com');
    console.log('');
    console.log('📦 SEEDED DATA');
    console.log('   Users    : 4');
    console.log('   Products : 3 (Wooden Table, iPhone 17, Gaming Laptop)');
    console.log('   BoMs     : 3');
    console.log('   ECOs     : 5 (New:1, Approval:2, Done:1, Rejected:1)');
    console.log('   AuditLogs: 5');
    console.log('\n🚀 Start server: npm run dev\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();