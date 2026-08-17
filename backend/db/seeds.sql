-- ==========================================================
-- Initial Seed Data for Fumigation Tracking System
-- ==========================================================

USE `fumigation_db`;

-- Seed Warehouses
INSERT INTO `warehouses` (`id`, `warehouse_code`, `warehouse_name`, `location`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'WH-BLA', 'Blantyre Main Depot', 'Makata Industrial Area, Blantyre', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(2, 'WH-MZU', 'Mzuzu Regional Warehouse', 'Luwinga Industrial Site, Mzuzu', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(3, 'WH-LLW', 'Lilongwe Central Silos', 'Kanengo Industrial Zone, Lilongwe', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00')
ON DUPLICATE KEY UPDATE `warehouse_name`=VALUES(`warehouse_name`);

-- Seed Officers
INSERT INTO `officers` (`id`, `employee_number`, `name`, `department`, `phone`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'EMP-001', 'John Banda', 'Quality Assurance & Pest Control', '+265 991 234 567', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(2, 'EMP-002', 'Mary Phiri', 'Warehouse Operations', '+265 888 765 432', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(3, 'EMP-003', 'Chikondi Gondwe', 'Plant Protection Services', '+265 999 112 233', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed Commodities
INSERT INTO `commodities` (`id`, `commodity_name`, `default_unit`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Maize', 'Bags (50kg)', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(2, 'Soybean', 'Bags (50kg)', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(3, 'Groundnuts', 'Bags (50kg)', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(4, 'Paddy Rice', 'Bags (50kg)', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00'),
(5, 'Wheat Grain', 'Metric Tonnes', 1, '2026-08-01 08:00:00', '2026-08-01 08:00:00')
ON DUPLICATE KEY UPDATE `commodity_name`=VALUES(`commodity_name`);

-- Seed Stacks
INSERT INTO `stacks` (`id`, `warehouse_id`, `stack_number`, `commodity_id`, `current_quantity`, `unit`, `status`, `created_at`, `updated_at`) VALUES
-- Blantyre Stacks
(1, 1, 'B001', 1, 500.00, 'Bags (50kg)', 'Active', '2026-08-05 09:00:00', '2026-08-05 09:00:00'),
(2, 1, 'B002', 1, 750.00, 'Bags (50kg)', 'Active', '2026-08-05 09:00:00', '2026-08-05 09:00:00'),
(3, 1, 'B003', 2, 300.00, 'Bags (50kg)', 'Active', '2026-08-05 09:00:00', '2026-08-05 09:00:00'),
(4, 1, 'B004', 1, 600.00, 'Bags (50kg)', 'Active', '2026-08-05 09:00:00', '2026-08-05 09:00:00'),
(5, 1, 'B005', 3, 450.00, 'Bags (50kg)', 'Active', '2026-08-05 09:00:00', '2026-08-05 09:00:00'),
-- Mzuzu Stacks
(6, 2, 'M001', 1, 800.00, 'Bags (50kg)', 'Active', '2026-08-06 09:00:00', '2026-08-06 09:00:00'),
(7, 2, 'M002', 1, 600.00, 'Bags (50kg)', 'Active', '2026-08-06 09:00:00', '2026-08-06 09:00:00'),
(8, 2, 'M003', 4, 550.00, 'Bags (50kg)', 'Active', '2026-08-06 09:00:00', '2026-08-06 09:00:00'),
-- Lilongwe Stacks
(9, 3, 'L001', 1, 1200.00, 'Bags (50kg)', 'Active', '2026-08-07 09:00:00', '2026-08-07 09:00:00'),
(10, 3, 'L002', 5, 250.00, 'Metric Tonnes', 'Active', '2026-08-07 09:00:00', '2026-08-07 09:00:00')
ON DUPLICATE KEY UPDATE `current_quantity`=VALUES(`current_quantity`);

-- Seed Fumigation Exercises
INSERT INTO `fumigation_exercises` (`id`, `exercise_number`, `warehouse_id`, `planned_fumigation_date`, `actual_fumigation_date`, `planned_duration`, `actual_duration`, `responsible_officer_id`, `status`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 'FUM-2026-001', 1, '2026-08-25', '2026-08-25', 3, 3, 1, 'Completed', 'Routine quarterly phosphine fumigation against weevils and grain borers.', '2026-08-10 10:00:00', '2026-08-28 16:00:00'),
(2, 'FUM-2026-002', 2, '2026-08-27', NULL, 2, NULL, 2, 'Planned', 'Pre-distribution fumigation for relief food grain stacks.', '2026-08-12 11:00:00', '2026-08-12 11:00:00'),
(3, 'FUM-2026-003', 3, '2026-08-30', NULL, 4, NULL, 3, 'Planned', 'Full silo enclosure fumigation scheduled before seasonal intake.', '2026-08-14 14:30:00', '2026-08-14 14:30:00')
ON DUPLICATE KEY UPDATE `remarks`=VALUES(`remarks`);

-- Seed Stack Snapshots for Exercise 1 (FUM-2026-001)
INSERT INTO `fumigation_exercise_stacks` (`id`, `fumigation_exercise_id`, `stack_id`, `stack_number_snapshot`, `commodity_id`, `commodity_name_snapshot`, `quantity_snapshot`, `unit_snapshot`, `created_at`) VALUES
(1, 1, 1, 'B001', 1, 'Maize', 500.00, 'Bags (50kg)', '2026-08-10 10:00:00'),
(2, 1, 2, 'B002', 1, 'Maize', 750.00, 'Bags (50kg)', '2026-08-10 10:00:00'),
(3, 1, 3, 'B003', 2, 'Soybean', 300.00, 'Bags (50kg)', '2026-08-10 10:00:00')
ON DUPLICATE KEY UPDATE `quantity_snapshot`=VALUES(`quantity_snapshot`);

-- Seed Stack Snapshots for Exercise 2 (FUM-2026-002)
INSERT INTO `fumigation_exercise_stacks` (`id`, `fumigation_exercise_id`, `stack_id`, `stack_number_snapshot`, `commodity_id`, `commodity_name_snapshot`, `quantity_snapshot`, `unit_snapshot`, `created_at`) VALUES
(4, 2, 6, 'M001', 1, 'Maize', 800.00, 'Bags (50kg)', '2026-08-12 11:00:00'),
(5, 2, 7, 'M002', 1, 'Maize', 600.00, 'Bags (50kg)', '2026-08-12 11:00:00')
ON DUPLICATE KEY UPDATE `quantity_snapshot`=VALUES(`quantity_snapshot`);

-- Seed Stack Snapshots for Exercise 3 (FUM-2026-003)
INSERT INTO `fumigation_exercise_stacks` (`id`, `fumigation_exercise_id`, `stack_id`, `stack_number_snapshot`, `commodity_id`, `commodity_name_snapshot`, `quantity_snapshot`, `unit_snapshot`, `created_at`) VALUES
(6, 3, 9, 'L001', 1, 'Maize', 1200.00, 'Bags (50kg)', '2026-08-14 14:30:00'),
(7, 3, 10, 'L002', 5, 'Wheat Grain', 250.00, 'Metric Tonnes', '2026-08-14 14:30:00')
ON DUPLICATE KEY UPDATE `quantity_snapshot`=VALUES(`quantity_snapshot`);

-- Seed Challenges for FUM-2026-001
INSERT INTO `fumigation_challenges` (`id`, `fumigation_exercise_id`, `challenge_category`, `description`, `action_resolution`, `resolved`, `resolution_date`, `created_at`, `updated_at`) VALUES
(1, 1, 'Chemical availability', 'Aluminium phosphide tablets were temporarily unavailable at local depot.', 'Emergency stock transfer requisitioned from central store in Lilongwe.', 1, '2026-08-24', '2026-08-20 09:30:00', '2026-08-24 15:00:00'),
(2, 1, 'Weather', 'Heavy sudden rainfall delayed warehouse roof sealing and sand-snake placement.', 'Rescheduled sheet unfolding by 3 hours until showers ceased and relative humidity stabilized.', 1, '2026-08-25', '2026-08-25 08:00:00', '2026-08-25 12:00:00'),
(3, 1, 'Labour', 'Insufficient personnel available for simultaneous folding of heavy PVC fumigation gas sheets.', 'Hired 4 certified casual laborers from neighboring depot to assist safety team.', 1, '2026-08-25', '2026-08-25 09:00:00', '2026-08-25 14:00:00');
