import type { Request, Response } from 'express';
import { dbManager } from '../db/db.js';
import type { FumigationChallenge } from '../types/index.js';

export const getChallenges = async (req: Request, res: Response) => {
  try {
    const state = dbManager.getState();
    const { exercise_id, category, resolved } = req.query;

    let challenges = [...state.fumigation_challenges];

    if (exercise_id) {
      const exId = Number(exercise_id);
      challenges = challenges.filter((c) => c.fumigation_exercise_id === exId);
    }

    if (category) {
      challenges = challenges.filter((c) => c.challenge_category.toLowerCase() === String(category).toLowerCase());
    }

    if (resolved !== undefined) {
      const isResolved = resolved === 'true' || resolved === '1' ? 1 : 0;
      challenges = challenges.filter((c) => c.resolved === isResolved);
    }

    // Join exercise details
    const enriched = challenges.map((c) => {
      const exercise = state.fumigation_exercises.find((e) => e.id === c.fumigation_exercise_id);
      const warehouse = exercise ? state.warehouses.find((w) => w.id === exercise.warehouse_id) : null;
      return {
        ...c,
        exercise_number: exercise?.exercise_number || 'N/A',
        warehouse_name: warehouse?.warehouse_name || 'N/A',
        planned_fumigation_date: exercise?.planned_fumigation_date,
      };
    });

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch challenges', error: (error as Error).message });
  }
};

export const createChallenge = async (req: Request, res: Response) => {
  try {
    const exerciseId = Number(req.params.exerciseId || req.body.fumigation_exercise_id);
    const { challenge_category, description, action_resolution, resolved, resolution_date } = req.body;

    if (!exerciseId) {
      return res.status(400).json({ success: false, message: 'Fumigation exercise ID is required.' });
    }
    if (!challenge_category || !description) {
      return res.status(400).json({ success: false, message: 'Category and description are required.' });
    }

    const created = await dbManager.runTransaction((draft) => {
      const exercise = draft.fumigation_exercises.find((e) => e.id === exerciseId);
      if (!exercise) {
        throw new Error(`Fumigation exercise with ID ${exerciseId} does not exist.`);
      }

      const now = dbManager.getNowTimestamp();
      const isRes = resolved ? 1 : 0;
      const resDate = isRes && resolution_date ? String(resolution_date).split('T')[0] : isRes ? now.split(' ')[0] : null;

      const newChallenge: FumigationChallenge = {
        id: draft.nextIds.fumigation_challenges++,
        fumigation_exercise_id: exerciseId,
        challenge_category: String(challenge_category).trim(),
        description: String(description).trim(),
        action_resolution: action_resolution ? String(action_resolution).trim() : null,
        resolved: isRes,
        resolution_date: resDate,
        created_at: now,
        updated_at: now,
      };

      draft.fumigation_challenges.push(newChallenge);

      const warehouse = draft.warehouses.find((w) => w.id === exercise.warehouse_id);
      return {
        ...newChallenge,
        exercise_number: exercise.exercise_number,
        warehouse_name: warehouse?.warehouse_name,
        planned_fumigation_date: exercise.planned_fumigation_date,
      };
    });

    res.status(201).json({ success: true, message: 'Challenge recorded successfully', data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const updateChallenge = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { challenge_category, description, action_resolution, resolved, resolution_date } = req.body;

    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.fumigation_challenges.findIndex((c) => c.id === id);
      if (idx === -1) {
        throw new Error('Challenge not found');
      }

      if (challenge_category) draft.fumigation_challenges[idx].challenge_category = String(challenge_category).trim();
      if (description) draft.fumigation_challenges[idx].description = String(description).trim();
      if (action_resolution !== undefined) {
        draft.fumigation_challenges[idx].action_resolution = action_resolution ? String(action_resolution).trim() : null;
      }

      if (resolved !== undefined) {
        const isRes = resolved ? 1 : 0;
        draft.fumigation_challenges[idx].resolved = isRes;
        if (isRes) {
          draft.fumigation_challenges[idx].resolution_date = resolution_date
            ? String(resolution_date).split('T')[0]
            : draft.fumigation_challenges[idx].resolution_date || dbManager.getNowTimestamp().split(' ')[0];
        } else {
          draft.fumigation_challenges[idx].resolution_date = null;
        }
      }

      draft.fumigation_challenges[idx].updated_at = dbManager.getNowTimestamp();
      return draft.fumigation_challenges[idx];
    });

    res.json({ success: true, message: 'Challenge updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
