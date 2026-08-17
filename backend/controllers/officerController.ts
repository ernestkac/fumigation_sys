import type { Request, Response } from 'express';
import { dbManager } from '../db/db.js';
import type { Officer } from '../types/index.js';

export const getOfficers = async (req: Request, res: Response) => {
  try {
    const state = dbManager.getState();
    const activeOnly = req.query.active === 'true';

    let officers = [...state.officers];
    if (activeOnly) {
      officers = officers.filter((o) => o.is_active === 1);
    }

    res.json({ success: true, data: officers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch officers', error: (error as Error).message });
  }
};

export const createOfficer = async (req: Request, res: Response) => {
  try {
    const { employee_number, name, department, phone, is_active = 1 } = req.body;

    if (!employee_number || !name || !department) {
      return res.status(400).json({
        success: false,
        message: 'Employee number, name, and department are required.',
      });
    }

    const created = await dbManager.runTransaction((draft) => {
      const existing = draft.officers.find(
        (o) => o.employee_number.trim().toLowerCase() === employee_number.trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Officer with employee number '${employee_number}' already exists.`);
      }

      const now = dbManager.getNowTimestamp();
      const newOfficer: Officer = {
        id: draft.nextIds.officers++,
        employee_number: employee_number.trim().toUpperCase(),
        name: name.trim(),
        department: department.trim(),
        phone: phone ? phone.trim() : null,
        is_active: is_active ? 1 : 0,
        created_at: now,
        updated_at: now,
      };

      draft.officers.push(newOfficer);
      return newOfficer;
    });

    res.status(201).json({ success: true, message: 'Officer registered successfully', data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateOfficer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { employee_number, name, department, phone, is_active } = req.body;

    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.officers.findIndex((o) => o.id === id);
      if (idx === -1) {
        throw new Error('Officer not found');
      }

      if (employee_number) {
        const duplicate = draft.officers.find(
          (o) => o.id !== id && o.employee_number.trim().toLowerCase() === employee_number.trim().toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Employee number '${employee_number}' already belongs to another officer.`);
        }
        draft.officers[idx].employee_number = employee_number.trim().toUpperCase();
      }

      if (name) draft.officers[idx].name = name.trim();
      if (department) draft.officers[idx].department = department.trim();
      if (phone !== undefined) draft.officers[idx].phone = phone ? phone.trim() : null;
      if (is_active !== undefined) draft.officers[idx].is_active = is_active ? 1 : 0;
      draft.officers[idx].updated_at = dbManager.getNowTimestamp();

      return draft.officers[idx];
    });

    res.json({ success: true, message: 'Officer updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
