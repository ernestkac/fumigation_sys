import type { Request, Response } from 'express';
import { dbManager } from '../db/db.js';
import type { Commodity } from '../types/index.js';

export const getCommodities = async (req: Request, res: Response) => {
  try {
    const state = dbManager.getState();
    const activeOnly = req.query.active === 'true';

    let commodities = [...state.commodities];
    if (activeOnly) {
      commodities = commodities.filter((c) => c.is_active === 1);
    }

    res.json({ success: true, data: commodities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch commodities', error: (error as Error).message });
  }
};

export const createCommodity = async (req: Request, res: Response) => {
  try {
    const { commodity_name, default_unit = 'Bags (50kg)', is_active = 1 } = req.body;

    if (!commodity_name) {
      return res.status(400).json({
        success: false,
        message: 'Commodity name is required.',
      });
    }

    const created = await dbManager.runTransaction((draft) => {
      const existing = draft.commodities.find(
        (c) => c.commodity_name.trim().toLowerCase() === commodity_name.trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Commodity '${commodity_name}' already exists.`);
      }

      const now = dbManager.getNowTimestamp();
      const newCommodity: Commodity = {
        id: draft.nextIds.commodities++,
        commodity_name: commodity_name.trim(),
        default_unit: default_unit.trim(),
        is_active: is_active ? 1 : 0,
        created_at: now,
        updated_at: now,
      };

      draft.commodities.push(newCommodity);
      return newCommodity;
    });

    res.status(201).json({ success: true, message: 'Commodity registered successfully', data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateCommodity = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { commodity_name, default_unit, is_active } = req.body;

    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.commodities.findIndex((c) => c.id === id);
      if (idx === -1) {
        throw new Error('Commodity not found');
      }

      if (commodity_name) {
        const duplicate = draft.commodities.find(
          (c) => c.id !== id && c.commodity_name.trim().toLowerCase() === commodity_name.trim().toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Commodity name '${commodity_name}' already exists.`);
        }
        draft.commodities[idx].commodity_name = commodity_name.trim();
      }

      if (default_unit) draft.commodities[idx].default_unit = default_unit.trim();
      if (is_active !== undefined) draft.commodities[idx].is_active = is_active ? 1 : 0;
      draft.commodities[idx].updated_at = dbManager.getNowTimestamp();

      return draft.commodities[idx];
    });

    res.json({ success: true, message: 'Commodity updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
