import type { Request, Response } from 'express';
import { dbManager } from '../db/db.js';
import type { Stack, StackStatus } from '../types/index.js';

export const getStacks = async (req: Request, res: Response) => {
  try {
    const state = dbManager.getState();
    const { warehouse_id, commodity_id, status, search, active_only } = req.query;

    let stacks = [...state.stacks];

    if (warehouse_id) {
      const wId = Number(warehouse_id);
      stacks = stacks.filter((s) => s.warehouse_id === wId);
    }

    if (commodity_id) {
      const cId = Number(commodity_id);
      stacks = stacks.filter((s) => s.commodity_id === cId);
    }

    if (status) {
      stacks = stacks.filter((s) => s.status.toLowerCase() === String(status).toLowerCase());
    }

    if (active_only === 'true') {
      stacks = stacks.filter((s) => s.status === 'Active');
    }

    if (search) {
      const q = String(search).trim().toLowerCase();
      stacks = stacks.filter((s) => {
        const stackNumMatch = s.stack_number.toLowerCase().includes(q);
        const warehouse = state.warehouses.find((w) => w.id === s.warehouse_id);
        const commodity = state.commodities.find((c) => c.id === s.commodity_id);
        const warehouseMatch = warehouse ? warehouse.warehouse_name.toLowerCase().includes(q) || warehouse.warehouse_code.toLowerCase().includes(q) : false;
        const commodityMatch = commodity ? commodity.commodity_name.toLowerCase().includes(q) : false;
        return stackNumMatch || warehouseMatch || commodityMatch;
      });
    }

    // Join warehouse and commodity info
    const enriched = stacks.map((s) => {
      const warehouse = state.warehouses.find((w) => w.id === s.warehouse_id);
      const commodity = state.commodities.find((c) => c.id === s.commodity_id);
      return {
        ...s,
        warehouse_name: warehouse?.warehouse_name || 'Unknown Warehouse',
        warehouse_code: warehouse?.warehouse_code || 'N/A',
        commodity_name: commodity?.commodity_name || 'Unknown Commodity',
      };
    });

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stacks', error: (error as Error).message });
  }
};

export const getStackById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const state = dbManager.getState();
    const stack = state.stacks.find((s) => s.id === id);

    if (!stack) {
      return res.status(404).json({ success: false, message: 'Stack not found' });
    }

    const warehouse = state.warehouses.find((w) => w.id === stack.warehouse_id);
    const commodity = state.commodities.find((c) => c.id === stack.commodity_id);

    // Also fetch historical fumigation snapshots for this stack
    const history = state.fumigation_exercise_stacks
      .filter((fes) => fes.stack_id === stack.id)
      .map((fes) => {
        const exercise = state.fumigation_exercises.find((fe) => fe.id === fes.fumigation_exercise_id);
        return {
          ...fes,
          exercise_number: exercise?.exercise_number,
          planned_date: exercise?.planned_fumigation_date,
          actual_date: exercise?.actual_fumigation_date,
          exercise_status: exercise?.status,
        };
      });

    res.json({
      success: true,
      data: {
        ...stack,
        warehouse_name: warehouse?.warehouse_name,
        warehouse_code: warehouse?.warehouse_code,
        commodity_name: commodity?.commodity_name,
        fumigation_history: history,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stack details' });
  }
};

export const createStack = async (req: Request, res: Response) => {
  try {
    const { warehouse_id, stack_number, commodity_id, current_quantity, unit, status = 'Active' } = req.body;

    if (!warehouse_id || !stack_number || !commodity_id || current_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse, stack number, commodity, and quantity are required.',
      });
    }

    const parsedWarehouseId = Number(warehouse_id);
    const parsedCommodityId = Number(commodity_id);
    const parsedQty = Number(current_quantity);

    if (isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a valid positive number or zero.' });
    }

    const created = await dbManager.runTransaction((draft) => {
      // Validate warehouse exists
      const warehouse = draft.warehouses.find((w) => w.id === parsedWarehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse with ID ${parsedWarehouseId} does not exist.`);
      }

      // Validate commodity exists
      const commodity = draft.commodities.find((c) => c.id === parsedCommodityId);
      if (!commodity) {
        throw new Error(`Commodity with ID ${parsedCommodityId} does not exist.`);
      }

      // Check unique (warehouse_id, stack_number)
      const existing = draft.stacks.find(
        (s) =>
          s.warehouse_id === parsedWarehouseId &&
          s.stack_number.trim().toLowerCase() === String(stack_number).trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Stack number '${stack_number}' already exists in warehouse '${warehouse.warehouse_name}'.`);
      }

      const now = dbManager.getNowTimestamp();
      const newStack: Stack = {
        id: draft.nextIds.stacks++,
        warehouse_id: parsedWarehouseId,
        stack_number: String(stack_number).trim().toUpperCase(),
        commodity_id: parsedCommodityId,
        current_quantity: parsedQty,
        unit: unit ? String(unit).trim() : commodity.default_unit,
        status: (status as StackStatus) || 'Active',
        created_at: now,
        updated_at: now,
      };

      draft.stacks.push(newStack);
      return {
        ...newStack,
        warehouse_name: warehouse.warehouse_name,
        warehouse_code: warehouse.warehouse_code,
        commodity_name: commodity.commodity_name,
      };
    });

    res.status(201).json({ success: true, message: 'Stack created successfully', data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateStack = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { stack_number, commodity_id, current_quantity, unit, status } = req.body;

    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.stacks.findIndex((s) => s.id === id);
      if (idx === -1) {
        throw new Error('Stack not found');
      }

      const currentStack = draft.stacks[idx];

      if (stack_number) {
        const cleanNumber = String(stack_number).trim().toUpperCase();
        const duplicate = draft.stacks.find(
          (s) => s.id !== id && s.warehouse_id === currentStack.warehouse_id && s.stack_number.toLowerCase() === cleanNumber.toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Stack number '${cleanNumber}' already exists in this warehouse.`);
        }
        draft.stacks[idx].stack_number = cleanNumber;
      }

      if (commodity_id) {
        const cId = Number(commodity_id);
        const comm = draft.commodities.find((c) => c.id === cId);
        if (!comm) throw new Error(`Commodity with ID ${cId} not found.`);
        draft.stacks[idx].commodity_id = cId;
      }

      if (current_quantity !== undefined) {
        const q = Number(current_quantity);
        if (isNaN(q) || q < 0) throw new Error('Quantity must be a valid number >= 0.');
        draft.stacks[idx].current_quantity = q;
      }

      if (unit) draft.stacks[idx].unit = String(unit).trim();
      if (status) draft.stacks[idx].status = status as StackStatus;
      draft.stacks[idx].updated_at = dbManager.getNowTimestamp();

      const warehouse = draft.warehouses.find((w) => w.id === draft.stacks[idx].warehouse_id);
      const commodity = draft.commodities.find((c) => c.id === draft.stacks[idx].commodity_id);

      return {
        ...draft.stacks[idx],
        warehouse_name: warehouse?.warehouse_name,
        warehouse_code: warehouse?.warehouse_code,
        commodity_name: commodity?.commodity_name,
      };
    });

    res.json({ success: true, message: 'Stack updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
