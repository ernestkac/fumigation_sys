import ExcelJS from 'exceljs';
import type { FumigationExercise, ReportFilterParams } from '../types/index.js';
import { dbManager } from '../db/db.js';

export interface FilteredReportData {
  exercises: FumigationExercise[];
  filters: ReportFilterParams;
  reportingPeriodText: string;
  summary: {
    totalExercises: number;
    totalStacksFumigated: number;
    statusCounts: Record<string, number>;
    warehouseSummaries: {
      warehouse_name: string;
      exercises_count: number;
      stacks_count: number;
      quantitiesByUnit: { unit: string; total: number }[];
    }[];
    commoditySummaries: {
      commodity_name: string;
      unit: string;
      total_quantity: number;
      stacks_count: number;
    }[];
    totalQuantitiesByUnit: { unit: string; total: number }[];
  };
}

export async function generateFumigationExcelWorkbook(reportData: FilteredReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fumigation Exercise Tracking System';
  workbook.created = new Date();

  // Colors & Styles Palette
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Navy
  };
  const subHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }, // Blue
  };
  const accentFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }, // Light Gray
  };
  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 11,
  };
  const regularFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 10,
  };
  const boldFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    bold: true,
    size: 10,
  };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  };

  // =========================================================================
  // WORKSHEET 1: Executive Fumigation Summary
  // =========================================================================
  const summarySheet = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: true }],
  });

  // Title
  summarySheet.mergeCells('A1:G1');
  const sumTitle = summarySheet.getCell('A1');
  sumTitle.value = 'FUMIGATION EXERCISE EXECUTIVE SUMMARY REPORT';
  sumTitle.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
  sumTitle.alignment = { vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  // Metadata block
  summarySheet.getCell('A3').value = 'Reporting Period:';
  summarySheet.getCell('B3').value = reportData.reportingPeriodText;
  summarySheet.getCell('A3').font = boldFont;

  summarySheet.getCell('A4').value = 'Generated On:';
  summarySheet.getCell('B4').value = new Date().toLocaleString();
  summarySheet.getCell('A4').font = boldFont;

  summarySheet.getCell('D3').value = 'Total Exercises:';
  summarySheet.getCell('E3').value = reportData.summary.totalExercises;
  summarySheet.getCell('D3').font = boldFont;

  summarySheet.getCell('D4').value = 'Total Stacks Fumigated:';
  summarySheet.getCell('E4').value = reportData.summary.totalStacksFumigated;
  summarySheet.getCell('D4').font = boldFont;

  // Key Metrics Table: Exercises by Status
  summarySheet.getCell('A6').value = 'EXERCISE STATUS BREAKDOWN';
  summarySheet.getCell('A6').font = { ...boldFont, size: 12, color: { argb: 'FF1E3A8A' } };

  summarySheet.getRow(7).values = ['Status', 'Count', 'Percentage of Total'];
  ['A7', 'B7', 'C7'].forEach((c) => {
    const cell = summarySheet.getCell(c);
    cell.fill = subHeaderFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' };
  });

  let sumRowIdx = 8;
  const statuses = ['Completed', 'Planned', 'In Progress', 'Postponed', 'Cancelled'];
  statuses.forEach((st) => {
    const count = reportData.summary.statusCounts[st] || 0;
    const pct = reportData.summary.totalExercises > 0 ? (count / reportData.summary.totalExercises) : 0;
    const row = summarySheet.getRow(sumRowIdx);
    row.values = [st, count, pct];
    row.getCell(2).numFmt = '#,##0';
    row.getCell(3).numFmt = '0.0%';
    ['A', 'B', 'C'].forEach((col) => {
      row.getCell(col).border = thinBorder;
      row.getCell(col).font = regularFont;
    });
    sumRowIdx++;
  });

  // Summary by Warehouse Table
  sumRowIdx += 2;
  summarySheet.getCell(`A${sumRowIdx}`).value = 'FUMIGATION BY WAREHOUSE SUMMARY';
  summarySheet.getCell(`A${sumRowIdx}`).font = { ...boldFont, size: 12, color: { argb: 'FF1E3A8A' } };
  sumRowIdx++;

  summarySheet.getRow(sumRowIdx).values = ['Warehouse', 'Total Exercises', 'Stacks Covered', 'Total Quantity by Unit'];
  ['A', 'B', 'C', 'D'].forEach((col) => {
    const cell = summarySheet.getCell(`${col}${sumRowIdx}`);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' };
  });
  sumRowIdx++;

  reportData.summary.warehouseSummaries.forEach((ws) => {
    const qtyStr = ws.quantitiesByUnit.map((q) => `${q.total.toLocaleString()} ${q.unit}`).join(', ') || '0';
    const row = summarySheet.getRow(sumRowIdx);
    row.values = [ws.warehouse_name, ws.exercises_count, ws.stacks_count, qtyStr];
    row.getCell(2).numFmt = '#,##0';
    row.getCell(3).numFmt = '#,##0';
    ['A', 'B', 'C', 'D'].forEach((col) => {
      row.getCell(col).border = thinBorder;
      row.getCell(col).font = regularFont;
    });
    sumRowIdx++;
  });

  // Summary by Commodity Table
  sumRowIdx += 2;
  summarySheet.getCell(`A${sumRowIdx}`).value = 'COMMODITY COVERAGE SUMMARY';
  summarySheet.getCell(`A${sumRowIdx}`).font = { ...boldFont, size: 12, color: { argb: 'FF1E3A8A' } };
  sumRowIdx++;

  summarySheet.getRow(sumRowIdx).values = ['Commodity', 'Stacks Count', 'Total Quantity', 'Unit'];
  ['A', 'B', 'C', 'D'].forEach((col) => {
    const cell = summarySheet.getCell(`${col}${sumRowIdx}`);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' };
  });
  sumRowIdx++;

  reportData.summary.commoditySummaries.forEach((cs) => {
    const row = summarySheet.getRow(sumRowIdx);
    row.values = [cs.commodity_name, cs.stacks_count, cs.total_quantity, cs.unit];
    row.getCell(2).numFmt = '#,##0';
    row.getCell(3).numFmt = '#,##0.00';
    ['A', 'B', 'C', 'D'].forEach((col) => {
      row.getCell(col).border = thinBorder;
      row.getCell(col).font = regularFont;
    });
    sumRowIdx++;
  });

  summarySheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 20 },
    { width: 35 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];

  // =========================================================================
  // WORKSHEET 2: Main Fumigation Report (Grouped & Merged Layout)
  // =========================================================================
  const mainSheet = workbook.addWorksheet('Fumigation Exercises', {
    views: [{ state: 'frozen', ySplit: 5, showGridLines: true }],
  });

  // Title Banner
  mainSheet.mergeCells('A1:J1');
  const titleCell = mainSheet.getCell('A1');
  titleCell.value = 'FUMIGATION EXERCISE & STACK SNAPSHOT REPORT';
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { vertical: 'middle' };
  mainSheet.getRow(1).height = 28;

  // Subtitle filter metadata
  mainSheet.getCell('A2').value = `Reporting Period: ${reportData.reportingPeriodText} | Filter: ${reportData.filters.status ? `Status: ${reportData.filters.status}` : 'All Statuses'}`;
  mainSheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF4B5563' } };
  mainSheet.getCell('A3').value = `Generated: ${new Date().toLocaleString()} | Exercises Included: ${reportData.exercises.length}`;
  mainSheet.getCell('A3').font = { italic: true, size: 10, color: { argb: 'FF4B5563' } };

  // Headers
  const mainHeaderRow = mainSheet.getRow(5);
  mainHeaderRow.values = [
    'Warehouse',
    'Exercise No.',
    'Planned Date',
    'Actual Date',
    'Duration',
    'Responsible Officer',
    'Stack No.',
    'Commodity (Snapshot)',
    'Quantity (Snapshot)',
    'Unit',
    'Status',
  ];
  mainHeaderRow.height = 25;

  for (let i = 1; i <= 11; i++) {
    const cell = mainHeaderRow.getCell(i);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: i >= 9 ? 'right' : 'left' };
    cell.border = thinBorder;
  }

  let currentMainRow = 6;

  reportData.exercises.forEach((exercise) => {
    const stacks = exercise.stacks || [];
    const numRows = Math.max(stacks.length, 1);
    const startRow = currentMainRow;
    const endRow = currentMainRow + numRows - 1;

    const plannedDateStr = exercise.planned_fumigation_date
      ? new Date(exercise.planned_fumigation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';
    const actualDateStr = exercise.actual_fumigation_date
      ? new Date(exercise.actual_fumigation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';

    const durationStr = `${exercise.planned_duration} days${exercise.actual_duration ? ` (act. ${exercise.actual_duration}d)` : ''}`;

    for (let sIdx = 0; sIdx < numRows; sIdx++) {
      const snap = stacks[sIdx];
      const row = mainSheet.getRow(currentMainRow);

      row.getCell(1).value = exercise.warehouse_name;
      row.getCell(2).value = exercise.exercise_number;
      row.getCell(3).value = plannedDateStr;
      row.getCell(4).value = actualDateStr;
      row.getCell(5).value = durationStr;
      row.getCell(6).value = exercise.officer_name;

      if (snap) {
        row.getCell(7).value = snap.stack_number_snapshot;
        row.getCell(8).value = snap.commodity_name_snapshot;
        row.getCell(9).value = Number(snap.quantity_snapshot);
        row.getCell(9).numFmt = '#,##0.00';
        row.getCell(10).value = snap.unit_snapshot;
      } else {
        row.getCell(7).value = '-';
        row.getCell(8).value = '-';
        row.getCell(9).value = 0;
        row.getCell(10).value = '-';
      }

      row.getCell(11).value = exercise.status;

      // Formatting
      for (let c = 1; c <= 11; c++) {
        const cell = row.getCell(c);
        cell.font = regularFont;
        cell.border = thinBorder;
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 9 ? 'right' : (c === 7 || c === 10 || c === 11 ? 'center' : 'left'),
        };
      }

      currentMainRow++;
    }

    // Merge vertical exercise cells if multiple stacks belong to the same exercise
    if (numRows > 1) {
      mainSheet.mergeCells(`A${startRow}:A${endRow}`); // Warehouse
      mainSheet.mergeCells(`B${startRow}:B${endRow}`); // Exercise No
      mainSheet.mergeCells(`C${startRow}:C${endRow}`); // Planned Date
      mainSheet.mergeCells(`D${startRow}:D${endRow}`); // Actual Date
      mainSheet.mergeCells(`E${startRow}:E${endRow}`); // Duration
      mainSheet.mergeCells(`F${startRow}:F${endRow}`); // Officer
      mainSheet.mergeCells(`K${startRow}:K${endRow}`); // Status
    }
  });

  mainSheet.columns = [
    { width: 26 }, // Warehouse
    { width: 16 }, // Exercise No
    { width: 14 }, // Planned Date
    { width: 14 }, // Actual Date
    { width: 16 }, // Duration
    { width: 22 }, // Officer
    { width: 14 }, // Stack No
    { width: 20 }, // Commodity
    { width: 18 }, // Quantity
    { width: 15 }, // Unit
    { width: 15 }, // Status
  ];

  // =========================================================================
  // WORKSHEET 3: Fumigation Challenges
  // =========================================================================
  const challengesSheet = workbook.addWorksheet('Challenges', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
  });

  challengesSheet.mergeCells('A1:H1');
  const chTitle = challengesSheet.getCell('A1');
  chTitle.value = 'FUMIGATION EXERCISE CHALLENGES & RESOLUTIONS LOG';
  chTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  chTitle.alignment = { vertical: 'middle' };
  challengesSheet.getRow(1).height = 26;

  challengesSheet.getCell('A2').value = `Reporting Period: ${reportData.reportingPeriodText}`;
  challengesSheet.getCell('A2').font = { italic: true, size: 10 };

  const chHeaderRow = challengesSheet.getRow(4);
  chHeaderRow.values = [
    'Exercise No.',
    'Warehouse',
    'Planned Date',
    'Challenge Category',
    'Description',
    'Action / Resolution',
    'Resolved',
    'Resolution Date',
  ];
  chHeaderRow.height = 24;

  for (let i = 1; i <= 8; i++) {
    const cell = chHeaderRow.getCell(i);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: i === 7 || i === 8 ? 'center' : 'left' };
    cell.border = thinBorder;
  }

  const state = dbManager.getState();
  const selectedExIds = new Set(reportData.exercises.map((e) => e.id));
  const relevantChallenges = state.fumigation_challenges.filter((c) => selectedExIds.has(c.fumigation_exercise_id));

  let chRowIdx = 5;
  relevantChallenges.forEach((c) => {
    const ex = reportData.exercises.find((e) => e.id === c.fumigation_exercise_id);
    const row = challengesSheet.getRow(chRowIdx);
    row.values = [
      ex?.exercise_number || 'N/A',
      ex?.warehouse_name || 'N/A',
      ex?.planned_fumigation_date || 'N/A',
      c.challenge_category,
      c.description,
      c.action_resolution || 'Pending Resolution',
      c.resolved ? 'Yes' : 'No',
      c.resolution_date || '-',
    ];

    for (let col = 1; col <= 8; col++) {
      const cell = row.getCell(col);
      cell.font = regularFont;
      cell.border = thinBorder;
      cell.alignment = {
        vertical: 'middle',
        horizontal: col === 7 || col === 8 ? 'center' : 'left',
        wrapText: col === 5 || col === 6,
      };
    }
    chRowIdx++;
  });

  if (relevantChallenges.length === 0) {
    const row = challengesSheet.getRow(chRowIdx);
    row.getCell(1).value = 'No challenges recorded for exercises in this period.';
    challengesSheet.mergeCells(`A${chRowIdx}:H${chRowIdx}`);
    row.getCell(1).font = { italic: true };
    row.getCell(1).alignment = { horizontal: 'center' };
  }

  challengesSheet.columns = [
    { width: 16 },
    { width: 24 },
    { width: 14 },
    { width: 22 },
    { width: 40 },
    { width: 40 },
    { width: 12 },
    { width: 16 },
  ];

  // =========================================================================
  // WORKSHEET 4: Stack Snapshots (Machine-Readable Raw Dataset)
  // =========================================================================
  const dataSheet = workbook.addWorksheet('Stack Snapshots Data', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  dataSheet.getRow(1).values = [
    'Exercise No',
    'Warehouse Code',
    'Warehouse Name',
    'Planned Date',
    'Actual Date',
    'Officer',
    'Stack Number (Snapshot)',
    'Commodity Name (Snapshot)',
    'Quantity (Snapshot)',
    'Unit (Snapshot)',
    'Exercise Status',
  ];
  for (let i = 1; i <= 11; i++) {
    const cell = dataSheet.getRow(1).getCell(i);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = thinBorder;
  }

  let dataRowIdx = 2;
  reportData.exercises.forEach((ex) => {
    (ex.stacks || []).forEach((snap) => {
      const row = dataSheet.getRow(dataRowIdx);
      row.values = [
        ex.exercise_number,
        ex.warehouse_code,
        ex.warehouse_name,
        ex.planned_fumigation_date,
        ex.actual_fumigation_date || '',
        ex.officer_name,
        snap.stack_number_snapshot,
        snap.commodity_name_snapshot,
        Number(snap.quantity_snapshot),
        snap.unit_snapshot,
        ex.status,
      ];
      row.getCell(9).numFmt = '#,##0.00';
      for (let c = 1; c <= 11; c++) {
        row.getCell(c).font = regularFont;
        row.getCell(c).border = thinBorder;
      }
      dataRowIdx++;
    });
  });

  dataSheet.columns = [
    { width: 16 },
    { width: 16 },
    { width: 26 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 16 },
    { width: 20 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
  ];

  return workbook;
}
