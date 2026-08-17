import type { Request, Response } from 'express';
import { dbManager } from '../db/db.js';
import { generateFumigationExcelWorkbook, type FilteredReportData } from '../services/excelReportService.js';
import type { FumigationExercise, ReportFilterParams } from '../types/index.js';

export function buildFilteredReportData(params: ReportFilterParams): FilteredReportData {
  const state = dbManager.getState();
  const {
    startDate,
    endDate,
    dateType = 'planned',
    warehouseId,
    officerId,
    commodityId,
    status,
    stackNumber,
    search,
  } = params;

  let exercises = [...state.fumigation_exercises];

  // Filter by Warehouse
  if (warehouseId) {
    const wId = Number(warehouseId);
    exercises = exercises.filter((e) => e.warehouse_id === wId);
  }

  // Filter by Officer
  if (officerId) {
    const oId = Number(officerId);
    exercises = exercises.filter((e) => e.responsible_officer_id === oId);
  }

  // Filter by Status
  if (status) {
    exercises = exercises.filter((e) => e.status.toLowerCase() === String(status).toLowerCase());
  }

  // Filter by Date Period (Planned vs Actual)
  if (startDate) {
    exercises = exercises.filter((e) => {
      const d = dateType === 'actual' ? e.actual_fumigation_date : e.planned_fumigation_date;
      return d ? d >= startDate : false;
    });
  }

  if (endDate) {
    exercises = exercises.filter((e) => {
      const d = dateType === 'actual' ? e.actual_fumigation_date : e.planned_fumigation_date;
      return d ? d <= endDate : false;
    });
  }

  // Filter by Commodity (matching exercises that include stacks with this commodity)
  if (commodityId) {
    const cId = Number(commodityId);
    const exIdsWithCommodity = new Set(
      state.fumigation_exercise_stacks
        .filter((s) => s.commodity_id === cId)
        .map((s) => s.fumigation_exercise_id)
    );
    exercises = exercises.filter((e) => exIdsWithCommodity.has(e.id));
  }

  // Filter by Stack Number
  if (stackNumber) {
    const sNum = String(stackNumber).trim().toLowerCase();
    const exIdsWithStack = new Set(
      state.fumigation_exercise_stacks
        .filter((s) => s.stack_number_snapshot.toLowerCase().includes(sNum))
        .map((s) => s.fumigation_exercise_id)
    );
    exercises = exercises.filter((e) => exIdsWithStack.has(e.id));
  }

  // General Search
  if (search) {
    const q = String(search).trim().toLowerCase();
    exercises = exercises.filter((e) => {
      const numMatch = e.exercise_number.toLowerCase().includes(q);
      const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
      const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
      const wMatch = warehouse ? warehouse.warehouse_name.toLowerCase().includes(q) || warehouse.warehouse_code.toLowerCase().includes(q) : false;
      const oMatch = officer ? officer.name.toLowerCase().includes(q) : false;
      return numMatch || wMatch || oMatch;
    });
  }

  // Enrich exercises with warehouse, officer, and snapshots
  const enrichedExercises: FumigationExercise[] = exercises.map((e) => {
    const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
    const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
    let snapshots = state.fumigation_exercise_stacks.filter((s) => s.fumigation_exercise_id === e.id);

    // If commodity filter is active, only show relevant stacks if desired, or keep all
    if (commodityId) {
      snapshots = snapshots.filter((s) => s.commodity_id === Number(commodityId));
    }
    if (stackNumber) {
      snapshots = snapshots.filter((s) => s.stack_number_snapshot.toLowerCase().includes(String(stackNumber).toLowerCase()));
    }

    const challenges = state.fumigation_challenges.filter((c) => c.fumigation_exercise_id === e.id);

    const unitMap = new Map<string, number>();
    let totalQty = 0;
    snapshots.forEach((s) => {
      totalQty += Number(s.quantity_snapshot);
      unitMap.set(s.unit_snapshot, (unitMap.get(s.unit_snapshot) || 0) + Number(s.quantity_snapshot));
    });

    return {
      ...e,
      warehouse_name: warehouse?.warehouse_name || 'Unknown Warehouse',
      warehouse_code: warehouse?.warehouse_code || 'N/A',
      officer_name: officer?.name || 'Unknown Officer',
      officer_department: officer?.department || 'N/A',
      stacks: snapshots,
      stacks_count: snapshots.length,
      total_quantity: totalQty,
      unit_breakdown: Array.from(unitMap.entries()).map(([unit, total_quantity]) => ({ unit, total_quantity })),
      challenges,
    };
  });

  // Calculate aggregates for summary
  const statusCounts: Record<string, number> = {
    Completed: 0,
    Planned: 0,
    'In Progress': 0,
    Postponed: 0,
    Cancelled: 0,
  };

  let totalStacksFumigated = 0;
  const globalUnitTotals = new Map<string, number>();

  // Warehouse breakdown map
  const whSummaryMap = new Map<
    number,
    {
      warehouse_name: string;
      exercises_count: number;
      stacks_count: number;
      quantities: Map<string, number>;
    }
  >();

  // Commodity breakdown map
  const commoditySummaryMap = new Map<
    string,
    {
      commodity_name: string;
      unit: string;
      total_quantity: number;
      stacks_count: number;
    }
  >();

  enrichedExercises.forEach((ex) => {
    statusCounts[ex.status] = (statusCounts[ex.status] || 0) + 1;

    // Warehouse summary accumulator
    if (!whSummaryMap.has(ex.warehouse_id)) {
      whSummaryMap.set(ex.warehouse_id, {
        warehouse_name: ex.warehouse_name || 'Warehouse',
        exercises_count: 0,
        stacks_count: 0,
        quantities: new Map<string, number>(),
      });
    }
    const whEntry = whSummaryMap.get(ex.warehouse_id)!;
    whEntry.exercises_count += 1;

    (ex.stacks || []).forEach((snap) => {
      totalStacksFumigated += 1;
      whEntry.stacks_count += 1;

      const qty = Number(snap.quantity_snapshot);
      const unit = snap.unit_snapshot;

      // Warehouse quantities
      whEntry.quantities.set(unit, (whEntry.quantities.get(unit) || 0) + qty);

      // Global quantities by unit
      globalUnitTotals.set(unit, (globalUnitTotals.get(unit) || 0) + qty);

      // Commodity map
      const commKey = `${snap.commodity_name_snapshot}_${unit}`;
      if (!commoditySummaryMap.has(commKey)) {
        commoditySummaryMap.set(commKey, {
          commodity_name: snap.commodity_name_snapshot,
          unit,
          total_quantity: 0,
          stacks_count: 0,
        });
      }
      const commEntry = commoditySummaryMap.get(commKey)!;
      commEntry.total_quantity += qty;
      commEntry.stacks_count += 1;
    });
  });

  const warehouseSummaries = Array.from(whSummaryMap.values()).map((wh) => ({
    warehouse_name: wh.warehouse_name,
    exercises_count: wh.exercises_count,
    stacks_count: wh.stacks_count,
    quantitiesByUnit: Array.from(wh.quantities.entries()).map(([unit, total]) => ({ unit, total })),
  }));

  const commoditySummaries = Array.from(commoditySummaryMap.values());
  const totalQuantitiesByUnit = Array.from(globalUnitTotals.entries()).map(([unit, total]) => ({ unit, total }));

  const reportingPeriodText =
    startDate && endDate
      ? `${startDate} to ${endDate} (${dateType === 'actual' ? 'Actual Date' : 'Planned Date'})`
      : startDate
      ? `From ${startDate}`
      : endDate
      ? `Up to ${endDate}`
      : 'All Historical Dates';

  return {
    exercises: enrichedExercises,
    filters: params,
    reportingPeriodText,
    summary: {
      totalExercises: enrichedExercises.length,
      totalStacksFumigated,
      statusCounts,
      warehouseSummaries,
      commoditySummaries,
      totalQuantitiesByUnit,
    },
  };
}

export const getFumigationReport = async (req: Request, res: Response) => {
  try {
    const params: ReportFilterParams = {
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      dateType: (req.query.dateType as 'planned' | 'actual') || 'planned',
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
      officerId: req.query.officerId ? Number(req.query.officerId) : undefined,
      commodityId: req.query.commodityId ? Number(req.query.commodityId) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      stackNumber: req.query.stackNumber ? String(req.query.stackNumber) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
    };

    const report = buildFilteredReportData(params);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate report', error: (error as Error).message });
  }
};

export const exportFumigationReportExcel = async (req: Request, res: Response) => {
  try {
    const params: ReportFilterParams = {
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      dateType: (req.query.dateType as 'planned' | 'actual') || 'planned',
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
      officerId: req.query.officerId ? Number(req.query.officerId) : undefined,
      commodityId: req.query.commodityId ? Number(req.query.commodityId) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      stackNumber: req.query.stackNumber ? String(req.query.stackNumber) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
    };

    const reportData = buildFilteredReportData(params);
    const workbook = await generateFumigationExcelWorkbook(reportData);

    const fromDateStr = params.startDate || 'all';
    const toDateStr = params.endDate || 'all';
    const filename = `Fumigation_Report_${fromDateStr}_to_${toDateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Excel report file', error: (error as Error).message });
  }
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const state = dbManager.getState();

    const totalWarehouses = state.warehouses.filter((w) => w.is_active === 1).length;
    const totalActiveStacks = state.stacks.filter((s) => s.status === 'Active').length;

    const plannedExercises = state.fumigation_exercises.filter((e) => e.status === 'Planned').length;
    const completedExercises = state.fumigation_exercises.filter((e) => e.status === 'Completed').length;
    const inProgressExercises = state.fumigation_exercises.filter((e) => e.status === 'In Progress').length;
    const postponedExercises = state.fumigation_exercises.filter((e) => e.status === 'Postponed').length;

    // Total stacks fumigated & commodity coverage
    const totalStacksFumigated = state.fumigation_exercise_stacks.length;
    const quantitiesByUnit = new Map<string, number>();
    state.fumigation_exercise_stacks.forEach((snap) => {
      quantitiesByUnit.set(
        snap.unit_snapshot,
        (quantitiesByUnit.get(snap.unit_snapshot) || 0) + Number(snap.quantity_snapshot)
      );
    });

    // Upcoming fumigation exercises (sorted by planned date)
    const upcoming = state.fumigation_exercises
      .filter((e) => e.status === 'Planned' || e.status === 'In Progress')
      .map((e) => {
        const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
        const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
        const stackCount = state.fumigation_exercise_stacks.filter((s) => s.fumigation_exercise_id === e.id).length;
        return {
          id: e.id,
          exercise_number: e.exercise_number,
          warehouse_name: warehouse?.warehouse_name || 'N/A',
          planned_date: e.planned_fumigation_date,
          duration: e.planned_duration,
          officer_name: officer?.name || 'N/A',
          stacks_count: stackCount,
          status: e.status,
        };
      })
      .sort((a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime())
      .slice(0, 5);

    // Recent challenges
    const recentChallenges = state.fumigation_challenges
      .map((c) => {
        const ex = state.fumigation_exercises.find((e) => e.id === c.fumigation_exercise_id);
        const wh = ex ? state.warehouses.find((w) => w.id === ex.warehouse_id) : null;
        return {
          id: c.id,
          exercise_number: ex?.exercise_number || 'N/A',
          warehouse_name: wh?.warehouse_name || 'N/A',
          category: c.challenge_category,
          description: c.description,
          resolved: c.resolved,
          created_at: c.created_at,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalWarehouses,
        totalActiveStacks,
        plannedExercises,
        completedExercises,
        inProgressExercises,
        postponedExercises,
        totalStacksFumigated,
        totalQuantityCovered: Array.from(quantitiesByUnit.entries()).map(([unit, total]) => ({ unit, total })),
        upcomingExercises: upcoming,
        recentChallenges,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

export const resetDatabaseSeed = async (_req: Request, res: Response) => {
  try {
    dbManager.resetToDefaultSeeds();
    res.json({ success: true, message: 'Database reset to default seed data successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset database' });
  }
};
