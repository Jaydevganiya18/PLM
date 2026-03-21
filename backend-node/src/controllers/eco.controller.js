const prisma = require('../lib/prisma');
const { captureSnapshot, applyEcoChanges } = require('../services/eco.service');

const getAllEcos = async (req, res, next) => {
  try {
    const ecos = await prisma.eco.findMany({
      include: {
        product: { select: { product_code: true } },
        bom: { select: { bom_code: true } },
        current_stage: true,
        requester: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: ecos });
  } catch (err) {
    next(err);
  }
};

const getEcoById = async (req, res, next) => {
  try {
    const eco = await prisma.eco.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        product: true, bom: true, current_stage: true, requester: true,
        approvals: { include: { approver: true } },
        stage_history: { include: { from_stage: true, to_stage: true, actor: true } }
      }
    });
    if (!eco) return res.status(404).json({ success: false, message: 'ECO not found' });
    res.json({ success: true, data: eco });
  } catch (err) {
    next(err);
  }
};

const createEcoDraft = async (req, res, next) => {
  try {
    const { eco_number, title, eco_type, product_id, bom_id, version_update } = req.body;
    
    const existing = await prisma.eco.findUnique({ where: { eco_number } });
    if (existing) return res.status(400).json({ success: false, message: 'ECO number already exists' });

    // Capture snapshot
    const snapshot = await captureSnapshot(eco_type, parseInt(product_id), bom_id ? parseInt(bom_id) : null);
    
    // Set proposed to snapshot initially
    const proposed = JSON.parse(JSON.stringify(snapshot));

    const eco = await prisma.eco.create({
      data: {
        eco_number, title, eco_type,
        product_id: parseInt(product_id),
        bom_id: bom_id ? parseInt(bom_id) : null,
        source_product_version_id: eco_type === 'PRODUCT' ? snapshot.id : null,
        source_bom_version_id: eco_type === 'BOM' ? snapshot.id : null,
        original_snapshot: snapshot,
        proposed_changes: proposed,
        version_update: version_update ?? true,
        requested_by: req.user.userId,
        status: 'DRAFT'
      }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId, action: 'CREATE_ECO_DRAFT', affected_type: 'ECO', affected_id: eco.id, eco_id: eco.id,
        smart_summary: `Created ECO Draft ${eco_number}`
      }
    });

    res.status(201).json({ success: true, data: eco });
  } catch (err) {
    next(err);
  }
};

const updateEcoDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proposed_changes, version_update, effective_date } = req.body;

    const eco = await prisma.eco.findUnique({ where: { id: parseInt(id) } });
    if (eco.status !== 'DRAFT' && eco.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Can only edit DRAFT or REJECTED ECOs' });
    }

    const updated = await prisma.eco.update({
      where: { id: eco.id },
      data: { proposed_changes, version_update, effective_date }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const startEco = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eco = await prisma.eco.findUnique({ where: { id: parseInt(id) } });
    
    if (eco.status !== 'DRAFT' && eco.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Only DRAFT or REJECTED ECOs can be started' });
    }

    const startStage = await prisma.ecoStage.findFirst({ where: { is_start_stage: true, is_active: true } });
    if (!startStage) return res.status(400).json({ success: false, message: 'No start stage configured' });

    const updated = await prisma.eco.update({
      where: { id: eco.id },
      data: { 
        status: 'IN_PROGRESS', 
        current_stage_id: startStage.id,
        started_at: new Date()
      }
    });

    await prisma.ecoStageHistory.create({
      data: { eco_id: eco.id, to_stage_id: startStage.id, action: 'STARTED', acted_by: req.user.userId }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const validateEco = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eco = await prisma.eco.findUnique({ where: { id: parseInt(id) }, include: { current_stage: true } });
    
    if (eco.status !== 'IN_PROGRESS') return res.status(400).json({ success: false, message: 'ECO is not in progress' });
    if (eco.current_stage.approval_required) return res.status(400).json({ success: false, message: 'Stage requires approval, cannot just validate' });

    // Move to next stage
    const nextStage = await prisma.ecoStage.findFirst({
      where: { sequence_no: { gt: eco.current_stage.sequence_no }, is_active: true },
      orderBy: { sequence_no: 'asc' }
    });

    let newStatus = 'IN_PROGRESS';
    let appliedAt = null;

    if (!nextStage) {
      newStatus = 'APPLIED';
      appliedAt = new Date();
    }

    const updated = await prisma.eco.update({
      where: { id: eco.id },
      data: { current_stage_id: nextStage ? nextStage.id : eco.current_stage_id, status: newStatus, applied_at: appliedAt }
    });

    await prisma.ecoStageHistory.create({
      data: { eco_id: eco.id, from_stage_id: eco.current_stage_id, to_stage_id: nextStage?.id, action: 'VALIDATED', acted_by: req.user.userId }
    });

    if (newStatus === 'APPLIED') {
      await applyEcoChanges(eco.id, req.user.userId);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const approveEco = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const eco = await prisma.eco.findUnique({ where: { id: parseInt(id) }, include: { current_stage: true } });
    
    if (eco.status !== 'IN_PROGRESS') return res.status(400).json({ success: false, message: 'ECO is not in progress' });
    if (!eco.current_stage.approval_required) return res.status(400).json({ success: false, message: 'Stage does not require approval' });

    // Record approval
    await prisma.ecoApproval.create({
      data: { eco_id: eco.id, stage_id: eco.current_stage_id, approver_id: req.user.userId, action: 'APPROVED', comment }
    });

    // Check if min approvals met
    const rules = await prisma.approvalRule.findMany({ where: { stage_id: eco.current_stage_id, is_active: true } });
    const approvals = await prisma.ecoApproval.findMany({ where: { eco_id: eco.id, stage_id: eco.current_stage_id, action: 'APPROVED' } });

    // Simple check: if we have required approvals, move stage
    const requiredApprovals = rules.reduce((acc, r) => acc + r.min_approvals, 0);

    if (approvals.length >= (requiredApprovals || 1)) {
      const nextStage = await prisma.ecoStage.findFirst({
        where: { sequence_no: { gt: eco.current_stage.sequence_no }, is_active: true },
        orderBy: { sequence_no: 'asc' }
      });

      let newStatus = 'IN_PROGRESS';
      if (!nextStage) newStatus = 'APPLIED';

      await prisma.eco.update({
        where: { id: eco.id },
        data: { current_stage_id: nextStage ? nextStage.id : eco.current_stage_id, status: newStatus, approved_at: new Date() }
      });

      await prisma.ecoStageHistory.create({
        data: { eco_id: eco.id, from_stage_id: eco.current_stage_id, to_stage_id: nextStage?.id, action: 'STAGE_APPROVED', acted_by: req.user.userId }
      });

      if (newStatus === 'APPLIED') {
        await applyEcoChanges(eco.id, req.user.userId);
      }
    }

    res.json({ success: true, message: 'Approval recorded' });
  } catch (err) {
    next(err);
  }
};

const rejectEco = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const eco = await prisma.eco.findUnique({ where: { id: parseInt(id) } });

    await prisma.ecoApproval.create({
      data: { eco_id: eco.id, stage_id: eco.current_stage_id, approver_id: req.user.userId, action: 'REJECTED', comment: reason }
    });

    const updated = await prisma.eco.update({
      where: { id: eco.id },
      data: { status: 'REJECTED', rejection_reason: reason }
    });

    await prisma.ecoStageHistory.create({
      data: { eco_id: eco.id, from_stage_id: eco.current_stage_id, to_stage_id: null, action: 'REJECTED', acted_by: req.user.userId, comment: reason }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllEcos, getEcoById, createEcoDraft, updateEcoDraft, startEco, validateEco, approveEco, rejectEco
};
