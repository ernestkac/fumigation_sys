-- ==========================================================
-- Fumigation Exercise Tracking and Reporting System
-- Database Schema (MySQL 8.0+ Compatible)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `fumigation_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `fumigation_db`;

-- 1. Warehouses Table
CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `warehouse_code` VARCHAR(50) NOT NULL UNIQUE,
  `warehouse_name` VARCHAR(150) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_warehouses_code` (`warehouse_code`),
  INDEX `idx_warehouses_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Officers Table
CREATE TABLE IF NOT EXISTS `officers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_number` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_officers_emp_num` (`employee_number`),
  INDEX `idx_officers_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Commodities Table
CREATE TABLE IF NOT EXISTS `commodities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `commodity_name` VARCHAR(100) NOT NULL UNIQUE,
  `default_unit` VARCHAR(50) NOT NULL DEFAULT 'Bags',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_commodities_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Stacks Table
CREATE TABLE IF NOT EXISTS `stacks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `stack_number` VARCHAR(50) NOT NULL,
  `commodity_id` INT UNSIGNED NOT NULL,
  `current_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Bags',
  `status` ENUM('Active', 'Empty', 'Closed', 'Transferred', 'Archived') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_warehouse_stack` (`warehouse_id`, `stack_number`),
  INDEX `idx_stacks_warehouse` (`warehouse_id`),
  INDEX `idx_stacks_commodity` (`commodity_id`),
  INDEX `idx_stacks_status` (`status`),
  CONSTRAINT `fk_stacks_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_stacks_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Fumigation Exercises Table
CREATE TABLE IF NOT EXISTS `fumigation_exercises` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `exercise_number` VARCHAR(50) NOT NULL UNIQUE,
  `warehouse_id` INT UNSIGNED NOT NULL,
  `planned_fumigation_date` DATE NOT NULL,
  `actual_fumigation_date` DATE NULL,
  `planned_duration` INT UNSIGNED NOT NULL COMMENT 'Duration in days',
  `actual_duration` INT UNSIGNED NULL COMMENT 'Actual duration in days',
  `responsible_officer_id` INT UNSIGNED NOT NULL,
  `status` ENUM('Planned', 'In Progress', 'Completed', 'Postponed', 'Cancelled') NOT NULL DEFAULT 'Planned',
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_exercises_number` (`exercise_number`),
  INDEX `idx_exercises_warehouse` (`warehouse_id`),
  INDEX `idx_exercises_officer` (`responsible_officer_id`),
  INDEX `idx_exercises_planned_date` (`planned_fumigation_date`),
  INDEX `idx_exercises_actual_date` (`actual_fumigation_date`),
  INDEX `idx_exercises_status` (`status`),
  CONSTRAINT `fk_exercises_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_exercises_officer` FOREIGN KEY (`responsible_officer_id`) REFERENCES `officers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Fumigation Exercise Stack Snapshot Table (Junction & Historical Snapshot)
CREATE TABLE IF NOT EXISTS `fumigation_exercise_stacks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `fumigation_exercise_id` INT UNSIGNED NOT NULL,
  `stack_id` INT UNSIGNED NOT NULL,
  `stack_number_snapshot` VARCHAR(50) NOT NULL,
  `commodity_id` INT UNSIGNED NOT NULL,
  `commodity_name_snapshot` VARCHAR(100) NOT NULL,
  `quantity_snapshot` DECIMAL(12, 2) NOT NULL,
  `unit_snapshot` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_exercise_stack` (`fumigation_exercise_id`, `stack_id`),
  INDEX `idx_fes_exercise` (`fumigation_exercise_id`),
  INDEX `idx_fes_stack` (`stack_id`),
  CONSTRAINT `fk_fes_exercise` FOREIGN KEY (`fumigation_exercise_id`) REFERENCES `fumigation_exercises` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fes_stack` FOREIGN KEY (`stack_id`) REFERENCES `stacks` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fes_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Fumigation Challenges Table
CREATE TABLE IF NOT EXISTS `fumigation_challenges` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `fumigation_exercise_id` INT UNSIGNED NOT NULL,
  `challenge_category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `action_resolution` TEXT NULL,
  `resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `resolution_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_challenges_exercise` (`fumigation_exercise_id`),
  INDEX `idx_challenges_category` (`challenge_category`),
  INDEX `idx_challenges_resolved` (`resolved`),
  CONSTRAINT `fk_challenges_exercise` FOREIGN KEY (`fumigation_exercise_id`) REFERENCES `fumigation_exercises` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
