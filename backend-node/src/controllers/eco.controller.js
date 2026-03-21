const {
  Eco, Product, ProductVersion, Bom, BomVersion, BomComponent, BomOperation,
  EcoStage, User, AuditLog,
} = require('../lib/prisma');

const getAllEcos = async (req, res, next) => {
  try {
    const ecos = await Eco.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['product_code'] },
        { model: Bom, as: 'bom', attributes: ['bom_code'] },
        { model: EcoStage, as: 'current_stage' },
        { model: User, as: 'requester', attributes: ['name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: ecos });
  } catch (err) {
    next(err);
  }
};

const getEcoById = async (req, res, next) => {
  try {
    const eco = await Eco.findOne({
      where: { id: parseInt(req.params.id) },
      include: [
        { model: Product, as: 'product' },
        { model: Bom, as: 'bom' },
        { model: EcoStage, as: 'current_stage' },
        { model: User, as: 'requester' },
        {
          model: require('../lib/prisma').EcoApproval,
          as: 'approvals',
          include: [{ model: User, as: 'approver' }],
        },
        {
          model: require('../lib/prisma').EcoStageHistory,
          as: 'stage_history',
          include: [
            { model: EcoStage, as: 'from_stage' },
            { model: EcoStage, as: 'to_stage' },
            { model: User, as: 'actor' },
          ],
        },
      ],
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

    const existing = await Eco.findOne({ where: { eco_number } });
    if (existing) return res.status(400).json({ success: false, message: 'ECO number already exists' });

    const { captureSnapshot } = require('../services/eco.service');
    const snapshot = await captureSnapshot(eco_type, parseInt(product_id), bom_id ? parseInt(bom_id) : null);
    const proposed = JSON.parse(JSON.stringify(snapshot));

    const eco = await Eco.create({
      eco_number, title, eco_type,
      product_id: parseInt(product_id),
      bom_id: bom_id ? parseInt(bom_id) : null,
      source_product_version_id: eco_type === 'PRODUCT' ? snapshot.id : null,
      source_bom_version_id: eco_type === 'BOM' ? snapshot.id : null,
      original_snapshot: snapshot,
      proposed_changes: proposed,
      version_update: version_update ?? true,
      requested_by: req.user.userId,
      status: 'DRAFT',
    });

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'CREATE_ECO_DRAFT',
      affected_type: 'ECO',
      affected_id: eco.id,
      eco_id: eco.id,
      smart_summary: `Created ECO Draft ${eco_number}`,
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

    const eco = await Eco.findOne({ where: { id: parseInt(id) } });
    if (!eco) return res.status(404).json({ success: false, message: 'ECO not found' });
    if (eco.status !== 'DRAFT' && eco.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Can only edit DRAFT or REJECTED ECOs' });
    }

    await eco.update({ proposed_changes, version_update, effective_date });
    res.json({ success: true, data: eco });
  } catch (err) {
    next(err);
  }
};

const startEco = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eco = await Eco.findOne({ where: { id: parseInt(id) } });
    if (!eco) return res.status(404).json({ success: false, message: 'ECO not found' });

    if (eco.status !== 'DRAFT' && eco.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Only DRAFT or REJECTED ECOs can be started' });
    }

    const startStage = await EcoStage.findOne({ where: { is_start_stage: true, is_active: true } });
    if (!startStage) return res.status(400).json({ success: false, message: 'No start stage configured' });

    await eco.update({ status: 'IN_PROGRESS', current_stage_id: startStage.id, started_at: new Date() });

    await require('../lib/prisma').EcoStageHistory.create({
      eco_id: eco.id,
      to_stage_id: startStage.id,
      action: 'STARTED',
      acted_by: req.user.userId,
    });

    res.json({ success: true, data: eco });
  } catch (err) {
    next(err);
  }
};

const validateEco = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eco = await Eco.findOne({
      where: { id: parseInt(id) },
      include: [{ model: EcoStage, as: 'current_stage' }],
    });
    if (!eco) return res.status(404).json({ success: false, message: 'ECO not found' });

    if (eco.status !== 'IN_PROGRESS') return res.status(400).json({ success: false, message: 'ECO is not in progress' });
    if (eco.current_stage.approval_required) return res.status(400).json({ success: false, message: 'Stage requires approval, cannot just validate' });

    const { Op } = require('sequelize');
    const nextStage = await EcoStage.findOne({
      where: { sequence_no: { [Op.gt]: eco.current_stage.sequence_no }, is_active: true },
      order: [['sequence_no', 'ASC']],
    });

    let newStatus = 'IN_PROGRESS';
    let appliedAt = null;
    if (!nextStage) { newStatus = 'APPLIED'; appliedAt = new Date(); }

    await eco.update({
      current_stage_id: nextStage ? nextStage.id : eco.current_stage_id,
      status: newStatus,
      applied_at: appliedAt,
    });

    await require('../lib/prisma').EcoStageHistory.create({
      eco_id: eco.id,
      from_stage_id: eco.current_stage_id,
      to_stage_id: nextStage ? nextStage.id : null,
      action: 'VALIDATED',
      acted_by: req.user.userId,
    });

    if (newStatus === 'APPLIED') {
      const { applyEcoChanges } = require('../services/eco.service');
      await applyEcoChanges(eco.id, req.user.userId);
    }

    res.json({ success: true, data: eco });
  } catch (err) {
    next(err);
  }
};

const approveEco = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const { EcoApproval, EcoStageHistory, ApprovalRule } = require('../lib/prisma');
    const { Op } = require('sequelize');

    const eco = await Eco.findOne({
      where: { id: parseInt(id) },
      include: [{ model: EcoStage, as: 'current_stage' }],
    });
    if (!eco) return res.status(404).json({ success: false, message: 'ECO not found' });

    if (eco.status !== 'IN_PROGRESS') return res.status(400).json({ success: false, message: 'ECO is not in progress' });
    if (!eco.current_stage.approval_required) return res.status(400).json({ success: false, message: 'Stage does not require approval' });

    await EcoApproval.create({
      eco_id: eco.id,
      stage_id: eco.current_stage_id,
      approver_id: req.user.userId,
      action: 'APPROVED',
      comment,
    });

    const rules = await ApprovalRule.findAll({ where: { stage_id: eco.current_stage_id, is_active: true } });
    const approvals = await EcoApproval.findAll({ where: { eco_id: eco.id, stage_id: eco.current_stage_id, action: 'APPROVED' } });

    const requiredApprovals = rules.reduce((acc, r) => acc + r.min_approvals, 0);

    if (approvals.length >= (requiredApprovals || 1)) {
      const nextStage = await EcoStage.findOne({
        where: { sequence_no: { [Op.gt]: eco.current_stage.sequence_no }, is_active: true },
        order: [['sequence_no', 'ASC']],
      });

      let newStatus = 'IN_PROGRESS';
      if (!nextStage) newStatus = 'APPLIED';

      await eco.update({
        current_stage_id: nextStage ? nextStage.id : eco.current_stage_id,
        status: newStatus,
        approved_at: new Date(),
      });

      await EcoStageHistory.create({
        eco_id: eco.id,
        from_stage_id: eco.current_stage_id,
        to_stage_id: nextStage ? nextStage.id : null,
        action: 'STAGE_APPROVED',
        acted_by: req.user.userId,
      });

      if (newStatus === 'APPLIED') {
        const { applyEcoChanges } = require('../services/eco.service');
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
    const { EcoApproval, EcoStageHistory } = require('../lib/prisma');

    const eco = await Eco.findOne({ where: { id: parseInt(id) } });
    if (!eco) return res.status(404).json({ success: false, message: 'ECO not found' });

    await EcoApproval.create({
      eco_id: eco.id,
      stage_id: eco.current_stage_id,
      approver_id: req.user.userId,
      action: 'REJECTED',
      comment: reason,
    });

    await eco.update({ status: 'REJECTED', rejection_reason: reason });

    await EcoStageHistory.create({
      eco_id: eco.id,
      from_stage_id: eco.current_stage_id,
      to_stage_id: null,
      action: 'REJECTED',
      acted_by: req.user.userId,
      comment: reason,
    });

    res.json({ success: true, data: eco });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllEcos, getEcoById, createEcoDraft, updateEcoDraft, startEco, validateEco, approveEco, rejectEco,
};
