const {
  EcoStage, ApprovalRule, AuditLog,
} = require('../lib/prisma');

// --- ECO STAGES ---

const getEcoStages = async (req, res, next) => {
  try {
    const stages = await EcoStage.findAll({
      include: [{ model: ApprovalRule, as: 'approval_rules' }],
      order: [['sequence_no', 'ASC']],
    });
    res.json({ success: true, data: stages });
  } catch (err) {
    next(err);
  }
};

const createEcoStage = async (req, res, next) => {
  try {
    const { name, sequence_no, approval_required, is_start_stage, is_final_stage, is_active } = req.body;

    if (is_start_stage === true) {
      await EcoStage.update({ is_start_stage: false }, { where: { is_start_stage: true } });
    }
    if (is_final_stage === true) {
      await EcoStage.update({ is_final_stage: false }, { where: { is_final_stage: true } });
    }

    const stage = await EcoStage.create({
      name, sequence_no, approval_required, is_start_stage, is_final_stage, is_active,
      created_by: req.user.userId,
    });

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'CREATE_ECO_STAGE',
      affected_type: 'ECO_STAGE',
      affected_id: stage.id,
      smart_summary: `Created ECO stage: ${name}`,
    });

    res.status(201).json({ success: true, data: stage });
  } catch (err) {
    next(err);
  }
};

const updateEcoStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sequence_no, approval_required, is_start_stage, is_final_stage, is_active } = req.body;

    if (is_start_stage === true) {
      const { Op } = require('sequelize');
      await EcoStage.update(
        { is_start_stage: false },
        { where: { is_start_stage: true, id: { [Op.ne]: parseInt(id) } } }
      );
    }
    if (is_final_stage === true) {
      const { Op } = require('sequelize');
      await EcoStage.update(
        { is_final_stage: false },
        { where: { is_final_stage: true, id: { [Op.ne]: parseInt(id) } } }
      );
    }

    await EcoStage.update(
      { name, sequence_no, approval_required, is_start_stage, is_final_stage, is_active },
      { where: { id: parseInt(id) } }
    );
    const stage = await EcoStage.findOne({ where: { id: parseInt(id) } });

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'UPDATE_ECO_STAGE',
      affected_type: 'ECO_STAGE',
      affected_id: stage.id,
      smart_summary: `Updated ECO stage: ${name}`,
    });

    res.json({ success: true, data: stage });
  } catch (err) {
    next(err);
  }
};

// --- APPROVAL RULES ---

const getApprovalRules = async (req, res, next) => {
  try {
    const rules = await ApprovalRule.findAll({
      include: [{ model: EcoStage, as: 'stage' }],
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
};

const createApprovalRule = async (req, res, next) => {
  try {
    const { stage_id, approver_role, min_approvals, is_active } = req.body;
    const rule = await ApprovalRule.create({ stage_id, approver_role, min_approvals, is_active });

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'CREATE_APPROVAL_RULE',
      affected_type: 'APPROVAL_RULE',
      affected_id: rule.id,
      smart_summary: `Created Approval Rule for stage ${stage_id}`,
    });

    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

const updateApprovalRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage_id, approver_role, min_approvals, is_active } = req.body;

    await ApprovalRule.update(
      { stage_id, approver_role, min_approvals, is_active },
      { where: { id: parseInt(id) } }
    );
    const rule = await ApprovalRule.findOne({ where: { id: parseInt(id) } });

    await AuditLog.create({
      user_id: req.user.userId,
      action: 'UPDATE_APPROVAL_RULE',
      affected_type: 'APPROVAL_RULE',
      affected_id: rule.id,
      smart_summary: `Updated Approval Rule ID ${id}`,
    });

    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEcoStages, createEcoStage, updateEcoStage,
  getApprovalRules, createApprovalRule, updateApprovalRule,
};
