import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, CheckCircle2, AlertCircle, Trash2, Edit, RefreshCw, KeyRound, Wrench } from 'lucide-react';
import { Vehicle } from '../types';
import { db } from '../db/sqlite';

export const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form Modal / Inline Add State
  const [isAdding, setIsAdding] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<Vehicle['vehicle_category']>('Quad Bikes');
  const [notes, setNotes] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories: Vehicle['vehicle_category'][] = [
    'Quad Bikes',
    'Polaris Vehicles',
    'Can-Am Vehicles',
    'Other Vehicles'
  ];

  const presets = [
    { id: 'QB-S01', name: 'Quad Bike Single Seater', category: 'Quad Bikes' as const },
    { id: 'QB-D01', name: 'Quad Bike Double Seater', category: 'Quad Bikes' as const },
    { id: 'POL-2S', name: 'Polaris 2 Seater', category: 'Polaris Vehicles' as const },
    { id: 'POL-4S', name: 'Polaris 4 Seater', category: 'Polaris Vehicles' as const },
    { id: 'POL-BK', name: 'Polaris Bike', category: 'Polaris Vehicles' as const },
    { id: 'CAN-2S', name: 'Can-Am 2 Seater', category: 'Can-Am Vehicles' as const },
    { id: 'CAN-4S', name: 'Can-Am 4 Seater', category: 'Can-Am Vehicles' as const },
    { id: 'YAM-350', name: 'Yamaha 350cc', category: 'Other Vehicles' as const },
    { id: 'RAP-700', name: 'Raptor 700', category: 'Other Vehicles' as const }
  ];

  const reloadVehicles = () => {
    setVehicles(db.getVehicles());
  };

  useEffect(() => {
    reloadVehicles();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!vehicleId.trim() || !vehicleName.trim()) {
      setError('Please provide both Vehicle ID and Name.');
      return;
    }

    try {
      if (editingVehicle) {
        db.updateVehicle(editingVehicle.id, {
          vehicle_id: vehicleId.trim(),
          vehicle_name: vehicleName.trim(),
          vehicle_category: vehicleCategory,
          notes: notes.trim() || undefined
        });
        setSuccess(`Vehicle ${vehicleId} updated successfully!`);
      } else {
        db.addVehicle({
          vehicle_id: vehicleId.trim(),
          vehicle_name: vehicleName.trim(),
          vehicle_category: vehicleCategory,
          status: 'Available',
          notes: notes.trim() || undefined
        });
        setSuccess(`Vehicle ${vehicleId} added to fleet!`);
      }

      setTimeout(() => setSuccess(null), 3000);
      resetForm();
      reloadVehicles();
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle');
    }
  };

  const resetForm = () => {
    setVehicleId('');
    setVehicleName('');
    setVehicleCategory('Quad Bikes');
    setNotes('');
    setEditingVehicle(null);
    setIsAdding(false);
  };

  const handleEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleId(v.vehicle_id);
    setVehicleName(v.vehicle_name);
    setVehicleCategory(v.vehicle_category);
    setNotes(v.notes || '');
    setIsAdding(true);
  };

  const handleStatusChange = (id: number, status: Vehicle['status']) => {
    db.updateVehicle(id, { status });
    reloadVehicles();
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete vehicle ${name}?`)) {
      db.deleteVehicle(id);
      reloadVehicles();
    }
  };

  const applyPreset = (p: typeof presets[0]) => {
    const seq = Math.floor(10 + Math.random() * 90);
    setVehicleId(`${p.id}-${seq}`);
    setVehicleName(p.name);
    setVehicleCategory(p.category);
  };

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicle_id.toLowerCase().includes(search.toLowerCase()) ||
      v.vehicle_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || v.vehicle_category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Car className="w-6 h-6 text-[#FF6B35]" />
            <h2 className="text-xl font-black uppercase tracking-wide">Vehicle Master & Fleet Management</h2>
          </div>
          <p className="text-xs text-stone-300">
            Quad Bikes, Polaris 2/4-Seaters, Can-Am, Yamaha 350cc & Raptor 700 Fleet Inventory
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }}
          className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:opacity-95 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Close Form' : '+ Add New Vehicle'}</span>
        </button>
      </div>

      {/* Add / Edit Form Modal */}
      {isAdding && (
        <div className="bg-white rounded-2xl p-6 border-2 border-orange-300 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#FF6B35]" />
              <span>{editingVehicle ? 'Edit Vehicle Master Data' : 'Add New Vehicle to Fleet'}</span>
            </h3>
            <button type="button" onClick={resetForm} className="text-xs text-stone-500 hover:text-stone-900 font-bold">
              Cancel
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Quick Presets */}
          {!editingVehicle && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block mb-1.5">
                Quick Category Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-[11px] bg-stone-100 hover:bg-orange-50 text-stone-800 hover:text-orange-900 border border-stone-200 hover:border-orange-300 font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-black text-stone-700 mb-1">Vehicle ID / Code *</label>
              <input
                type="text"
                placeholder="e.g. QB-S01"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-hidden focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Vehicle Name / Description *</label>
              <input
                type="text"
                placeholder="e.g. Quad Bike Single Seater 250cc"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Category *</label>
              <select
                value={vehicleCategory}
                onChange={(e) => setVehicleCategory(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-[#FF6B35]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-black text-stone-700 mb-1">Notes / Plate / Specs (Optional)</label>
              <input
                type="text"
                placeholder="e.g. License plate #DXA-99, High-capacity suspension"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-[#FF6B35]"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#FF6B35] hover:bg-[#e0531f] text-white font-black rounded-xl cursor-pointer shadow-sm"
              >
                {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by vehicle ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 font-medium focus:outline-hidden focus:border-[#FF6B35]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented / On Tour</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-[11px] font-black uppercase text-stone-600 tracking-wider">
                <th className="p-3.5">Vehicle ID</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs text-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                    No vehicles found in fleet master data.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-black text-stone-900">{v.vehicle_id}</td>
                    <td className="p-3.5 font-bold">{v.vehicle_name}</td>
                    <td className="p-3.5">
                      <span className="bg-stone-100 border border-stone-200 font-bold text-stone-700 px-2.5 py-1 rounded-lg text-[10px]">
                        {v.vehicle_category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={v.status}
                        onChange={(e) => handleStatusChange(v.id, e.target.value as any)}
                        className={`text-[11px] font-black px-2.5 py-1 rounded-lg border appearance-none cursor-pointer ${
                          v.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : v.status === 'Rented'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Available">✓ Available</option>
                        <option value="Rented">⚡ Rented / Tour</option>
                        <option value="Maintenance">🔧 Maintenance</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-stone-500 italic max-w-xs truncate">{v.notes || '-'}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(v)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                        title="Edit Vehicle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v.id, v.vehicle_name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
