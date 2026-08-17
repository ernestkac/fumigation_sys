import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { FullReportResponse, Warehouse, Officer, Commodity, ReportFilterState } from '../types';
import {
  Layers,
  FileSpreadsheet,
  Calendar,
  Filter,
  RotateCcw,
  Download,
  Building2,
  Shield,
} from 'lucide-react';

export const ReportsView = () => {
  const [report, setReport] = useState<FullReportResponse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateType, setDateType] = useState<'planned' | 'actual'>('planned');
  const [warehouseId, setWarehouseId] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [commodityId, setCommodityId] = useState('');
  const [status, setStatus] = useState('');
  const [stackNumber, setStackNumber] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFilterPayload = (): Partial<ReportFilterState> => ({
    startDate,
    endDate,
    dateType,
    warehouseId,
    officerId,
    commodityId,
    status,
    stackNumber,
    search,
  });

  const loadReport = async () => {
    try {
      setLoading(true);
      const [reportData, whData, offData, commData] = await Promise.all([
        api.getReport(getFilterPayload()),
        api.getWarehouses(),
        api.getOfficers(),
        api.getCommodities(),
      ]);
      setReport(reportData);
      setWarehouses(whData);
      setOfficers(offData);
      setCommodities(commData);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [startDate, endDate, dateType, warehouseId, officerId, commodityId, status]);

  const handleApplySearch = (e: FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setDateType('planned');
    setWarehouseId('');
    setOfficerId('');
    setCommodityId('');
    setStatus('');
    setStackNumber('');
    setSearch('');
  };

  const handleExportExcel = () => {
    const url = api.getExcelReportUrl(getFilterPayload());
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Layers className="w-6 h-6 mr-2 text-blue-600" />
            Fumigation Reporting Studio & Excel Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate audit-ready management reports and multi-sheet Excel workbooks based on historical stack snapshots.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-400" />
          Download Excel Report (.xlsx)
        </button>
      </div>

      {/* Filter Control Studio */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-xs sm:text-sm">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Reporting Parameters & Multi-Dimensional Filters</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1 text-slate-400" />
            Reset All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Start */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              Period Start
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              Period End
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Date Mode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date Filter Target
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value as 'planned' | 'actual')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="planned">Filter by Planned Date</option>
              <option value="actual">Filter by Actual Date</option>
            </select>
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Warehouse
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.warehouse_name}</option>
              ))}
            </select>
          </div>

          {/* Officer */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Responsible Officer
            </label>
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Officers</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Commodity */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Commodity
            </label>
            <select
              value={commodityId}
              onChange={(e) => setCommodityId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>{c.commodity_name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Exercise Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Postponed">Postponed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Stack Number Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Stack Number
            </label>
            <form onSubmit={handleApplySearch}>
              <input
                type="text"
                placeholder="e.g. B001"
                value={stackNumber}
                onChange={(e) => setStackNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </form>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs sm:text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Generating live report analytics...
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs">
          {error}
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtered Exercises</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{report.summary.totalExercises}</h2>
              <p className="text-xs text-slate-500 mt-1">{report.reportingPeriodText}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stacks Covered in Period</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">{report.summary.totalStacksFumigated}</h2>
              <p className="text-xs text-slate-500 mt-1">Across all filtered warehouses</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Commodity Quantities</p>
              <div className="mt-1 space-y-1">
                {report.summary.totalQuantitiesByUnit.length > 0 ? (
                  report.summary.totalQuantitiesByUnit.map((q) => (
                    <p key={q.unit} className="text-lg font-bold text-emerald-700">
                      {q.total.toLocaleString()} <span className="text-xs font-medium text-slate-500">{q.unit}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-lg font-bold text-slate-400">0 records</p>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown Tables (Warehouse & Commodity summaries) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Summary Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                Warehouse Summary Breakdown
              </div>
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50/50 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Warehouse</th>
                    <th className="px-4 py-2.5 text-center">Exercises</th>
                    <th className="px-4 py-2.5 text-center">Stacks</th>
                    <th className="px-4 py-2.5 text-right">Total Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.summary.warehouseSummaries.map((ws) => (
                    <tr key={ws.warehouse_name} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{ws.warehouse_name}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-700">{ws.exercises_count}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-700">{ws.stacks_count}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-blue-700">
                        {ws.quantitiesByUnit.map((q) => `${q.total.toLocaleString()} ${q.unit}`).join(', ') || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commodity Summary Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center">
                <Shield className="w-4 h-4 mr-2 text-emerald-600" />
                Commodity Quantity Breakdown
              </div>
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50/50 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Commodity</th>
                    <th className="px-4 py-2.5 text-center">Stacks Count</th>
                    <th className="px-4 py-2.5 text-right">Total Snapshot Quantity</th>
                    <th className="px-4 py-2.5 text-left">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.summary.commoditySummaries.map((cs) => (
                    <tr key={cs.commodity_name} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{cs.commodity_name}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-700">{cs.stacks_count}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                        {cs.total_quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{cs.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MAIN GROUPED REPORT PREVIEW TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Main Fumigation Report - Detailed Hierarchical Grid</h2>
                <p className="text-xs text-slate-400">Snapshot stack records grouped by warehouse & exercise with challenges</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export to Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Warehouse</th>
                    <th className="px-3 py-2.5">Exercise #</th>
                    <th className="px-3 py-2.5">Planned Date</th>
                    <th className="px-3 py-2.5 text-center">Planned Days</th>
                    <th className="px-3 py-2.5">Actual Date</th>
                    <th className="px-3 py-2.5 text-center">Actual Days</th>
                    <th className="px-3 py-2.5">Officer</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5">Stack # (Snapshot)</th>
                    <th className="px-3 py-2.5">Commodity (Snapshot)</th>
                    <th className="px-3 py-2.5 text-right">Quantity (Snapshot)</th>
                    <th className="px-3 py-2.5">Unit</th>
                    <th className="px-3 py-2.5">Operational Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.exercises.map((ex) => {
                    const stackRows = ex.stacks && ex.stacks.length > 0 ? ex.stacks : [null];
                    return stackRows.map((stack, sIdx) => (
                      <tr
                        key={`${ex.id}-${stack ? stack.id : 'empty'}`}
                        className={`${sIdx === 0 ? 'border-t border-slate-200' : ''} hover:bg-slate-50/70`}
                      >
                        {/* Only print exercise metadata on first stack row */}
                        {sIdx === 0 ? (
                          <>
                            <td className="px-3 py-2.5 font-bold text-slate-900 align-top" rowSpan={stackRows.length}>
                              {ex.warehouse_name}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-blue-700 align-top font-mono" rowSpan={stackRows.length}>
                              {ex.exercise_number}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800 align-top whitespace-nowrap" rowSpan={stackRows.length}>
                              {ex.planned_fumigation_date}
                            </td>
                            <td className="px-3 py-2.5 text-center font-medium align-top" rowSpan={stackRows.length}>
                              {ex.planned_duration}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800 align-top whitespace-nowrap" rowSpan={stackRows.length}>
                              {ex.actual_fumigation_date || '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center font-medium align-top" rowSpan={stackRows.length}>
                              {ex.actual_duration || '-'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 align-top" rowSpan={stackRows.length}>
                              {ex.officer_name}
                            </td>
                            <td className="px-3 py-2.5 text-center align-top" rowSpan={stackRows.length}>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">
                                {ex.status}
                              </span>
                            </td>
                          </>
                        ) : null}

                        {/* Stack Columns */}
                        {stack ? (
                          <>
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                              {stack.stack_number_snapshot}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {stack.commodity_name_snapshot}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-blue-700">
                              {Number(stack.quantity_snapshot).toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {stack.unit_snapshot}
                            </td>
                          </>
                        ) : (
                          <td colSpan={4} className="px-3 py-2.5 text-slate-400 italic">
                            No stacks recorded
                          </td>
                        )}

                        {/* Remarks on first row */}
                        {sIdx === 0 ? (
                          <td className="px-3 py-2.5 text-slate-600 align-top max-w-xs truncate" rowSpan={stackRows.length}>
                            {ex.remarks || '-'}
                          </td>
                        ) : null}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
