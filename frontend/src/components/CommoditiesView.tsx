import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { Commodity } from '../types';
import { Shield, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';

export const CommoditiesView = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Commodity | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Bags (50kg)');
  const [isActive, setIsActive] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadCommodities = async () => {
    try {
      setLoading(true);
      const data = await api.getCommodities();
      setCommodities(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommodities();
  }, []);

  const handleOpenCreate = () => {
    setEditingComm(null);
    setName('');
    setUnit('Bags (50kg)');
    setIsActive(1);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Commodity) => {
    setEditingComm(c);
    setName(c.commodity_name);
    setUnit(c.default_unit);
    setIsActive(c.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingComm) {
        await api.updateCommodity(editingComm.id, {
          commodity_name: name.trim(),
          default_unit: unit.trim(),
          is_active: isActive,
        });
      } else {
        await api.createCommodity({
          commodity_name: name.trim(),
          default_unit: unit.trim(),
          is_active: isActive,
        });
      }
      setIsModalOpen(false);
      await loadCommodities();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Commodities Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stored grain and agriculture commodities subject to pest fumigation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          + Add Commodity
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading commodities...
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Commodity Name</th>
                <th className="px-4 py-3">Default Packaging Unit</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commodities.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{c.commodity_name}</td>
                  <td className="px-4 py-3.5 text-slate-600">{c.default_unit}</td>
                  <td className="px-4 py-3.5 text-center">
                    {c.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200/70 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 inline mr-1" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{editingComm ? 'Edit Commodity' : 'Add Commodity'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs">{error}</div>}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Commodity Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. White Maize or Pigeon Peas"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Default Unit *</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. Bags (50kg) or MT"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="inline-flex items-center text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive === 1}
                    onChange={(e) => setIsActive(e.target.checked ? 1 : 0)}
                    className="rounded text-blue-600 mr-2 h-4 w-4"
                  />
                  Active Commodity
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  {editingComm ? 'Update Commodity' : 'Save Commodity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
