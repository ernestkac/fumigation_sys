import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { Stack, Warehouse, Commodity, StackStatus } from '../types';
import { Package, Plus, Search, Edit } from 'lucide-react';

export const StacksView = () => {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [commodityId, setCommodityId] = useState('');
  const [status, setStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<Stack | null>(null);
  const [formWarehouseId, setFormWarehouseId] = useState<number | ''>('');
  const [formStackNumber, setFormStackNumber] = useState('');
  const [formCommodityId, setFormCommodityId] = useState<number | ''>('');
  const [formQuantity, setFormQuantity] = useState<number | ''>(500);
  const [formUnit, setFormUnit] = useState('Bags (50kg)');
  const [formStatus, setFormStatus] = useState<StackStatus>('Active');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stacksData, whData, commData] = await Promise.all([
        api.getStacks({
          search: search || undefined,
          warehouse_id: warehouseId || undefined,
          commodity_id: commodityId || undefined,
          status: status || undefined,
        }),
        api.getWarehouses(),
        api.getCommodities(),
      ]);
      setStacks(stacksData);
      setWarehouses(whData);
      setCommodities(commData);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [warehouseId, commodityId, status]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreateModal = () => {
    setEditingStack(null);
    setFormWarehouseId(warehouses[0]?.id || '');
    setFormStackNumber('');
    setFormCommodityId(commodities[0]?.id || '');
    setFormQuantity(500);
    setFormUnit('Bags (50kg)');
    setFormStatus('Active');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stack: Stack) => {
    setEditingStack(stack);
    setFormWarehouseId(stack.warehouse_id);
    setFormStackNumber(stack.stack_number);
    setFormCommodityId(stack.commodity_id);
    setFormQuantity(stack.current_quantity);
    setFormUnit(stack.unit);
    setFormStatus(stack.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCommodityChange = (cId: number) => {
    setFormCommodityId(cId);
    const comm = commodities.find((c) => c.id === cId);
    if (comm) {
      setFormUnit(comm.default_unit);
    }
  };

  const handleSaveStack = async (e: FormEvent) => {
    e.preventDefault();
    if (!formWarehouseId || !formStackNumber.trim() || !formCommodityId || formQuantity === '') {
      setError('All stack fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStack) {
        await api.updateStack(editingStack.id, {
          stack_number: formStackNumber.trim(),
          commodity_id: Number(formCommodityId),
          current_quantity: Number(formQuantity),
          unit: formUnit.trim(),
          status: formStatus,
        });
      } else {
        await api.createStack({
          warehouse_id: Number(formWarehouseId),
          stack_number: formStackNumber.trim(),
          commodity_id: Number(formCommodityId),
          current_quantity: Number(formQuantity),
          unit: formUnit.trim(),
          status: formStatus,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            Warehouse Stacks Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain warehouse grain and commodity stack inventories with snapshot safety.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          + Register Stack
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search stack #, commodity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

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

          <div>
            <select
              value={commodityId}
              onChange={(e) => setCommodityId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>{c.commodity_name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Empty">Empty</option>
              <option value="Closed">Closed</option>
              <option value="Transferred">Transferred</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </form>
      </div>

      {/* Stacks Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading stacks...
          </div>
        ) : stacks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Stack Number</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Commodity</th>
                  <th className="px-4 py-3 text-right">Current Live Quantity</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stacks.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">{s.stack_number}</td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium">
                      {s.warehouse_name}
                      <span className="block text-[11px] text-slate-400 font-normal">{s.warehouse_code}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{s.commodity_name}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {Number(s.current_quantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{s.unit}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200/70 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
            No stacks found matching your criteria.
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {editingStack ? `Edit Stack ${editingStack.stack_number}` : 'Register New Stack'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStack} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {/* Warehouse */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Warehouse *
                </label>
                <select
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(Number(e.target.value))}
                  disabled={!!editingStack}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white disabled:bg-slate-50"
                  required
                >
                  <option value="" disabled>Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouse_name} ({w.warehouse_code})
                    </option>
                  ))}
                </select>
                {editingStack && (
                  <p className="text-[10px] text-slate-400 mt-1">Warehouse location cannot be modified after registration.</p>
                )}
              </div>

              {/* Stack Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Stack Number / Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. B001 or M002"
                  value={formStackNumber}
                  onChange={(e) => setFormStackNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                  required
                />
              </div>

              {/* Commodity */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Commodity *
                </label>
                <select
                  value={formCommodityId}
                  onChange={(e) => handleCommodityChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                  required
                >
                  <option value="" disabled>Select Commodity</option>
                  {commodities.map((c) => (
                    <option key={c.id} value={c.id}>{c.commodity_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Current Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                    required
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Stack Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StackStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Empty">Empty</option>
                  <option value="Closed">Closed</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {editingStack && (
                <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-[11px] text-blue-900">
                  <strong className="font-semibold">Snapshot Safety Notice:</strong> Modifying current quantity will update live inventory, while historical snapshots in past exercises remain immutably preserved.
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingStack ? 'Update Stack' : 'Save Stack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
