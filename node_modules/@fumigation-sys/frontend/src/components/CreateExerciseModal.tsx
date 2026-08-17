import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { Warehouse, Officer, Stack } from '../types';
import { X, Calendar, User, Clock, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateExerciseModal = ({ isOpen, onClose, onSuccess }: CreateExerciseModalProps) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [warehouseStacks, setWarehouseStacks] = useState<Stack[]>([]);

  // Form State
  const [exerciseNumber, setExerciseNumber] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [plannedDate, setPlannedDate] = useState('2026-08-25');
  const [plannedDuration, setPlannedDuration] = useState<number | ''>(3);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [selectedStackIds, setSelectedStackIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingStacks, setLoadingStacks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load basic dependencies when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedStackIds([]);
      api.getWarehouses(true).then((data) => {
        setWarehouses(data);
        if (data.length > 0 && selectedWarehouseId === '') {
          setSelectedWarehouseId(data[0].id);
        }
      });
      api.getOfficers(true).then((data) => {
        setOfficers(data);
        if (data.length > 0 && selectedOfficerId === '') {
          setSelectedOfficerId(data[0].id);
        }
      });
    }
  }, [isOpen]);

  // Load stacks when warehouse changes
  useEffect(() => {
    if (selectedWarehouseId !== '') {
      setLoadingStacks(true);
      setSelectedStackIds([]);
      api.getStacks({ warehouse_id: selectedWarehouseId, active_only: true })
        .then((stacks) => {
          setWarehouseStacks(stacks);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoadingStacks(false);
        });
    } else {
      setWarehouseStacks([]);
      setSelectedStackIds([]);
    }
  }, [selectedWarehouseId]);

  if (!isOpen) return null;

  const handleToggleStack = (id: number) => {
    setSelectedStackIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllStacks = () => {
    if (selectedStackIds.length === warehouseStacks.length) {
      setSelectedStackIds([]);
    } else {
      setSelectedStackIds(warehouseStacks.map((s) => s.id));
    }
  };

  // Calculate live summary
  const selectedStacks = warehouseStacks.filter((s) => selectedStackIds.includes(s.id));
  const summaryByUnit = new Map<string, number>();
  selectedStacks.forEach((s) => {
    summaryByUnit.set(s.unit, (summaryByUnit.get(s.unit) || 0) + Number(s.current_quantity));
  });
  const summaryText = Array.from(summaryByUnit.entries())
    .map(([unit, total]) => `${total.toLocaleString()} ${unit}`)
    .join(', ');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedWarehouseId) {
      setError('Please select a warehouse.');
      return;
    }
    if (!plannedDate) {
      setError('Please provide a planned fumigation date.');
      return;
    }
    if (!plannedDuration || Number(plannedDuration) <= 0) {
      setError('Planned duration must be greater than zero.');
      return;
    }
    if (!selectedOfficerId) {
      setError('Please select a responsible pest control officer.');
      return;
    }
    if (selectedStackIds.length === 0) {
      setError('You must select at least one stack to fumigate.');
      return;
    }

    try {
      setLoading(true);
      await api.createExercise({
        exercise_number: exerciseNumber.trim() || undefined,
        warehouse_id: Number(selectedWarehouseId),
        planned_fumigation_date: plannedDate,
        planned_duration: Number(plannedDuration),
        responsible_officer_id: Number(selectedOfficerId),
        remarks: remarks.trim() || undefined,
        stack_ids: selectedStackIds,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold">New Fumigation Exercise</h2>
            <p className="text-xs text-slate-400">Configure exercise details and select multiple target stacks for snapshot capture</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Warehouse */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Warehouse *
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="" disabled>Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouse_name} ({w.warehouse_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Number (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Exercise Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. FUM-2026-004 (Auto-generated if blank)"
                value={exerciseNumber}
                onChange={(e) => setExerciseNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Planned Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Planned Fumigation Date *
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Planned Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Planned Duration (Days) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={plannedDuration}
                onChange={(e) => setPlannedDuration(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Responsible Officer */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Responsible Pest Control Officer *
              </label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="" disabled>Select Officer</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.department} - {o.employee_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operational Remarks / Objectives
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Routine phosphine gas treatment against Sitophilus zeamais..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Stacks Selection Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Package className="w-4 h-4 mr-1.5 text-blue-600" />
                  Select Stacks to Fumigate (Captures Historical Snapshot)
                </h3>
                <p className="text-xs text-slate-500">
                  Select one or more active stacks belonging to the selected warehouse.
                </p>
              </div>

              {warehouseStacks.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllStacks}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
                >
                  {selectedStackIds.length === warehouseStacks.length ? 'Deselect All' : 'Select All Stacks'}
                </button>
              )}
            </div>

            {/* Live Real-time Summary Badge */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl mb-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-900">
                Selected Stacks: <strong className="text-blue-700 text-sm">{selectedStackIds.length}</strong>
              </span>
              <span className="font-semibold text-blue-900">
                Total Quantity: <strong className="text-blue-700 text-sm">{summaryText || '0'}</strong>
              </span>
            </div>

            {/* Stacks Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {loadingStacks ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Loading warehouse stacks...
                </div>
              ) : warehouseStacks.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">✓</th>
                      <th className="px-3 py-2 text-left">Stack No.</th>
                      <th className="px-3 py-2 text-left">Commodity</th>
                      <th className="px-3 py-2 text-right">Current Quantity</th>
                      <th className="px-3 py-2 text-left">Unit</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warehouseStacks.map((s) => {
                      const isChecked = selectedStackIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleToggleStack(s.id)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStack(s.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-900">{s.stack_number}</td>
                          <td className="px-3 py-2 text-slate-700">{s.commodity_name}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">
                            {s.current_quantity.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{s.unit}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No active stacks available in this warehouse. Register stacks first.
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedStackIds.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center"
            >
              {loading ? (
                'Creating Exercise...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Save Exercise & Capture Snapshots
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
