import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { Officer } from '../types';
import { Users, Plus, Edit, Phone, Building2 } from 'lucide-react';

export const OfficersView = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOff, setEditingOff] = useState<Officer | null>(null);

  const [empNo, setEmpNo] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('Quality Control & Pest Management');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadOfficers = async () => {
    try {
      setLoading(true);
      const data = await api.getOfficers();
      setOfficers(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  const handleOpenCreate = () => {
    setEditingOff(null);
    setEmpNo('');
    setName('');
    setDept('Quality Control & Pest Management');
    setPhone('');
    setIsActive(1);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (off: Officer) => {
    setEditingOff(off);
    setEmpNo(off.employee_number);
    setName(off.name);
    setDept(off.department);
    setPhone(off.phone || '');
    setIsActive(off.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingOff) {
        await api.updateOfficer(editingOff.id, {
          employee_number: empNo.trim(),
          name: name.trim(),
          department: dept.trim(),
          phone: phone.trim() || undefined,
          is_active: isActive,
        });
      } else {
        await api.createOfficer({
          employee_number: empNo.trim(),
          name: name.trim(),
          department: dept.trim(),
          phone: phone.trim() || undefined,
          is_active: isActive,
        });
      }
      setIsModalOpen(false);
      await loadOfficers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Pest Control Officers Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified fumigation controllers and pest management personnel.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          + Add Officer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading officers...
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee #</th>
                <th className="px-4 py-3">Officer Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {officers.map((off) => (
                <tr key={off.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-blue-700">{off.employee_number}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{off.name}</td>
                  <td className="px-4 py-3.5 text-slate-600 flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {off.department}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {off.phone ? (
                      <span className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {off.phone}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {off.is_active ? (
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
                      onClick={() => handleOpenEdit(off)}
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
              <h3 className="font-bold text-slate-900">{editingOff ? 'Edit Officer' : 'Add Pest Control Officer'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs">{error}</div>}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee Number *</label>
                <input
                  type="text"
                  value={empNo}
                  onChange={(e) => setEmpNo(e.target.value)}
                  placeholder="e.g. EMP-004"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Frank Mwale"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department *</label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  placeholder="e.g. Quality Assurance & Pest Management"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +265 888 123 456"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white"
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
                  Active Staff Member
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
                  {editingOff ? 'Update Officer' : 'Save Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
