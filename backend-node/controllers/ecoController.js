// =============================================================================
// backend-node/controllers/ecoController.js

// sdfsdfgit d
// Full ECO logic: getAll, getById, create, submit, approve, reject, clone
// =============================================================================
const axios = require("axios");
const { ECO, Product, BoM, AuditLog, User } = require("../db");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// ── Helper: write audit log ───────────────────────────────────────────────────
async function audit({
  user_id,
  action,
  affected_type,
  affected_id,
  old_value,
  new_value,
  smart_summary,
}) {
  await AuditLog.create({
    user_id,
    action,
    affected_type,
    affected_id,
    old_value: old_value || null,
    new_value: new_value || null,
    smart_summary: smart_summary || null,
    timestamp: new Date(),
  });
}

// ── Helper: call FastAPI smart-log ────────────────────────────────────────────
async function getSmartLog({ eco, user, old_value, new_value }) {
  try {
    const res = await axios.post(
      `${AI_URL}/api/ai/smart-log`,
      {
        eco_title: eco.title,
        eco_type: eco.type,
        user_name: user.name,
        user_role: user.role,
        action: "ECO_APPROVED",
        old_value,
        new_value,
      },
      { timeout: 10000 },
    );
    return res.data.human_readable_log || "";
  } catch {
    return `${user.name} (${user.role}) approved ECO "${eco.title}".`;
  }
}

// =============================================================================
// GET /api/ecos
// =============================================================================
exports.getAllECOs = async (req, res, next) => {
  try {
    const ecos = await ECO.findAll({
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "role"] },
        { model: User, as: "approver", attributes: ["id", "name", "role"] },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "version"],
        },
        { model: BoM, as: "bom", attributes: ["id", "version", "product_id"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(ecos);
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// GET /api/ecos/:id
// Returns ECO + original_snapshot (for left diff panel)
// + live active target (for right diff panel)
// =============================================================================
exports.getECOById = async (req, res, next) => {
  try {
    const eco = await ECO.findByPk(req.params.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "role"] },
        { model: User, as: "approver", attributes: ["id", "name", "role"] },
      ],
    });
    if (!eco) return res.status(404).json({ error: "ECO not found" });

    // Fetch live active target for right panel
    let liveTarget = null;
    if (eco.type === "Product" && eco.product_id) {
      liveTarget = await Product.findOne({
        where: { id: eco.product_id, is_active: true },
      });
    } else if (eco.type === "BoM" && eco.bom_id) {
      liveTarget = await BoM.findOne({
        where: { id: eco.bom_id, is_active: true },
      });
    }

    res.json({
      eco,
      // Left panel → original_snapshot (frozen at ECO creation time)
      snapshot: eco.original_snapshot,
      // Right panel → live active record
      liveTarget,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/ecos
// Engineering + Admin only
// =============================================================================
exports.createECO = async (req, res, next) => {
  try {
    const {
      title,
      type,
      product_id,
      bom_id,
      proposed_changes,
      version_update,
      effective_date,
    } = req.body;

    // ── Type + FK validation ──────────────────────────────────────────────
    if (type === "Product") {
      if (!product_id)
        return res
          .status(400)
          .json({ error: "product_id required for Product ECO" });
      if (bom_id)
        return res
          .status(400)
          .json({ error: "bom_id must be null for Product ECO" });
    } else if (type === "BoM") {
      if (!bom_id)
        return res.status(400).json({ error: "bom_id required for BoM ECO" });
      if (product_id)
        return res
          .status(400)
          .json({ error: "product_id must be null for BoM ECO" });
    } else {
      return res.status(400).json({ error: "type must be Product or BoM" });
    }

    // ── Capture original snapshot ─────────────────────────────────────────
    let target;
    if (type === "Product") {
      target = await Product.findOne({
        where: { id: product_id, is_active: true },
      });
      if (!target)
        return res.status(404).json({ error: "Active Product not found" });
    } else {
      target = await BoM.findOne({ where: { id: bom_id, is_active: true } });
      if (!target)
        return res.status(404).json({ error: "Active BoM not found" });
    }

    const eco = await ECO.create({
      title,
      type,
      product_id: product_id || null,
      bom_id: bom_id || null,
      proposed_changes,
      original_snapshot: target.toJSON(), // frozen copy
      stage: "New",
      version_update: version_update ?? true,
      created_by: req.user.id,
      risk_acknowledged: false,
      effective_date: effective_date || null,
    });

    await audit({
      user_id: req.user.id,
      action: "ECO_CREATED",
      affected_type: type,
      affected_id: type === "Product" ? product_id : bom_id,
      new_value: proposed_changes,
      smart_summary: `ECO "${title}" created by ${req.user.name}.`,
    });

    // Notify Approvers
    req.io.to("role_Approver").emit("eco_created", {
      eco_id: eco.id,
      title: eco.title,
      created_by: req.user.name,
    });

    res.status(201).json(eco);
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// PATCH /api/ecos/:id/submit   New → Approval
// Engineering + Admin only
// =============================================================================
exports.submitECO = async (req, res, next) => {
  try {
    const eco = await ECO.findByPk(req.params.id);
    if (!eco) return res.status(404).json({ error: "ECO not found" });

    if (eco.stage === "Rejected")
      return res.status(400).json({
        error: "Rejected ECOs cannot be submitted. Clone it instead.",
      });
    if (eco.stage !== "New")
      return res
        .status(400)
        .json({ error: "Only New-stage ECOs can be submitted" });

    const { risk_acknowledged } = req.body;

    // If Engineering acknowledged anomaly warning
    if (risk_acknowledged) {
      eco.risk_acknowledged = true;
      eco.risk_acknowledged_at = new Date();

      await audit({
        user_id: req.user.id,
        action: "RISK_ACKNOWLEDGED",
        affected_type: eco.type,
        affected_id: eco.bom_id || eco.product_id,
        smart_summary: `${req.user.name} acknowledged AI anomaly warning before submitting ECO "${eco.title}".`,
      });
    }

    eco.stage = "Approval";
    await eco.save();

    await audit({
      user_id: req.user.id,
      action: "ECO_SUBMITTED",
      affected_type: eco.type,
      affected_id: eco.bom_id || eco.product_id,
      old_value: { stage: "New" },
      new_value: { stage: "Approval" },
      smart_summary: `${req.user.name} submitted ECO "${eco.title}" for approval.`,
    });

    req.io.to("role_Approver").emit("eco_submitted", {
      eco_id: eco.id,
      title: eco.title,
      submitted_by: req.user.name,
    });

    res.json({ message: "ECO submitted for approval", eco });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/ecos/:id/approve
// Approver + Admin only — THE CORE VERSIONING LOGIC
// =============================================================================
exports.approveECO = async (req, res, next) => {
  try {
    // Step 1: Role check
    if (!["Approver", "Admin"].includes(req.user.role))
      return res.status(403).json({ error: "Only Approvers can approve ECOs" });

    // Step 2: Fetch ECO
    const eco = await ECO.findByPk(req.params.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "role"] },
      ],
    });
    if (!eco) return res.status(404).json({ error: "ECO not found" });
    if (eco.stage !== "Approval")
      return res.status(400).json({ error: "ECO must be in Approval stage" });

    const approver = await User.findByPk(req.user.id);
    let old_snapshot = null;
    let new_record = null;

    // Step 3: Apply changes
    if (eco.type === "Product") {
      // ── Product versioning ──────────────────────────────────────────────
      const currentProduct = await Product.findOne({
        where: { id: eco.product_id, is_active: true },
      });
      if (!currentProduct)
        return res.status(404).json({ error: "Active Product not found" });

      old_snapshot = currentProduct.toJSON();
      const changes = eco.proposed_changes;

      if (eco.version_update) {
        // Archive old
        currentProduct._allowSystemUpdate = true;
        currentProduct.is_active = false;
        await currentProduct.save();

        // Create new version with lineage
        new_record = await Product.create({
          name: changes.name ?? currentProduct.name,
          sale_price: changes.sale_price ?? currentProduct.sale_price,
          cost_price: changes.cost_price ?? currentProduct.cost_price,
          image_url: changes.image_url ?? currentProduct.image_url,
          version: currentProduct.version + 1,
          parent_id: currentProduct.id, // ← lineage
          is_active: true,
          _allowSystemUpdate: true,
        });
      } else {
        // Same-version update
        currentProduct._allowSystemUpdate = true;
        Object.assign(currentProduct, changes);
        await currentProduct.save();
        new_record = currentProduct;
      }
    } else {
      // ── BoM versioning ──────────────────────────────────────────────────
      const currentBoM = await BoM.findOne({
        where: { id: eco.bom_id, is_active: true },
      });
      if (!currentBoM)
        return res.status(404).json({ error: "Active BoM not found" });

      old_snapshot = currentBoM.toJSON();
      const changes = eco.proposed_changes;

      if (eco.version_update) {
        // Archive old
        currentBoM._allowSystemUpdate = true;
        currentBoM.is_active = false;
        await currentBoM.save();

        // Create new version with lineage
        new_record = await BoM.create({
          product_id: currentBoM.product_id,
          version: currentBoM.version + 1,
          parent_id: currentBoM.id, // ← lineage
          components: changes.components ?? currentBoM.components,
          operations: changes.operations ?? currentBoM.operations,
          is_active: true,
          _allowSystemUpdate: true,
        });
      } else {
        currentBoM._allowSystemUpdate = true;
        if (changes.components) currentBoM.components = changes.components;
        if (changes.operations) currentBoM.operations = changes.operations;
        await currentBoM.save();
        new_record = currentBoM;
      }
    }

    // Step 5: Mark ECO Done
    eco.stage = "Done";
    eco.approved_by = req.user.id;
    eco.approved_at = new Date();
    await eco.save();

    // Step 6: AI smart log
    const smart_summary = await getSmartLog({
      eco,
      user: approver,
      old_value: old_snapshot,
      new_value: new_record.toJSON(),
    });

    // Step 7: Audit log
    await audit({
      user_id: req.user.id,
      action: "ECO_APPROVED",
      affected_type: eco.type,
      affected_id: new_record.id,
      old_value: old_snapshot,
      new_value: new_record.toJSON(),
      smart_summary,
    });

    // Step 8: Broadcast
    req.io.to("role_Engineering").to("role_Operations").emit("eco_approved", {
      eco_id: eco.id,
      eco_title: eco.title,
      approved_by: approver.name,
      new_version: new_record.version,
    });

    res.json({
      message: "ECO approved and changes applied",
      eco,
      new_record,
      smart_summary,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/ecos/:id/reject
// Approver + Admin only
// =============================================================================
exports.rejectECO = async (req, res, next) => {
  try {
    if (!["Approver", "Admin"].includes(req.user.role))
      return res.status(403).json({ error: "Only Approvers can reject ECOs" });

    const eco = await ECO.findByPk(req.params.id);
    if (!eco) return res.status(404).json({ error: "ECO not found" });
    if (eco.stage !== "Approval")
      return res
        .status(400)
        .json({ error: "Only Approval-stage ECOs can be rejected" });

    const { rejection_reason } = req.body;
    if (!rejection_reason || rejection_reason.trim().length < 10)
      return res
        .status(400)
        .json({ error: "rejection_reason must be at least 10 characters" });

    eco.stage = "Rejected"; // permanently rejected — not back to New
    eco.rejection_reason = rejection_reason;
    eco.approved_by = req.user.id;
    eco.approved_at = new Date();
    await eco.save();

    await audit({
      user_id: req.user.id,
      action: "ECO_REJECTED",
      affected_type: eco.type,
      affected_id: eco.bom_id || eco.product_id,
      old_value: { stage: "Approval" },
      new_value: { stage: "Rejected", rejection_reason },
      smart_summary: `${req.user.name} rejected ECO "${eco.title}". Reason: ${rejection_reason}`,
    });

    req.io.to("role_Engineering").emit("eco_rejected", {
      eco_id: eco.id,
      eco_title: eco.title,
      rejection_reason,
    });

    res.json({ message: "ECO rejected permanently", eco });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/ecos/:id/clone
// Only for Rejected ECOs — creates revised copy in New stage
// =============================================================================
exports.cloneECO = async (req, res, next) => {
  try {
    const original = await ECO.findByPk(req.params.id);
    if (!original) return res.status(404).json({ error: "ECO not found" });
    if (original.stage !== "Rejected")
      return res
        .status(400)
        .json({ error: "Only Rejected ECOs can be cloned" });

    // Fetch fresh snapshot of current active target
    let target;
    if (original.type === "Product") {
      target = await Product.findOne({
        where: { id: original.product_id, is_active: true },
      });
    } else {
      target = await BoM.findOne({
        where: { id: original.bom_id, is_active: true },
      });
    }
    if (!target)
      return res
        .status(404)
        .json({ error: "Active target not found for clone" });

    const clone = await ECO.create({
      title: original.title + " (Revised)",
      type: original.type,
      product_id: original.product_id,
      bom_id: original.bom_id,
      proposed_changes: original.proposed_changes,
      original_snapshot: target.toJSON(), // fresh snapshot
      stage: "New",
      version_update: original.version_update,
      created_by: req.user.id,
      risk_acknowledged: false,
    });

    await audit({
      user_id: req.user.id,
      action: "ECO_CREATED",
      affected_type: clone.type,
      affected_id: clone.bom_id || clone.product_id,
      smart_summary: `${req.user.name} cloned rejected ECO "${original.title}" as "${clone.title}".`,
    });

    res.status(201).json({ message: "ECO cloned successfully", clone });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// PATCH /api/ecos/:id/changes
// Update proposed_changes while ECO is in New stage
// =============================================================================
exports.updateECOChanges = async (req, res, next) => {
  try {
    const eco = await ECO.findByPk(req.params.id);
    if (!eco) return res.status(404).json({ error: "ECO not found" });
    if (eco.stage !== "New")
      return res.status(400).json({ error: "Only New ECOs can be edited" });

    // Validate payload shape optionally
    const { proposed_changes } = req.body;
    eco.proposed_changes = proposed_changes;
    await eco.save();
    res.json({ message: "Changes saved successfully", eco });
  } catch (err) {
    next(err);
  }
};
