const prisma = require('../lib/prisma');

// --- ECO STAGES ---

const getEcoStages = async (req, res, next) => {
  try {
    const stages = await prisma.ecoStage.findMany({
      include: { approval_rules: true },
      orderBy: { sequence_no: 'asc' },
    });
    res.json({ success: true, data: stages });
  } catch (err) {
    next(err);
  }
};

const createEcoStage = async (req, res, next) => {
  try {
    const { name, sequence_no, approval_required, is_start_stage, is_final_stage, is_active } = req.body;
    
    // Clear other start/final flags if this one is set
    if (is_start_stage === true) {
      await prisma.ecoStage.updateMany({ where: { is_start_stage: true }, data: { is_start_stage: false } });
    }
    if (is_final_stage === true) {
      await prisma.ecoStage.updateMany({ where: { is_final_stage: true }, data: { is_final_stage: false } });
    }

    const stage = await prisma.ecoStage.create({
      data: {
        name, sequence_no, approval_required, is_start_stage, is_final_stage, is_active,
        created_by: req.user.userId,
      }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId, action: 'CREATE_ECO_STAGE', affected_type: 'ECO_STAGE', affected_id: stage.id,
        smart_summary: `Created ECO stage: ${name}`
      }
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
      await prisma.ecoStage.updateMany({ where: { is_start_stage: true, id: { not: parseInt(id) } }, data: { is_start_stage: false } });
    }
    if (is_final_stage === true) {
      await prisma.ecoStage.updateMany({ where: { is_final_stage: true, id: { not: parseInt(id) } }, data: { is_final_stage: false } });
    }

    const stage = await prisma.ecoStage.update({
      where: { id: parseInt(id) },
      data: { name, sequence_no, approval_required, is_start_stage, is_final_stage, is_active }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId, action: 'UPDATE_ECO_STAGE', affected_type: 'ECO_STAGE', affected_id: stage.id,
        smart_summary: `Updated ECO stage: ${name}`
      }
    });

    res.json({ success: true, data: stage });
  } catch (err) {
    next(err);
  }
};

// --- APPROVAL RULES ---

const getApprovalRules = async (req, res, next) => {
  try {
    const rules = await prisma.approvalRule.findMany({ include: { stage: true } });
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
};

const createApprovalRule = async (req, res, next) => {
  try {
    const { stage_id, approver_role, min_approvals, is_active } = req.body;
    const rule = await prisma.approvalRule.create({
      data: { stage_id, approver_role, min_approvals, is_active }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId, action: 'CREATE_APPROVAL_RULE', affected_type: 'APPROVAL_RULE', affected_id: rule.id,
        smart_summary: `Created Approval Rule for stage ${stage_id}`
      }
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
    const rule = await prisma.approvalRule.update({
      where: { id: parseInt(id) },
      data: { stage_id, approver_role, min_approvals, is_active }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId, action: 'UPDATE_APPROVAL_RULE', affected_type: 'APPROVAL_RULE', affected_id: rule.id,
        smart_summary: `Updated Approval Rule ID ${id}`
      }
    });

    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEcoStages, createEcoStage, updateEcoStage,
  getApprovalRules, createApprovalRule, updateApprovalRule
};
