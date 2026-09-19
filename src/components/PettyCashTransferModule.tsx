import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Calendar, Search, CheckCircle2, AlertCircle, Plus, Wallet } from 'lucide-react';
import { PettyCashTransfer } from '../types';
import { db } from '../db/sqlite';
import { formatAED } from '../lib/utils';

export const PettyCashTransferModule: React.FC = () => {
  const [transfers, setTransfers] = useState<PettyCashTransfer[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // New Transfer / Return Form Modal
  const [isAdding, setIsAdding] = useState(false);
  const [transferType, setTransferType] = useState<'Transfer' | 'Return'>('Transfer');
  const [amount, setAmount] = useState('');
  const [transferredTo, setTransferredTo] = useState('Petty Cash Box');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reloadTransfers = () => {
    setTransfers(db.getPettyCashTransfers());
  };

  useEffect(() => {
    reloadTransfers();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    try {
      db.addPettyCashTransfer({
        transfer_type: transferType,
        amount: amt,
        transferred_to: transferredTo.trim() || 'Petty Cash Box',
        notes: notes.trim() || undefined
      });

      setSuccess(`${transferType === 'Transfer' ? 'Petty Cash Transfer' : 'Petty Cash Return'} of ${formatAED(amt)} recorded successfully!`);
      setTimeout(() => setSuccess(null), 3000);

      setAmount('');
      setNotes('');
      setIsAdding(false);
      reloadTransfers();
    } catch (err: any) {
      setError(err.message || 'Failed to record transfer.');
    }
  };

  const totalTransferred = transfers
    .filter((t) => t.transfer_type === 'Transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReturned = transfers
    .filter((t) => t.transfer_type === 'Return')
    .reduce((sum, t) => sum + t.amount, 0);

  const netPettyCash = totalTransferred - totalReturned;

  const filtered = transfers.filter((t) => {
    const toName = t.transferred_to || t.transfer_to_counter || '';
    const noteText = t.notes || t.reason || '';
    const matchesSearch =
      toName.toLowerCase().includes(search.toLowerCase()) ||
      noteText.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.transfer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Wallet className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black uppercase tracking-wide">Petty Cash Transfer & Return System</h2>
          </div>
          <p className="text-xs text-stone-300">
            Transfer daily cash to petty cash box, manage staff floats, and return unused cash back to drawer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-800/80 border border-stone-700 px-4 py-2.5 rounded-2xl text-right">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">Net Petty Cash Issued</div>
            <div className="text-lg font-black text-white font-mono">{formatAED(netPettyCash)}</div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:opacity-95 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Close Form' : '+ New Transfer / Return'}</span>
          </button>
        </div>
      </div>

      {/* Transfer Form Modal */}
      {isAdding && (
        <div className="bg-white rounded-2xl p-6 border-2 border-amber-400 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>Record Petty Cash Transfer or Return</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-stone-500 hover:text-stone-900 font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-black text-stone-700 mb-1">Transaction Type *</label>
              <select
                value={transferType}
                onChange={(e) => setTransferType(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-amber-600"
              >
                <option value="Transfer">Transfer Out (Drawer ➔ Petty Box)</option>
                <option value="Return">Return In (Petty Box ➔ Drawer)</option>
              </select>
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Amount (AED) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono font-black text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Destination / Staff Name *</label>
              <input
                type="text"
                placeholder="e.g. Petty Cash Box / Manager Float"
                value={transferredTo}
                onChange={(e) => setTransferredTo(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Notes / Reason</label>
              <input
                type="text"
                placeholder="e.g. Fuel float for quad buggies"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl cursor-pointer shadow-sm"
              >
                Save {transferType}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by destination or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 font-medium focus:outline-hidden focus:border-amber-600"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
        >
          <option value="ALL">All Types</option>
          <option value="Transfer">Transfers Out</option>
          <option value="Return">Returns In</option>
        </select>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-[11px] font-black uppercase text-stone-600 tracking-wider">
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Destination / Recipient</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs text-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    No petty cash transfers recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3.5 font-mono text-stone-600">
                      {t.transfer_date} {t.transfer_time.substring(0, 5)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit ${
                          t.transfer_type === 'Transfer'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.transfer_type === 'Transfer' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3" />
                        )}
                        <span>{t.transfer_type}</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-stone-900">{t.transferred_to}</td>
                    <td
                      className={`p-3.5 text-right font-mono font-black ${
                        t.transfer_type === 'Transfer' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {t.transfer_type === 'Transfer' ? '-' : '+'}{formatAED(t.amount)}
                    </td>
                    <td className="p-3.5 text-stone-500 italic max-w-xs truncate">{t.notes || '-'}</td>
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
