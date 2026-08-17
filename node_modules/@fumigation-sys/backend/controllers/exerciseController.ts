import type { Request, Response } from 'express';
import { dbManager } from '../db/db.js';
import type {
  FumigationExercise,
  FumigationExerciseStackSnapshot,
  ExerciseStatus,
} from '../types/index.js';

export const getExercises = async (req: Request, res: Response) => {
  try {
    const state = dbManager.getState();
    const {
      warehouse_id,
      officer_id,
      status,
      search,
      start_date,
      end_date,
      date_type = 'planned',
    } = req.query;

    let exercises = [...state.fumigation_exercises];

    if (warehouse_id) {
      const wId = Number(warehouse_id);
      exercises = exercises.filter((e) => e.warehouse_id === wId);
    }

    if (officer_id) {
      const oId = Number(officer_id);
      exercises = exercises.filter((e) => e.responsible_officer_id === oId);
    }

    if (status) {
      exercises = exercises.filter((e) => e.status.toLowerCase() === String(status).toLowerCase());
    }

    if (start_date) {
      const start = String(start_date);
      exercises = exercises.filter((e) => {
        const d = date_type === 'actual' ? e.actual_fumigation_date : e.planned_fumigation_date;
        return d ? d >= start : false;
      });
    }

    if (end_date) {
      const end = String(end_date);
      exercises = exercises.filter((e) => {
        const d = date_type === 'actual' ? e.actual_fumigation_date : e.planned_fumigation_date;
        return d ? d <= end : false;
      });
    }

    if (search) {
      const q = String(search).trim().toLowerCase();
      exercises = exercises.filter((e) => {
        const numMatch = e.exercise_number.toLowerCase().includes(q);
        const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
        const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
        const remarksMatch = e.remarks ? e.remarks.toLowerCase().includes(q) : false;
        const wMatch = warehouse ? warehouse.warehouse_name.toLowerCase().includes(q) || warehouse.warehouse_code.toLowerCase().includes(q) : false;
        const oMatch = officer ? officer.name.toLowerCase().includes(q) : false;
        return numMatch || remarksMatch || wMatch || oMatch;
      });
    }

    // Enrich exercises with warehouse, officer, stack snapshots count, total quantity, and challenges
    const enriched = exercises.map((e) => {
      const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
      const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
      const snapshots = state.fumigation_exercise_stacks.filter((s) => s.fumigation_exercise_id === e.id);
      const challenges = state.fumigation_challenges.filter((c) => c.fumigation_exercise_id === e.id);

      // Calculate unit breakdown
      const unitMap = new Map<string, number>();
      let totalQty = 0;
      snapshots.forEach((s) => {
        totalQty += Number(s.quantity_snapshot);
        unitMap.set(s.unit_snapshot, (unitMap.get(s.unit_snapshot) || 0) + Number(s.quantity_snapshot));
      });

      const unit_breakdown = Array.from(unitMap.entries()).map(([unit, total_quantity]) => ({
        unit,
        total_quantity,
      }));

      return {
        ...e,
        warehouse_name: warehouse?.warehouse_name || 'Unknown Warehouse',
        warehouse_code: warehouse?.warehouse_code || 'N/A',
        officer_name: officer?.name || 'Unknown Officer',
        officer_department: officer?.department || 'N/A',
        stacks_count: snapshots.length,
        total_quantity: totalQty,
        unit_breakdown,
        challenges_count: challenges.length,
        unresolved_challenges: challenges.filter((c) => !c.resolved).length,
      };
    });

    // Sort by planned_fumigation_date descending
    enriched.sort((a, b) => new Date(b.planned_fumigation_date).getTime() - new Date(a.planned_fumigation_date).getTime());

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch fumigation exercises', error: (error as Error).message });
  }
};

export const getExerciseById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const state = dbManager.getState();
    const exercise = state.fumigation_exercises.find((e) => e.id === id);

    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Fumigation exercise not found' });
    }

    const warehouse = state.warehouses.find((w) => w.id === exercise.warehouse_id);
    const officer = state.officers.find((o) => o.id === exercise.responsible_officer_id);

    // Fetch snapshot records and compare against current stack status/quantity for transparency
    const snapshots = state.fumigation_exercise_stacks
      .filter((s) => s.fumigation_exercise_id === exercise.id)
      .map((snap) => {
        const currentStack = state.stacks.find((st) => st.id === snap.stack_id);
        return {
          ...snap,
          current_stack_quantity: currentStack?.current_quantity,
          current_stack_status: currentStack?.status,
        };
      });

    const challenges = state.fumigation_challenges.filter((c) => c.fumigation_exercise_id === exercise.id);

    const unitMap = new Map<string, number>();
    let totalQty = 0;
    snapshots.forEach((s) => {
      totalQty += Number(s.quantity_snapshot);
      unitMap.set(s.unit_snapshot, (unitMap.get(s.unit_snapshot) || 0) + Number(s.quantity_snapshot));
    });

    const unit_breakdown = Array.from(unitMap.entries()).map(([unit, total_quantity]) => ({
      unit,
      total_quantity,
    }));

    res.json({
      success: true,
      data: {
        ...exercise,
        warehouse_name: warehouse?.warehouse_name,
        warehouse_code: warehouse?.warehouse_code,
        officer_name: officer?.name,
        officer_department: officer?.department,
        stacks: snapshots,
        challenges,
        stacks_count: snapshots.length,
        total_quantity: totalQty,
        unit_breakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exercise details' });
  }
};

export const createExercise = async (req: Request, res: Response) => {
  try {
    const {
      exercise_number,
      warehouse_id,
      planned_fumigation_date,
      planned_duration,
      responsible_officer_id,
      remarks,
      stack_ids, // array of numbers
    } = req.body;

    // 1. Mandatory Validations
    if (!warehouse_id) {
      return res.status(400).json({ success: false, message: 'Warehouse selection is required.' });
    }
    if (!planned_fumigation_date) {
      return res.status(400).json({ success: false, message: 'Planned fumigation date is required.' });
    }
    if (!responsible_officer_id) {
      return res.status(400).json({ success: false, message: 'Responsible officer is required.' });
    }
    const duration = Number(planned_duration);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ success: false, message: 'Planned duration must be greater than zero.' });
    }
    if (!Array.isArray(stack_ids) || stack_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one stack must be selected for fumigation.' });
    }

    const uniqueStackIds = Array.from(new Set(stack_ids.map(Number)));
    if (uniqueStackIds.length !== stack_ids.length) {
      return res.status(400).json({ success: false, message: 'A stack cannot be selected more than once in the same exercise.' });
    }

    // 2. Atomic Transaction for Exercise + Snapshots
    const result = await dbManager.runTransaction((draft) => {
      const warehouseId = Number(warehouse_id);
      const officerId = Number(responsible_officer_id);

      // Verify warehouse exists and active
      const warehouse = draft.warehouses.find((w) => w.id === warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse with ID ${warehouseId} not found.`);
      }

      // Verify officer exists
      const officer = draft.officers.find((o) => o.id === officerId);
      if (!officer) {
        throw new Error(`Officer with ID ${officerId} not found.`);
      }

      // Determine exercise number
      let finalExNumber = exercise_number ? String(exercise_number).trim().toUpperCase() : '';
      if (!finalExNumber) {
        const year = new Date(planned_fumigation_date).getFullYear() || 2026;
        const count = draft.fumigation_exercises.length + 1;
        finalExNumber = `FUM-${year}-${String(count).padStart(3, '0')}`;
      }

      // Check unique exercise number
      const existingEx = draft.fumigation_exercises.find(
        (e) => e.exercise_number.toLowerCase() === finalExNumber.toLowerCase()
      );
      if (existingEx) {
        throw new Error(`Fumigation Exercise Number '${finalExNumber}' already exists.`);
      }

      // Verify stacks belong to this warehouse & are available
      const stackSnapshotsToCreate: FumigationExerciseStackSnapshot[] = [];
      const now = dbManager.getNowTimestamp();
      const exerciseId = draft.nextIds.fumigation_exercises++;

      for (const sId of uniqueStackIds) {
        const stack = draft.stacks.find((s) => s.id === sId);
        if (!stack) {
          throw new Error(`Stack with ID ${sId} does not exist.`);
        }
        if (stack.warehouse_id !== warehouseId) {
          throw new Error(
            `Stack '${stack.stack_number}' belongs to a different warehouse and cannot be included in this exercise.`
          );
        }

        const commodity = draft.commodities.find((c) => c.id === stack.commodity_id);
        const commodityName = commodity ? commodity.commodity_name : 'Unknown Commodity';

        const snapshot: FumigationExerciseStackSnapshot = {
          id: draft.nextIds.fumigation_exercise_stacks++,
          fumigation_exercise_id: exerciseId,
          stack_id: stack.id,
          stack_number_snapshot: stack.stack_number,
          commodity_id: stack.commodity_id,
          commodity_name_snapshot: commodityName,
          quantity_snapshot: stack.current_quantity,
          unit_snapshot: stack.unit,
          created_at: now,
        };
        stackSnapshotsToCreate.push(snapshot);
      }

      const newExercise: FumigationExercise = {
        id: exerciseId,
        exercise_number: finalExNumber,
        warehouse_id: warehouseId,
        planned_fumigation_date: String(planned_fumigation_date).split('T')[0],
        actual_fumigation_date: null,
        planned_duration: duration,
        actual_duration: null,
        responsible_officer_id: officerId,
        status: 'Planned',
        remarks: remarks ? String(remarks).trim() : null,
        created_at: now,
        updated_at: now,
      };

      draft.fumigation_exercises.push(newExercise);
      draft.fumigation_exercise_stacks.push(...stackSnapshotsToCreate);

      return {
        exercise: newExercise,
        snapshots: stackSnapshotsToCreate,
      };
    });

    res.status(201).json({
      success: true,
      message: `Fumigation exercise ${result.exercise.exercise_number} created with ${result.snapshots.length} stack snapshots.`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      planned_fumigation_date,
      actual_fumigation_date,
      planned_duration,
      actual_duration,
      responsible_officer_id,
      status,
      remarks,
    } = req.body;

    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.fumigation_exercises.findIndex((e) => e.id === id);
      if (idx === -1) {
        throw new Error('Fumigation exercise not found');
      }

      const current = draft.fumigation_exercises[idx];

      if (responsible_officer_id) {
        const offId = Number(responsible_officer_id);
        const officer = draft.officers.find((o) => o.id === offId);
        if (!officer) throw new Error(`Officer with ID ${offId} not found.`);
        draft.fumigation_exercises[idx].responsible_officer_id = offId;
      }

      if (planned_fumigation_date) {
        draft.fumigation_exercises[idx].planned_fumigation_date = String(planned_fumigation_date).split('T')[0];
      }

      if (planned_duration !== undefined) {
        const d = Number(planned_duration);
        if (isNaN(d) || d <= 0) throw new Error('Planned duration must be greater than 0.');
        draft.fumigation_exercises[idx].planned_duration = d;
      }

      if (actual_fumigation_date !== undefined) {
        draft.fumigation_exercises[idx].actual_fumigation_date = actual_fumigation_date
          ? String(actual_fumigation_date).split('T')[0]
          : null;
      }

      if (actual_duration !== undefined) {
        const ad = actual_duration !== null && actual_duration !== '' ? Number(actual_duration) : null;
        if (ad !== null && (isNaN(ad) || ad < 0)) throw new Error('Actual duration must be a valid number >= 0.');
        draft.fumigation_exercises[idx].actual_duration = ad;
      }

      if (status) {
        const s = status as ExerciseStatus;
        if (s === 'Completed' && !draft.fumigation_exercises[idx].actual_fumigation_date && !actual_fumigation_date) {
          // If marking completed, set actual date to planned date if not specified
          draft.fumigation_exercises[idx].actual_fumigation_date = draft.fumigation_exercises[idx].planned_fumigation_date;
        }
        if (s === 'Completed' && draft.fumigation_exercises[idx].actual_duration === null && actual_duration === undefined) {
          draft.fumigation_exercises[idx].actual_duration = draft.fumigation_exercises[idx].planned_duration;
        }
        draft.fumigation_exercises[idx].status = s;
      }

      if (remarks !== undefined) {
        draft.fumigation_exercises[idx].remarks = remarks ? String(remarks).trim() : null;
      }

      draft.fumigation_exercises[idx].updated_at = dbManager.getNowTimestamp();
      return draft.fumigation_exercises[idx];
    });

    res.json({ success: true, message: 'Fumigation exercise updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
