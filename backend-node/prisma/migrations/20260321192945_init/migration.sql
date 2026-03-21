-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_code` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `current_version_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `archived_at` DATETIME(3) NULL,

    UNIQUE INDEX `products_product_code_key`(`product_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `version_no` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sale_price` DECIMAL(12, 2) NOT NULL,
    `cost_price` DECIMAL(12, 2) NOT NULL,
    `effective_date` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_via_eco_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `archived_at` DATETIME(3) NULL,

    UNIQUE INDEX `product_versions_product_id_version_no_key`(`product_id`, `version_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_version_id` INTEGER NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `uploaded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bom_code` VARCHAR(191) NOT NULL,
    `product_id` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `current_version_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `archived_at` DATETIME(3) NULL,

    UNIQUE INDEX `boms_bom_code_key`(`bom_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bom_id` INTEGER NOT NULL,
    `version_no` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `effective_date` DATETIME(3) NULL,
    `created_via_eco_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `archived_at` DATETIME(3) NULL,

    UNIQUE INDEX `bom_versions_bom_id_version_no_key`(`bom_id`, `version_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_components` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bom_version_id` INTEGER NOT NULL,
    `line_no` INTEGER NOT NULL,
    `component_product_id` INTEGER NOT NULL,
    `quantity` DECIMAL(12, 4) NOT NULL,
    `uom` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bom_components_bom_version_id_line_no_key`(`bom_version_id`, `line_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_operations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bom_version_id` INTEGER NOT NULL,
    `line_no` INTEGER NOT NULL,
    `operation_name` VARCHAR(191) NOT NULL,
    `work_center` VARCHAR(191) NOT NULL,
    `duration_minutes` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bom_operations_bom_version_id_line_no_key`(`bom_version_id`, `line_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eco_stages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `sequence_no` INTEGER NOT NULL,
    `approval_required` BOOLEAN NOT NULL,
    `is_start_stage` BOOLEAN NOT NULL,
    `is_final_stage` BOOLEAN NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `eco_stages_name_key`(`name`),
    UNIQUE INDEX `eco_stages_sequence_no_key`(`sequence_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stage_id` INTEGER NOT NULL,
    `approver_role` ENUM('ADMIN', 'APPROVER') NOT NULL,
    `min_approvals` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ecos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eco_number` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `eco_type` ENUM('PRODUCT', 'BOM') NOT NULL,
    `product_id` INTEGER NOT NULL,
    `bom_id` INTEGER NULL,
    `source_product_version_id` INTEGER NULL,
    `source_bom_version_id` INTEGER NULL,
    `original_snapshot` JSON NULL,
    `proposed_changes` JSON NULL,
    `current_stage_id` INTEGER NULL,
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'REJECTED', 'APPLIED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `version_update` BOOLEAN NOT NULL DEFAULT true,
    `rejection_reason` TEXT NULL,
    `effective_date` DATETIME(3) NULL,
    `requested_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `started_at` DATETIME(3) NULL,
    `submitted_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,
    `applied_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ecos_eco_number_key`(`eco_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eco_approvals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eco_id` INTEGER NOT NULL,
    `stage_id` INTEGER NOT NULL,
    `approver_id` INTEGER NOT NULL,
    `action` ENUM('APPROVED', 'REJECTED', 'VALIDATED') NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eco_stage_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eco_id` INTEGER NOT NULL,
    `from_stage_id` INTEGER NULL,
    `to_stage_id` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `acted_by` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `affected_type` VARCHAR(191) NOT NULL,
    `affected_id` INTEGER NOT NULL,
    `eco_id` INTEGER NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `smart_summary` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_current_version_id_fkey` FOREIGN KEY (`current_version_id`) REFERENCES `product_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_versions` ADD CONSTRAINT `product_versions_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_versions` ADD CONSTRAINT `product_versions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_versions` ADD CONSTRAINT `product_versions_created_via_eco_id_fkey` FOREIGN KEY (`created_via_eco_id`) REFERENCES `ecos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attachments` ADD CONSTRAINT `product_attachments_product_version_id_fkey` FOREIGN KEY (`product_version_id`) REFERENCES `product_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attachments` ADD CONSTRAINT `product_attachments_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boms` ADD CONSTRAINT `boms_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boms` ADD CONSTRAINT `boms_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boms` ADD CONSTRAINT `boms_current_version_id_fkey` FOREIGN KEY (`current_version_id`) REFERENCES `bom_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_versions` ADD CONSTRAINT `bom_versions_bom_id_fkey` FOREIGN KEY (`bom_id`) REFERENCES `boms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_versions` ADD CONSTRAINT `bom_versions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_versions` ADD CONSTRAINT `bom_versions_created_via_eco_id_fkey` FOREIGN KEY (`created_via_eco_id`) REFERENCES `ecos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_components` ADD CONSTRAINT `bom_components_bom_version_id_fkey` FOREIGN KEY (`bom_version_id`) REFERENCES `bom_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_components` ADD CONSTRAINT `bom_components_component_product_id_fkey` FOREIGN KEY (`component_product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_operations` ADD CONSTRAINT `bom_operations_bom_version_id_fkey` FOREIGN KEY (`bom_version_id`) REFERENCES `bom_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_stages` ADD CONSTRAINT `eco_stages_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_rules` ADD CONSTRAINT `approval_rules_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `eco_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecos` ADD CONSTRAINT `ecos_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecos` ADD CONSTRAINT `ecos_bom_id_fkey` FOREIGN KEY (`bom_id`) REFERENCES `boms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecos` ADD CONSTRAINT `ecos_source_product_version_id_fkey` FOREIGN KEY (`source_product_version_id`) REFERENCES `product_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecos` ADD CONSTRAINT `ecos_source_bom_version_id_fkey` FOREIGN KEY (`source_bom_version_id`) REFERENCES `bom_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecos` ADD CONSTRAINT `ecos_current_stage_id_fkey` FOREIGN KEY (`current_stage_id`) REFERENCES `eco_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ecos` ADD CONSTRAINT `ecos_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_approvals` ADD CONSTRAINT `eco_approvals_eco_id_fkey` FOREIGN KEY (`eco_id`) REFERENCES `ecos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_approvals` ADD CONSTRAINT `eco_approvals_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `eco_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_approvals` ADD CONSTRAINT `eco_approvals_approver_id_fkey` FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_stage_history` ADD CONSTRAINT `eco_stage_history_eco_id_fkey` FOREIGN KEY (`eco_id`) REFERENCES `ecos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_stage_history` ADD CONSTRAINT `eco_stage_history_from_stage_id_fkey` FOREIGN KEY (`from_stage_id`) REFERENCES `eco_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_stage_history` ADD CONSTRAINT `eco_stage_history_to_stage_id_fkey` FOREIGN KEY (`to_stage_id`) REFERENCES `eco_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eco_stage_history` ADD CONSTRAINT `eco_stage_history_acted_by_fkey` FOREIGN KEY (`acted_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_eco_id_fkey` FOREIGN KEY (`eco_id`) REFERENCES `ecos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
