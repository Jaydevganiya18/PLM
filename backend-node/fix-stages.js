const { sequelize, EcoStage, ApprovalRule, Eco } = require('./src/db');

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB.");

        // 1. Delete extra approval rule involving ADMIN (rule ID or role 'ADMIN')
        await sequelize.query("DELETE FROM approval_rules WHERE approver_role='ADMIN'");
        console.log("Deleted extra approval rule.");

        // 2. Mark Approval stage as final stage
        await sequelize.query("UPDATE eco_stages SET is_final_stage=1 WHERE name='Approval'");
        console.log("Marked 'Approval' as the final stage.");

        // 3. Move any ECOs in Final Validation back to Approval or automatically apply them
        const [fvStage] = await sequelize.query("SELECT id FROM eco_stages WHERE name='Final Validation'");
        if (fvStage && fvStage.length > 0) {
           const finalValidationId = fvStage[0].id;
           console.log("Found Final Validation stage with ID", finalValidationId);
           
           // Move ecos out of this stage
           await sequelize.query(`UPDATE ecos SET current_stage_id = (SELECT id FROM eco_stages WHERE name='Approval') WHERE current_stage_id=${finalValidationId}`);
           await sequelize.query(`UPDATE eco_stage_history SET to_stage_id = NULL WHERE to_stage_id=${finalValidationId}`);
           await sequelize.query(`UPDATE eco_stage_history SET from_stage_id = NULL WHERE from_stage_id=${finalValidationId}`);
           
           // Drop the Final Validation stage completely
           await sequelize.query(`DELETE FROM eco_stages WHERE id=${finalValidationId}`);
           console.log("Dropped 'Final Validation' stage.");
        }

        console.log('Simplified workflow executed.');
        process.exit(0);
    } catch(e) { 
        console.error('Error:', e.message); 
        process.exit(1); 
    }
})();
