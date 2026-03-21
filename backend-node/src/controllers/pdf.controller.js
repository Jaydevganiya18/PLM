const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');

// ─── Layout helpers ────────────────────────────────────────────────────────
const L = 50;   // left margin
const R = 545;  // right edge
const W = R - L; // usable width

function drawHeader(doc, eco) {
  doc.rect(0, 0, doc.page.width, 72).fill('#1e3a8a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('PLM / ECO Management System', L, 14, { width: W });
  doc.font('Helvetica').fontSize(10).text('Engineering Change Order Report', L, 38, { width: W });
  doc.font('Helvetica-Bold').fontSize(13).text(eco.eco_number, 0, 14, { align: 'right', width: R });
  doc.font('Helvetica').fontSize(9).text(new Date().toLocaleString('en-IN'), 0, 34, { align: 'right', width: R });
  return 90;
}

function drawSectionTitle(doc, title, y, primary = false) {
  if (primary) {
    doc.rect(L, y, W, 26).fill('#1e3a8a').strokeColor('#1e3a8a').lineWidth(1).stroke();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text(title, L + 10, y + 7, { width: W - 20 });
    return y + 36;
  }
  doc.rect(L, y, W, 22).fill('#eff6ff');
  doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(11).text(title, L + 8, y + 6, { width: W - 16 });
  return y + 30;
}

function drawKeyValue(doc, label, value, y, shade) {
  if (shade) doc.rect(L, y, W, 20).fill('#f9fafb');
  doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8.5).text(label.toUpperCase(), L + 8, y + 5, { width: 140 });
  doc.fillColor('#111827').font('Helvetica').fontSize(9).text(String(value ?? '-'), L + 155, y + 5, { width: W - 163 });
  return y + 20;
}

function drawTableHeader(doc, columns, y) {
  doc.rect(L, y, W, 22).fill('#334155');
  let x = L;
  columns.forEach(col => {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(col.label, x + 4, y + 7, { width: col.w - 8, align: col.align || 'left' });
    x += col.w;
  });
  return y + 22;
}

function drawTableRow(doc, columns, values, y, highlight, shade) {
  const rowH = 20;
  const bg = highlight ? '#fef9c3' : shade ? '#f9fafb' : '#ffffff';
  doc.rect(L, y, W, rowH).fill(bg);
  let x = L;
  columns.forEach((col, i) => {
    const val = values[i] ?? { text: '-', color: '#374151' };
    doc.fillColor(val.color || '#374151').font(val.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).text(String(val.text ?? '-'), x + 4, y + 5, { width: col.w - 8, align: col.align || 'left' });
    x += col.w;
  });
  return y + rowH;
}

function checkPage(doc, y, needed = 50) {
  if (y + needed > doc.page.height - 60) {
    doc.addPage();
    return 40;
  }
  return y;
}

// ─── Main Reports Generator ───────────────────────────────────────────────
const generateUnifiedReportPdf = async (req, res, next) => {
  try {
    const [ecos, productHistory, bomHistory, archivedProducts, activeMatrix] = await Promise.all([
      prisma.eco.findMany({ include: { product: true, current_stage: true, requester: true }, orderBy: { created_at: 'desc' } }),
      prisma.productVersion.findMany({ include: { product: true, created_via_eco: true }, orderBy: [{ product_id: 'asc' }, { version_no: 'asc' }] }),
      prisma.bomVersion.findMany({ include: { bom: { include: { product: true } }, created_via_eco: true, _count: { select: { components: true, operations: true } } }, orderBy: [{ bom_id: 'asc' }, { version_no: 'asc' }] }),
      prisma.product.findMany({ where: { status: 'ARCHIVED' }, include: { current_version: true }, orderBy: { archived_at: 'desc' } }),
      prisma.product.findMany({ where: { status: 'ACTIVE' }, include: { current_version: true, boms: { where: { status: 'ACTIVE' }, include: { current_version: true } } } }),
    ]);

    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Full-System-Report-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Cover Page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1e3a8a');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(30).text('PLM / ECO System', 50, 250, { width: 500, align: 'center' });
    doc.fontSize(18).text('Consolidated Master Report', 50, 300, { width: 500, align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, 350, { width: 500, align: 'center' });
    doc.addPage();

    let y = 50;

    // 1. ECO Report
    y = drawSectionTitle(doc, '1. Change Orders (ECO) Summary', y, true);
    const ecoCols = [{ label: 'ECO #', w: 80 }, { label: 'Title', w: 140 }, { label: 'Type', w: 50 }, { label: 'Product', w: 75 }, { label: 'Stage', w: 80 }, { label: 'Status', w: 70 }];
    y = drawTableHeader(doc, ecoCols, y);
    ecos.forEach((e, i) => {
      y = checkPage(doc, y, 22);
      y = drawTableRow(doc, ecoCols, [{ text: e.eco_number, color: '#1d4ed8' }, { text: e.title }, { text: e.eco_type }, { text: e.product?.product_code || '-' }, { text: e.current_stage?.name || 'Start' }, { text: e.status, bold: true }], y, false, i % 2 === 0);
    });
    y += 30;

    // 2. Product Version History
    y = checkPage(doc, y, 100);
    y = drawSectionTitle(doc, '2. Product Version History', y, true);
    const prodCols = [{ label: 'Product Code', w: 100 }, { label: 'Ver', w: 40 }, { label: 'Name', w: 140 }, { label: 'Sale Price', w: 75, align: 'right' }, { label: 'Cost Price', w: 75, align: 'right' }, { label: 'Status', w: 65 }];
    y = drawTableHeader(doc, prodCols, y);
    productHistory.forEach((v, i) => {
      y = checkPage(doc, y, 22);
      y = drawTableRow(doc, prodCols, [{ text: v.product?.product_code }, { text: `v${v.version_no}`, bold: true }, { text: v.name }, { text: `$${Number(v.sale_price).toFixed(2)}`, align: 'right' }, { text: `$${Number(v.cost_price).toFixed(2)}`, align: 'right' }, { text: v.status, bold: true }], y, false, i % 2 === 0);
    });
    y += 30;

    // 3. BoM Change History
    y = checkPage(doc, y, 100);
    y = drawSectionTitle(doc, '3. BoM Change History', y, true);
    const bomCols = [{ label: 'BoM Code', w: 100 }, { label: 'Ver', w: 40 }, { label: 'Product', w: 90 }, { label: 'Status', w: 70 }, { label: 'Comps', w: 60, align: 'right' }, { label: 'Ops', w: 60, align: 'right' }, { label: 'Via ECO', w: 75 }];
    y = drawTableHeader(doc, bomCols, y);
    bomHistory.forEach((v, i) => {
      y = checkPage(doc, y, 22);
      y = drawTableRow(doc, bomCols, [{ text: v.bom?.bom_code }, { text: `v${v.version_no}`, bold: true }, { text: v.bom?.product?.product_code }, { text: v.status, bold: true }, { text: v._count.components, align: 'right' }, { text: v._count.operations, align: 'right' }, { text: v.created_via_eco?.eco_number || '-' }], y, false, i % 2 === 0);
    });
    y += 30;

    // 4. Archived Products
    y = checkPage(doc, y, 100);
    y = drawSectionTitle(doc, '4. Archived Products (EoL)', y, true);
    const archCols = [{ label: 'Product Code', w: 150 }, { label: 'Name', w: 200 }, { label: 'Archived At', w: 145 }];
    y = drawTableHeader(doc, archCols, y);
    archivedProducts.forEach((p, i) => {
      y = checkPage(doc, y, 22);
      y = drawTableRow(doc, archCols, [{ text: p.product_code }, { text: p.current_version?.name || '-' }, { text: p.archived_at ? new Date(p.archived_at).toLocaleDateString() : '-' }], y, false, i % 2 === 0);
    });
    y += 30;

    // 5. Active Matrix
    y = checkPage(doc, y, 100);
    y = drawSectionTitle(doc, '5. Active Product-BoM Matrix', y, true);
    const matCols = [{ label: 'Product Code', w: 120 }, { label: 'Active Version', w: 80 }, { label: 'Active BoM(s)', w: 295 }];
    y = drawTableHeader(doc, matCols, y);
    activeMatrix.forEach((p, i) => {
      y = checkPage(doc, y, 22);
      const boms = p.boms.map(b => `${b.bom_code} v${b.current_version?.version_no}`).join(', ') || '-';
      y = drawTableRow(doc, matCols, [{ text: p.product_code }, { text: `v${p.current_version?.version_no}`, bold: true }, { text: boms }], y, false, i % 2 === 0);
    });

    // Final Footer
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const ph = doc.page.height;
      doc.rect(0, ph - 30, doc.page.width, 30).fill('#f1f5f9');
      doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(`PLM System Master Report • Generated: ${new Date().toLocaleDateString()} • Page ${i + 1} of ${range.count}`, 0, ph - 20, { align: 'center', width: doc.page.width });
    }

    doc.end();
  } catch (err) { next(err); }
};

// Existing ECO PDF function
const generateEcoPdf = async (req, res, next) => {
  try {
    const eco = await prisma.eco.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        product: true,
        bom: true,
        current_stage: true,
        requester: true,
        approvals: { include: { approver: true, stage: true } },
        stage_history: { include: { from_stage: true, to_stage: true, actor: true } },
      },
    });
    if (!eco) return res.status(404).json({ success: false, message: 'ECO not found' });

    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ECO-${eco.eco_number}.pdf"`);
    doc.pipe(res);

    let y = drawHeader(doc, eco);

    // Status badges
    doc.roundedRect(L, y, 80, 18, 4).fill(eco.status === 'APPLIED' ? '#16a34a' : '#2563eb');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8.5).text(eco.status, L, y + 4, { width: 80, align: 'center' });
    y += 30;

    y = drawSectionTitle(doc, 'ECO Details', y);
    const details = [
      ['Title', eco.title],
      ['Type', eco.eco_type],
      ['Product', eco.product?.product_code],
      ['Requester', eco.requester?.name],
      ['Effective Date', eco.effective_date ? new Date(eco.effective_date).toLocaleDateString() : '-'],
    ];
    details.forEach((d, i) => y = drawKeyValue(doc, d[0], d[1], y, i % 2 === 0));
    y += 20;

    // Diff
    y = drawSectionTitle(doc, 'Proposed Changes (Diff)', y);
    const original = eco.original_snapshot || {};
    const proposed = eco.proposed_changes || {};
    const diffCols = [{ label: 'Field', w: 150 }, { label: 'Original', w: 170 }, { label: 'Proposed', w: 175 }];
    y = drawTableHeader(doc, diffCols, y);

    if (eco.eco_type === 'PRODUCT') {
      ['name', 'sale_price', 'cost_price'].forEach((f, i) => {
        const changed = String(original[f]) !== String(proposed[f]);
        y = drawTableRow(doc, diffCols, [{ text: f.toUpperCase() }, { text: original[f], color: changed ? '#dc2626' : '#374151' }, { text: proposed[f], color: changed ? '#16a34a' : '#374151', bold: changed }], y, changed, i % 2 === 0);
      });
    }

    // History and Approvals simplified for space...
    y = checkPage(doc, y, 60);
    y = drawSectionTitle(doc, 'Approval History', y);
    const appCols = [{ label: 'Action', w: 100 }, { label: 'User', w: 150 }, { label: 'Comment', w: 150 }, { label: 'Date', w: 95 }];
    y = drawTableHeader(doc, appCols, y);
    eco.approvals.forEach((a, i) => {
      y = checkPage(doc, y, 22);
      y = drawTableRow(doc, appCols, [{ text: a.action, bold: true }, { text: a.approver?.name }, { text: a.comment || '-' }, { text: new Date(a.created_at).toLocaleDateString() }], y, false, i % 2 === 0);
    });

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        const ph = doc.page.height;
        doc.rect(0, ph - 30, doc.page.width, 30).fill('#f1f5f9');
        doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(`ECO Report: ${eco.eco_number} • Page ${i + 1} of ${range.count}`, 0, ph - 20, { align: 'center', width: doc.page.width });
    }

    doc.end();
  } catch (err) { next(err); }
};

module.exports = { generateEcoPdf, generateUnifiedReportPdf };
