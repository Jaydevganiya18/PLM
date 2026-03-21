// =============================================================================
// backend-node/seeders/seed.js
// node seeders/seed.js
// AUTO creates database if not exists → tables → data
// MySQL me manually kuch karne ki zarurat NAHI
// =============================================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql2 = require('mysql2/promise');
const { Sequelize } = require('sequelize');

const DB_NAME = process.env.DB_NAME || 'plm_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;

async function seed() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   PLM LogixWaveAI — Auto Database Seeder');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ── STEP 1: Pehle bina DB name ke connect karo ────────────────────────
    console.log(`🔌 MySQL se connect ho raha hu (${DB_HOST}:${DB_PORT})...`);
    const tempConn = await mysql2.createConnection({
      host:     DB_HOST,
      port:     DB_PORT,
      user:     DB_USER,
      password: DB_PASS,
    });
    console.log('✅ MySQL connected\n');

    // ── STEP 2: Database auto create ─────────────────────────────────────
    console.log(`🗄️  Database "${DB_NAME}" check kar raha hu...`);
    await tempConn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`✅ Database "${DB_NAME}" ready hai\n`);
    await tempConn.end();

    // ── STEP 3: Sequelize connect with DB ────────────────────────────────
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST, port: DB_PORT,
      dialect: 'mysql', logging: false,
    });

    // ── STEP 4: Models ────────────────────────────────────────────────────
    const User     = require('../models/User')(sequelize);
    const Product  = require('../models/Product')(sequelize);
    const BoM      = require('../models/BOM')(sequelize);
    const ECO      = require('../models/ECO')(sequelize);
    const AuditLog = require('../models/AuditLog')(sequelize);

    // Associations
    Product.hasMany(Product,  { foreignKey: 'parent_id',  as: 'childVersions', onDelete: 'SET NULL' });
    Product.belongsTo(Product,{ foreignKey: 'parent_id',  as: 'parentProduct' });
    Product.hasMany(BoM,      { foreignKey: 'product_id', as: 'boms' });
    BoM.belongsTo(Product,    { foreignKey: 'product_id', as: 'product' });
    BoM.hasMany(BoM,          { foreignKey: 'parent_id',  as: 'childVersions', onDelete: 'SET NULL' });
    BoM.belongsTo(BoM,        { foreignKey: 'parent_id',  as: 'parentBoM' });
    User.hasMany(ECO,         { foreignKey: 'created_by', as: 'createdECOs' });
    ECO.belongsTo(User,       { foreignKey: 'created_by', as: 'creator' });
    User.hasMany(ECO,         { foreignKey: 'approved_by',as: 'approvedECOs' });
    ECO.belongsTo(User,       { foreignKey: 'approved_by',as: 'approver' });
    ECO.belongsTo(Product,    { foreignKey: 'product_id', as: 'product' });
    ECO.belongsTo(BoM,        { foreignKey: 'bom_id',     as: 'bom' });
    User.hasMany(AuditLog,    { foreignKey: 'user_id',    as: 'auditLogs' });
    AuditLog.belongsTo(User,  { foreignKey: 'user_id',    as: 'user' });

    // ── STEP 5: Tables create karo ────────────────────────────────────────
    console.log('📋 Tables create kar raha hu...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables created:');
    console.log('   ✓ users');
    console.log('   ✓ products');
    console.log('   ✓ boms');
    console.log('   ✓ ecos');
    console.log('   ✓ audit_logs\n');

    // ── STEP 6: Users ─────────────────────────────────────────────────────
    console.log('👤 Users seed kar raha hu...');
    const hash = await bcrypt.hash('password123', 10);
    const [fack, jay, pal, yashvi] = await User.bulkCreate([
      { name: 'Parth Kachariya', email: 'parth@logixwaveai.com', password: hash, role: 'Admin'       }, // TODO: Change password to 'password123' before commit Shah',    email: 'fack@logixwaveai.com',   password: hash, role: 'Admin'       },
      { name: 'Jay Devganiya',    email: 'jay@logixwaveai.com',    password: hash, role: 'Engineering' },
      { name: 'Pal Kaswala',    email: 'pal@logixwaveai.com',    password: hash, role: 'Approver'    },
      { name: 'Yashvi Nakrani', email: 'yashvi@logixwaveai.com', password: hash, role: 'Operations'  },
    ]);
    console.log('✅ 4 users seeded\n');

    // ── STEP 7: Products ──────────────────────────────────────────────────
    console.log('📦 Products seed kar raha hu...');
    const [woodenTable, iphone, laptop] = await Product.bulkCreate([
      { name: 'Wooden Table',  sale_price: 5000.00,  cost_price: 3200.00,  version: 1, parent_id: null, is_active: true },
      { name: 'iPhone 17',     sale_price: 79999.00, cost_price: 52000.00, version: 1, parent_id: null, is_active: true },
      { name: 'Gaming Laptop', sale_price: 95000.00, cost_price: 68000.00, version: 1, parent_id: null, is_active: true },
    ]);
    console.log('✅ 3 products seeded\n');

    // ── STEP 8: BoMs ──────────────────────────────────────────────────────
    console.log('📋 BoMs seed kar raha hu...');
    const [tableBoM, iphoneBoM, laptopBoM] = await BoM.bulkCreate([
      {
        product_id: woodenTable.id, parent_id: null, version: 1, is_active: true,
        components: [
          { name: 'Wooden Legs', qty: 4,  unit_cost: 150 },
          { name: 'Wooden Top',  qty: 1,  unit_cost: 800 },
          { name: 'Screws',      qty: 12, unit_cost: 2   },
          { name: 'Varnish',     qty: 1,  unit_cost: 200 },
        ],
        operations: [
          { name: 'Assembly', time: 60, work_center: 'Assembly Line'  },
          { name: 'Painting', time: 30, work_center: 'Paint Floor'    },
          { name: 'Packing',  time: 20, work_center: 'Packaging Line' },
        ],
      },
      {
        product_id: iphone.id, parent_id: null, version: 1, is_active: true,
        components: [
          { name: 'Display Panel',  qty: 1, unit_cost: 8000  },
          { name: 'Battery',        qty: 1, unit_cost: 2500  },
          { name: 'Processor Chip', qty: 1, unit_cost: 15000 },
          { name: 'Camera Module',  qty: 2, unit_cost: 4000  },
          { name: 'Frame',          qty: 1, unit_cost: 3500  },
        ],
        operations: [
          { name: 'PCB Assembly', time: 45, work_center: 'Clean Room'   },
          { name: 'Display Fit',  time: 20, work_center: 'Assembly Bay' },
          { name: 'QC Test',      time: 30, work_center: 'QC Station'   },
        ],
      },
      {
        product_id: laptop.id, parent_id: null, version: 1, is_active: true,
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
    console.log('✅ 3 BoMs seeded\n');

    // ── STEP 9: ECOs ──────────────────────────────────────────────────────
    console.log('📝 ECOs seed kar raha hu...');
    await ECO.bulkCreate([
      {
        title: 'Wooden Table — Screw Quantity Optimization',
        type: 'BoM', bom_id: tableBoM.id, product_id: null,
        stage: 'New', version_update: true, created_by: jay.id,
        risk_acknowledged: false,
        original_snapshot: JSON.parse(JSON.stringify(tableBoM.toJSON())),
        proposed_changes: {
          components: [
            { name: 'Wooden Legs', qty: 4,  unit_cost: 150 },
            { name: 'Wooden Top',  qty: 1,  unit_cost: 800 },
            { name: 'Screws',      qty: 16, unit_cost: 2   },
            { name: 'Varnish',     qty: 1,  unit_cost: 200 },
            { name: 'Metal Bolts', qty: 8,  unit_cost: 5   },
          ],
          operations: [
            { name: 'Assembly',           time: 60, work_center: 'Assembly Line'  },
            { name: 'Painting',           time: 30, work_center: 'Paint Floor'    },
            { name: 'Quality Inspection', time: 10, work_center: 'QC Station'     },
            { name: 'Packing',            time: 20, work_center: 'Packaging Line' },
          ],
        },
      },
      {
        title: 'iPhone 17 — Cost Price Revision Q1 2026',
        type: 'Product', product_id: iphone.id, bom_id: null,
        stage: 'Approval', version_update: true, created_by: jay.id,
        risk_acknowledged: false,
        original_snapshot: JSON.parse(JSON.stringify(iphone.toJSON())),
        proposed_changes: { cost_price: 54500.00, sale_price: 82999.00 },
      },
      {
        title: 'iPhone 17 — Camera Module Pro Upgrade',
        type: 'BoM', bom_id: iphoneBoM.id, product_id: null,
        stage: 'Done', version_update: true,
        created_by: jay.id, approved_by: pal.id,
        approved_at: new Date('2026-03-10T10:00:00Z'),
        risk_acknowledged: false,
        original_snapshot: JSON.parse(JSON.stringify(iphoneBoM.toJSON())),
        proposed_changes: {
          components: [
            { name: 'Display Panel',     qty: 1, unit_cost: 8000  },
            { name: 'Battery',           qty: 1, unit_cost: 2500  },
            { name: 'Processor Chip',    qty: 1, unit_cost: 15000 },
            { name: 'Camera Module Pro', qty: 2, unit_cost: 5500  },
            { name: 'Frame',             qty: 1, unit_cost: 3500  },
          ],
        },
      },
      {
        title: 'Gaming Laptop — RAM Downgrade to 8GB',
        type: 'BoM', bom_id: laptopBoM.id, product_id: null,
        stage: 'Rejected', version_update: false,
        created_by: jay.id, approved_by: pal.id,
        approved_at: new Date('2026-03-18T14:00:00Z'),
        risk_acknowledged: false,
        rejection_reason: 'RAM downgrade violates gaming tier quality standards. Minimum 16GB DDR5 required.',
        original_snapshot: JSON.parse(JSON.stringify(laptopBoM.toJSON())),
        proposed_changes: {
          components: [
            { name: 'Motherboard',  qty: 1, unit_cost: 18000 },
            { name: 'RAM 8GB',      qty: 2, unit_cost: 1800  },
            { name: 'SSD 512GB',    qty: 1, unit_cost: 6000  },
            { name: 'GPU Module',   qty: 1, unit_cost: 22000 },
            { name: 'LCD Screen',   qty: 1, unit_cost: 9000  },
            { name: 'Battery Pack', qty: 1, unit_cost: 4000  },
          ],
        },
      },
      {
        title: 'Wooden Table — Premium Varnish Upgrade',
        type: 'BoM', bom_id: tableBoM.id, product_id: null,
        stage: 'Approval', version_update: true, created_by: jay.id,
        risk_acknowledged: true,
        risk_acknowledged_at: new Date('2026-03-20T09:00:00Z'),
        original_snapshot: JSON.parse(JSON.stringify(tableBoM.toJSON())),
        proposed_changes: {
          components: [
            { name: 'Wooden Legs',    qty: 4,  unit_cost: 150 },
            { name: 'Wooden Top',     qty: 1,  unit_cost: 800 },
            { name: 'Screws',         qty: 12, unit_cost: 2   },
            { name: 'Premium Varnish',qty: 2,  unit_cost: 750 },
          ],
        },
      },
    ]);
    console.log('✅ 5 ECOs seeded\n');

    // ── STEP 10: Audit Logs ───────────────────────────────────────────────
    console.log('📋 Audit logs seed kar raha hu...');
    await AuditLog.bulkCreate([
      {
        user_id: jay.id, action: 'ECO_CREATED',
        affected_type: 'BoM', affected_id: tableBoM.id,
        smart_summary: 'Jay Patel created BoM ECO "Wooden Table — Screw Quantity Optimization".',
        timestamp: new Date('2026-03-19T10:00:00Z'),
      },
      {
        user_id: jay.id, action: 'ECO_SUBMITTED',
        affected_type: 'Product', affected_id: iphone.id,
        old_value: { stage: 'New' }, new_value: { stage: 'Approval' },
        smart_summary: 'Jay Patel submitted ECO "iPhone 17 — Cost Price Revision Q1 2026" for approval.',
        timestamp: new Date('2026-03-19T11:30:00Z'),
      },
      {
        user_id: pal.id, action: 'ECO_APPROVED',
        affected_type: 'BoM', affected_id: iphoneBoM.id,
        smart_summary: 'Pal Mehta approved ECO "iPhone 17 — Camera Module Pro Upgrade".',
        timestamp: new Date('2026-03-10T10:00:00Z'),
      },
      {
        user_id: pal.id, action: 'ECO_REJECTED',
        affected_type: 'BoM', affected_id: laptopBoM.id,
        old_value: { stage: 'Approval' }, new_value: { stage: 'Rejected' },
        smart_summary: 'Pal Mehta rejected ECO "Gaming Laptop — RAM Downgrade to 8GB".',
        timestamp: new Date('2026-03-18T14:00:00Z'),
      },
      {
        user_id: jay.id, action: 'RISK_ACKNOWLEDGED',
        affected_type: 'BoM', affected_id: tableBoM.id,
        new_value: { risk_acknowledged: true },
        smart_summary: 'Jay Patel acknowledged AI anomaly warning before submitting ECO "Wooden Table — Premium Varnish Upgrade".',
        timestamp: new Date('2026-03-20T09:00:00Z'),
      },
    ]);
    console.log('✅ 5 audit logs seeded\n');

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  COMPLETE — Database aur Data dono ready hain!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔑 LOGIN CREDENTIALS  (sab ka password: password123)\n');
    console.log('   Role          Name            Email');
    console.log('   ──────────────────────────────────────────────────');
    console.log('   Admin         Fack Shah       fack@logixwaveai.com');
    console.log('   Engineering   Jay Patel       jay@logixwaveai.com');
    console.log('   Approver      Pal Mehta       pal@logixwaveai.com');
    console.log('   Operations    Yashvi Desai    yashvi@logixwaveai.com\n');
    console.log('📊 SEEDED: Users:4 | Products:3 | BoMs:3 | ECOs:5 | Logs:5\n');
    console.log('🚀 Ab server start karo: npm run dev\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.original) console.error('   MySQL error:', err.original.sqlMessage);
    console.error('\n💡 Check karo:');
    console.error('   1. MySQL server chal raha hai?');
    console.error('   2. .env mein DB_USER aur DB_PASS sahi hai?');
    process.exit(1);
  }
}

seed();