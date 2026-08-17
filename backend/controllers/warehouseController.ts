import type { Request, Response } from 'express';
import { dbManager } from '../db/db.js';
import type { Warehouse } from '../types/index.js';

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const state = dbManager.getState();
    const activeOnly = req.query.active === 'true';

    let warehouses = [...state.warehouses];
    if (activeOnly) {
      warehouses = warehouses.filter((w) => w.is_active === 1);
    }

    // Attach computed counts
    const enriched = warehouses.map((w) => {
      const warehouseStacks = state.stacks.filter((s) => s.warehouse_id === w.id);
      const activeStacks = warehouseStacks.filter((s) => s.status === 'Active');
      return {
        ...w,
        total_stacks: warehouseStacks.length,
        active_stacks: activeStacks.length,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch warehouses', error: (error as Error).message });
  }
};

export const getWarehouseById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const state = dbManager.getState();
    const warehouse = state.warehouses.find((w) => w.id === id);

    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const warehouseStacks = state.stacks.filter((s) => s.warehouse_id === warehouse.id);
    res.json({
      success: true,
      data: {
        ...warehouse,
        stacks: warehouseStacks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving warehouse' });
  }
};

export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const { warehouse_code, warehouse_name, location, is_active = 1 } = req.body;

    if (!warehouse_code || !warehouse_name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse code, warehouse name, and location are required.',
      });
    }

    const created = await dbManager.runTransaction((draft) => {
      // Check unique code
      const existing = draft.warehouses.find(
        (w) => w.warehouse_code.trim().toLowerCase() === warehouse_code.trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Warehouse code '${warehouse_code}' is already registered.`);
      }

      const now = dbManager.getNowTimestamp();
      const newWarehouse: Warehouse = {
        id: draft.nextIds.warehouses++,
        warehouse_code: warehouse_code.trim().toUpperCase(),
        warehouse_name: warehouse_name.trim(),
        location: location.trim(),
        is_active: is_active ? 1 : 0,
        created_at: now,
        updated_at: now,
      };

      draft.warehouses.push(newWarehouse);
      return newWarehouse;
    });

    res.status(201).json({ success: true, message: 'Warehouse registered successfully', data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { warehouse_code, warehouse_name, location, is_active } = req.body;

    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.warehouses.findIndex((w) => w.id === id);
      if (idx === -1) {
        throw new Error('Warehouse not found');
      }

      if (warehouse_code) {
        const duplicate = draft.warehouses.find(
          (w) => w.id !== id && w.warehouse_code.trim().toLowerCase() === warehouse_code.trim().toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Warehouse code '${warehouse_code}' is already in use by another warehouse.`);
        }
        draft.warehouses[idx].warehouse_code = warehouse_code.trim().toUpperCase();
      }

      if (warehouse_name) draft.warehouses[idx].warehouse_name = warehouse_name.trim();
      if (location) draft.warehouses[idx].location = location.trim();
      if (is_active !== undefined) draft.warehouses[idx].is_active = is_active ? 1 : 0;
      draft.warehouses[idx].updated_at = dbManager.getNowTimestamp();

      return draft.warehouses[idx];
    });

    res.json({ success: true, message: 'Warehouse updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
