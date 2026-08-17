import { Router } from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
} from '../controllers/warehouseController.js';
import {
  getOfficers,
  createOfficer,
  updateOfficer,
} from '../controllers/officerController.js';
import {
  getCommodities,
  createCommodity,
  updateCommodity,
} from '../controllers/commodityController.js';
import {
  getStacks,
  getStackById,
  createStack,
  updateStack,
} from '../controllers/stackController.js';
import {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
} from '../controllers/exerciseController.js';
import {
  getChallenges,
  createChallenge,
  updateChallenge,
} from '../controllers/challengeController.js';
import {
  getFumigationReport,
  exportFumigationReportExcel,
  getDashboardStats,
  resetDatabaseSeed,
} from '../controllers/reportController.js';

const router = Router();

// Warehouses
router.get('/warehouses', getWarehouses);
router.get('/warehouses/:id', getWarehouseById);
router.post('/warehouses', createWarehouse);
router.put('/warehouses/:id', updateWarehouse);

// Officers
router.get('/officers', getOfficers);
router.post('/officers', createOfficer);
router.put('/officers/:id', updateOfficer);

// Commodities
router.get('/commodities', getCommodities);
router.post('/commodities', createCommodity);
router.put('/commodities/:id', updateCommodity);

// Stacks
router.get('/stacks', getStacks);
router.get('/stacks/:id', getStackById);
router.post('/stacks', createStack);
router.put('/stacks/:id', updateStack);

// Fumigation Exercises
router.get('/fumigation-exercises', getExercises);
router.get('/fumigation-exercises/:id', getExerciseById);
router.post('/fumigation-exercises', createExercise);
router.put('/fumigation-exercises/:id', updateExercise);

// Challenges
router.get('/challenges', getChallenges);
router.post('/challenges', createChallenge);
router.post('/fumigation-exercises/:exerciseId/challenges', createChallenge);
router.put('/challenges/:id', updateChallenge);

// Reports & Dashboard
router.get('/reports/fumigation', getFumigationReport);
router.get('/reports/fumigation/excel', exportFumigationReportExcel);
router.get('/dashboard/stats', getDashboardStats);
router.post('/system/reset-seed', resetDatabaseSeed);

export default router;
