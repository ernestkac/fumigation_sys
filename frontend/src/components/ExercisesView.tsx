import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { FumigationExercise, Warehouse, Officer, ExerciseStatus } from '../types';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Package,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ExercisesViewProps {
  onOpenCreateExercise: () => void;
  onSelectExercise: (id: number) => void;
  onNavigateToReports: () => void;
}

export const ExercisesView = ({
  onOpenCreateExercise,
  onSelectExercise,
  onNavigateToReports,
}: ExercisesViewProps) => {
  const [exercises, setExercises] = useState<FumigationExercise[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateType, setDateType] = useState<'planned' | 'actual'>('planned');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [exList, whList, offList] = await Promise.all([
        api.getExercises({
          search: search || undefined,
          warehouse_id: warehouseId || undefined,
          officer_id: officerId || undefined,
          status: status || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          date_type: dateType,
        }),
        api.getWarehouses(),
        api.getOfficers(),
      ]);
      setExercises(exList);
      setWarehouses(whList);
      setOfficers(offList);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [warehouseId, officerId, status, startDate, endDate, dateType]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setWarehouseId('');
    setOfficerId('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setDateType('planned');
  };

  const getStatusBadge = (st: ExerciseStatus) => {
    switch (st) {
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
            In Progress
          </span>
        );
      case 'Planned':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
            Planned
          </span>
        );
      case 'Postponed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/60">
            Postponed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/60">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <CalendarCheck className="w-6 h-6 mr-2 text-blue-600" />
            Fumigation Exercises Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage fumigation operations, captured stack snapshots, and field challenge logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNavigateToReports}
            className="inline-flex items-center px-4 py-2 bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Report Studio
          </button>
          <button
            onClick={onOpenCreateExercise}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + New Exercise
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search exercise #, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          {/* Warehouse */}
          <div>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.warehouse_name}</option>
              ))}
            </select>
          </div>

          {/* Officer */}
          <div>
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Officers</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Postponed">Postponed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </form>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Reporting Period:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
              title="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
              title="End Date"
            />
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value as 'planned' | 'actual')}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 text-xs"
            >
              <option value="planned">Filter by Planned Date</option>
              <option value="actual">Filter by Actual Date</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1 text-slate-400" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Exercises Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading fumigation exercises...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 text-xs sm:text-sm">
            {error}
          </div>
        ) : exercises.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Exercise #</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Planned Schedule</th>
                  <th className="px-4 py-3">Actual Schedule</th>
                  <th className="px-4 py-3">Responsible Officer</th>
                  <th className="px-4 py-3 text-center">Stacks</th>
                  <th className="px-4 py-3 text-right">Total Quantity</th>
                  <th className="px-4 py-3 text-center">Challenges</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exercises.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">{ex.exercise_number}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {ex.warehouse_name}
                      <span className="block text-[11px] text-slate-400 font-normal">{ex.warehouse_code}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                      {new Date(ex.planned_fumigation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="block text-[11px] text-slate-400">{ex.planned_duration} days planned</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                      {ex.actual_fumigation_date ? (
                        <>
                          {new Date(ex.actual_fumigation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          <span className="block text-[11px] text-emerald-600 font-medium">{ex.actual_duration} days</span>
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {ex.officer_name}
                      <span className="block text-[11px] text-slate-400 truncate max-w-[140px]">{ex.officer_department}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <Package className="w-3 h-3 mr-1 text-slate-500" />
                        {ex.stacks_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-900">
                      {ex.unit_breakdown && ex.unit_breakdown.length > 0 ? (
                        ex.unit_breakdown.map((u) => (
                          <div key={u.unit} className="text-xs">
                            <span className="font-bold text-blue-700">{u.total_quantity.toLocaleString()}</span> {u.unit}
                          </div>
                        ))
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {ex.challenges_count && ex.challenges_count > 0 ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            ex.unresolved_challenges && ex.unresolved_challenges > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                          {ex.challenges_count}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">{getStatusBadge(ex.status)}</td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectExercise(ex.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200/70 transition-colors"
                      >
                        View & Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <p className="text-xs sm:text-sm">No fumigation exercises match your filter criteria.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
