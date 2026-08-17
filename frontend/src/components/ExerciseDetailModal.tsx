import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { FumigationExercise, ExerciseStatus } from '../types';
import {
  X,
  Calendar,
  Clock,
  User,
  Warehouse,
  Package,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Edit2,
  Info,
} from 'lucide-react';

interface ExerciseDetailModalProps {
  exerciseId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ExerciseDetailModal = ({
  exerciseId,
  isOpen,
  onClose,
  onRefresh,
}: ExerciseDetailModalProps) => {
  const [exercise, setExercise] = useState<FumigationExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status Change State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ExerciseStatus>('Completed');
  const [actualDate, setActualDate] = useState('');
  const [actualDuration, setActualDuration] = useState<number | ''>(3);
  const [statusRemarks, setStatusRemarks] = useState('');

  // Challenge Form State
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [challengeCategory, setChallengeCategory] = useState('Chemical availability');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeAction, setChallengeAction] = useState('');
  const [challengeResolved, setChallengeResolved] = useState(false);

  const categories = [
    'Chemical availability',
    'Labour',
    'Equipment',
    'Weather',
    'Warehouse condition',
    'Stack accessibility',
    'Transport',
    'Security',
    'Other',
  ];

  const loadExerciseDetails = async () => {
    if (!exerciseId) return;
    try {
      setLoading(true);
      const data = await api.getExerciseById(exerciseId);
      setExercise(data);
      setActualDate(data.actual_fumigation_date || data.planned_fumigation_date);
      setActualDuration(data.actual_duration || data.planned_duration);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && exerciseId) {
      loadExerciseDetails();
    }
  }, [isOpen, exerciseId]);

  if (!isOpen) return null;

  const handleUpdateStatus = async () => {
    if (!exercise) return;
    try {
      setLoading(true);
      await api.updateExercise(exercise.id, {
        status: targetStatus,
        actual_fumigation_date: targetStatus === 'Completed' ? actualDate : exercise.actual_fumigation_date,
        actual_duration: targetStatus === 'Completed' && actualDuration !== '' ? Number(actualDuration) : exercise.actual_duration,
        remarks: statusRemarks.trim() ? statusRemarks : exercise.remarks,
      });
      setShowStatusModal(false);
      await loadExerciseDetails();
      onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChallenge = async (e: FormEvent) => {
    e.preventDefault();
    if (!exercise) return;
    if (!challengeDesc.trim()) return;

    try {
      setLoading(true);
      await api.createChallenge(exercise.id, {
        challenge_category: challengeCategory,
        description: challengeDesc.trim(),
        action_resolution: challengeAction.trim() || undefined,
        resolved: challengeResolved,
      });
      setShowAddChallenge(false);
      setChallengeDesc('');
      setChallengeAction('');
      setChallengeResolved(false);
      await loadExerciseDetails();
      onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResolveChallenge = async (challengeId: number, currentResolved: number) => {
    try {
      await api.updateChallenge(challengeId, {
        resolved: currentResolved ? 0 : 1,
      });
      await loadExerciseDetails();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status?: ExerciseStatus) => {
    switch (status) {
      case 'Completed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Completed</span>;
      case 'In Progress':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">In Progress</span>;
      case 'Planned':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Planned</span>;
      case 'Postponed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">Postponed</span>;
      case 'Cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">{exercise?.exercise_number || 'Fumigation Exercise'}</h2>
                {getStatusBadge(exercise?.status)}
              </div>
              <p className="text-xs text-slate-400">Warehouse Pest Control Operation & Snapshot Records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Exercise Key Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Warehouse */}
            <div className="flex items-start space-x-3">
              <Warehouse className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Warehouse Location</p>
                <p className="text-sm font-bold text-slate-900">{exercise?.warehouse_name}</p>
                <p className="text-xs text-slate-500">Code: {exercise?.warehouse_code}</p>
              </div>
            </div>

            {/* Officer */}
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Responsible Officer</p>
                <p className="text-sm font-bold text-slate-900">{exercise?.officer_name}</p>
                <p className="text-xs text-slate-500">{exercise?.officer_department}</p>
              </div>
            </div>

            {/* Dates & Duration */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Fumigation Schedule</p>
                <p className="text-sm font-bold text-slate-900">
                  Planned: {exercise?.planned_fumigation_date} ({exercise?.planned_duration}d)
                </p>
                {exercise?.actual_fumigation_date && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    Actual: {exercise.actual_fumigation_date} ({exercise.actual_duration}d)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Operational Remarks */}
          {exercise?.remarks && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Operational Remarks:</strong> {exercise.remarks}
              </div>
            </div>
          )}

          {/* Status Progression Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-100/80 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Update Exercise Status:
            </span>
            <div className="flex flex-wrap gap-2">
              {exercise?.status !== 'In Progress' && exercise?.status !== 'Completed' && (
                <button
                  onClick={() => {
                    setTargetStatus('In Progress');
                    setShowStatusModal(true);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                >
                  Start (In Progress)
                </button>
              )}
              {exercise?.status !== 'Completed' && (
                <button
                  onClick={() => {
                    setTargetStatus('Completed');
                    setShowStatusModal(true);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                >
                  Mark Completed
                </button>
              )}
              {exercise?.status !== 'Postponed' && exercise?.status !== 'Completed' && (
                <button
                  onClick={() => {
                    setTargetStatus('Postponed');
                    setShowStatusModal(true);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700"
                >
                  Postpone
                </button>
              )}
              {exercise?.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    setTargetStatus('Cancelled');
                    setShowStatusModal(true);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* STACKS SNAPSHOT SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Package className="w-4 h-4 mr-1.5 text-blue-600" />
                Captured Stack Snapshots ({exercise?.stacks?.length || 0})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Total Covered: <strong className="text-slate-800">{exercise?.unit_breakdown?.map((u) => `${u.total_quantity.toLocaleString()} ${u.unit}`).join(', ')}</strong>
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Stack Number (Snapshot)</th>
                    <th className="px-4 py-2.5 text-left">Commodity</th>
                    <th className="px-4 py-2.5 text-right">Snapshot Quantity</th>
                    <th className="px-4 py-2.5 text-left">Unit</th>
                    <th className="px-4 py-2.5 text-right">Current Live Warehouse Qty</th>
                    <th className="px-4 py-2.5 text-center">Historical Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exercise?.stacks?.map((snap) => {
                    const isDifferent =
                      snap.current_stack_quantity !== undefined &&
                      snap.current_stack_quantity !== snap.quantity_snapshot;

                    return (
                      <tr key={snap.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{snap.stack_number_snapshot}</td>
                        <td className="px-4 py-3 text-slate-700">{snap.commodity_name_snapshot}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">
                          {Number(snap.quantity_snapshot).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{snap.unit_snapshot}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {snap.current_stack_quantity !== undefined
                            ? `${snap.current_stack_quantity.toLocaleString()} ${snap.unit_snapshot}`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isDifferent ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                              title={`Current quantity changed to ${snap.current_stack_quantity}, but snapshot correctly preserves historical ${snap.quantity_snapshot}.`}
                            >
                              Preserved Snapshot ({snap.quantity_snapshot})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Immutable Match
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHALLENGES SECTION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
                Operational Challenges ({exercise?.challenges?.length || 0})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChallenge(!showAddChallenge)}
                className="inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Record Challenge
              </button>
            </div>

            {/* Add Challenge Inline Form */}
            {showAddChallenge && (
              <form onSubmit={handleAddChallenge} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-900 uppercase">Add Challenge to this Exercise</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddChallenge(false)}
                    className="text-amber-800 hover:text-amber-950 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Challenge Category *
                    </label>
                    <select
                      value={challengeCategory}
                      onChange={(e) => setChallengeCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Status
                    </label>
                    <label className="inline-flex items-center mt-1.5 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={challengeResolved}
                        onChange={(e) => setChallengeResolved(e.target.checked)}
                        className="rounded text-blue-600 mr-2 h-4 w-4"
                      />
                      Already Resolved
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Description of Challenge *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Aluminium phosphide tablets were unavailable..."
                      value={challengeDesc}
                      onChange={(e) => setChallengeDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Action / Resolution
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Requisitioned emergency stock from regional depot..."
                      value={challengeAction}
                      onChange={(e) => setChallengeAction(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-xs"
                  >
                    Save Challenge
                  </button>
                </div>
              </form>
            )}

            {/* Challenges List */}
            <div className="space-y-2.5">
              {exercise?.challenges && exercise.challenges.length > 0 ? (
                exercise.challenges.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {ch.challenge_category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            ch.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ch.resolved ? 'Resolved' : 'Pending Action'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-900 mt-1">{ch.description}</p>
                      {ch.action_resolution && (
                        <p className="text-xs text-slate-600">
                          <strong className="text-slate-700">Resolution:</strong> {ch.action_resolution}
                        </p>
                      )}
                      {ch.resolution_date && (
                        <p className="text-[11px] text-slate-400">Resolved Date: {ch.resolution_date}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleResolveChallenge(ch.id, ch.resolved)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors shrink-0 ${
                        ch.resolved
                          ? 'text-slate-600 bg-slate-100 border-slate-300 hover:bg-slate-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {ch.resolved ? 'Reopen Challenge' : 'Mark as Resolved'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No challenges logged for this exercise.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>

      {/* Quick Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Update Status to: <span className="text-blue-600">{targetStatus}</span>
            </h3>

            {targetStatus === 'Completed' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Actual Fumigation Date *
                  </label>
                  <input
                    type="date"
                    value={actualDate}
                    onChange={(e) => setActualDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Actual Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actualDuration}
                    onChange={(e) => setActualDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                placeholder="Reason or notes regarding status update..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
