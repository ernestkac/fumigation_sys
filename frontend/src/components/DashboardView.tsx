import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardStats, ExerciseStatus } from '../types';
import {
  Warehouse,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenCreateExercise: () => void;
  onSelectExercise: (id: number) => void;
}

export const DashboardView = ({
  onNavigate,
  onOpenCreateExercise,
  onSelectExercise,
}: DashboardViewProps) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getStatusBadge = (status: ExerciseStatus) => {
    switch (status) {
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
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 font-medium text-sm">Loading fumigation dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-6 my-6 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <p className="font-semibold text-sm">Unable to load dashboard</p>
        <p className="text-xs text-rose-600 mt-1">{error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Fumigation Operations Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time warehouse pest control monitoring, multi-stack snapshots, and operational challenge tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenCreateExercise}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            + New Exercise
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-800 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-400" />
            Generate Excel Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Warehouses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Warehouses</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalWarehouses || 0}</h2>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            <span className="text-blue-600 font-semibold">{stats?.totalActiveStacks || 0} active stacks</span> across all depots
          </div>
        </div>

        {/* Card 2: Total Stacks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Stacks Monitored</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalActiveStacks || 0}</h2>
          <p className="text-xs text-slate-500 mt-2 font-mono">Grain & legume stores</p>
        </div>

        {/* Card 3: Exercises in Progress / Planned */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Planned Exercises</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.plannedExercises || 0}</h2>
          <div className="mt-2 text-xs text-blue-600 font-semibold">
            {stats?.inProgressExercises || 0} currently in-progress
          </div>
        </div>

        {/* Card 4: Challenges */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Field Challenges</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.recentChallenges?.filter((c) => !c.resolved).length ?? 0}
          </h2>
          <div className="mt-2 text-xs text-amber-600 font-semibold">
            Requires field attention
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Fumigation Exercises (8 cols) & Reporting / Challenges (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Exercises Table (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-semibold text-slate-800 text-sm">Recent Fumigation Exercises</h3>
            <button
              onClick={() => onNavigate('exercises')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center"
            >
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats?.upcomingExercises && stats.upcomingExercises.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Exercise Details</th>
                    <th className="px-5 py-3 font-semibold">Warehouse</th>
                    <th className="px-5 py-3 font-semibold text-center">Stacks</th>
                    <th className="px-5 py-3 font-semibold text-right">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {stats.upcomingExercises.map((ex) => (
                    <tr key={ex.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 align-top">
                        <div className="font-bold text-slate-900 text-xs">{ex.exercise_number}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Officer: {ex.officer_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Date: {new Date(ex.planned_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="font-semibold text-slate-800 text-xs">{ex.warehouse_name}</div>
                        <div className="text-[11px] text-slate-400">{ex.duration} days planned</div>
                      </td>
                      <td className="px-5 py-3.5 text-center align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <Package className="w-3 h-3 mr-1 text-slate-500" />
                          {ex.stacks_count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right align-top">
                        {getStatusBadge(ex.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right align-top">
                        <button
                          onClick={() => onSelectExercise(ex.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200/70 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <p>No active fumigation exercises scheduled.</p>
                <button
                  onClick={onOpenCreateExercise}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  + Schedule a new exercise
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reporting Tools & Active Challenges (col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Quick Export Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Reporting Tools</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Audit Snapshot Status</label>
                <div className="text-xs font-semibold text-slate-800">
                  {stats?.totalStacksFumigated || 0} Historical Snapshots Preserved
                </div>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Export Excel Report
              </button>
            </div>
          </div>

          {/* Active Challenges Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Active Challenges</h3>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Operational Log
              </span>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[320px]">
              {stats?.recentChallenges && stats.recentChallenges.length > 0 ? (
                stats.recentChallenges.map((ch) => (
                  <div
                    key={ch.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      ch.resolved
                        ? 'border-emerald-400 bg-emerald-50/40'
                        : 'border-amber-400 bg-amber-50/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        ch.resolved ? 'text-emerald-800' : 'text-amber-800'
                      }`}>
                        {ch.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ch.resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{ch.description}"
                    </p>
                    <p className="text-[10px] mt-2 font-semibold text-slate-500 flex items-center justify-between">
                      <span>Ref: {ch.exercise_number}</span>
                      <span>{ch.warehouse_name}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No active operational challenges.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View Resolution Board & Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
