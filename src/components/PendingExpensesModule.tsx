import React, { useState, useEffect } from 'react';
import { TrendingDown, DollarSign, Calendar, Search, CheckCircle2, AlertCircle, Plus, FileText, Clock } from 'lucide-react';
import { PendingExpenseRecord } from '../types';
import { db } from '../db/sqlite';
import { formatAED } from '../lib/utils';

export const PendingExpensesModule: React.FC = () => {
  const [pendingList, setPendingList] = useState<PendingExpenseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Pending Expense Form State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('Operating Expenses');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Payment Processing Modal State
  const [selectedPending, setSelectedPending] = useState<PendingExpenseRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paySource, setPaySource] = useState('Daily Sales Cash');
  const [payNotes, setPayNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = db.getExpenseCategories().map((c) => c.category_name);

  const reloadPending = () => {
    setPendingList(db.getPendingExpenses());
  };

  useEffect(() => {
    reloadPending();
  }, []);

  const handleCreatePending = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || !title.trim()) {
      setError('Please provide a valid title and amount greater than 0.');
      return;
    }

    try {
      db.addPendingExpense({
        expense_title: title.trim(),
        supplier_name: vendorName.trim() || title.trim(),
        vendor_name: vendorName.trim() || undefined,
        expense_category: category,
        amount: amt,
        due_date: dueDate,
        notes: notes.trim() || undefined
      });

      setSuccess(`Pending expense "${title}" created successfully!`);
      setTimeout(() => setSuccess(null), 3000);

      setTitle('');
      setVendorName('');
      setAmount('');
      setNotes('');
      setIsAdding(false);
      reloadPending();
    } catch (err: any) {
      setError(err.message || 'Failed to create pending expense.');
    }
  };

  const handlePayPending = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPending) return;
    setError(null);

    const amt = parseFloat(payAmount) || 0;
    const remaining = selectedPending.remaining_amount ?? selectedPending.amount;
    if (amt <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }
    if (amt > remaining) {
      setError(`Payment cannot exceed remaining pending amount of ${formatAED(remaining)}.`);
      return;
    }

    try {
      db.payPendingExpense(selectedPending.id, amt, paySource, payNotes);
      setSuccess(`Successfully paid ${formatAED(amt)} towards ${selectedPending.expense_title || selectedPending.supplier_name || 'Expense'}! Expense recorded.`);
      setTimeout(() => setSuccess(null), 3000);

      setSelectedPending(null);
      setPayAmount('');
      setPayNotes('');
      reloadPending();
    } catch (err: any) {
      setError(err.message || 'Failed to process expense payment.');
    }
  };

  const totalPendingUnpaid = pendingList
    .filter((p) => p.status !== 'Paid')
    .reduce((sum, p) => sum + (p.remaining_amount ?? p.amount), 0);

  const filtered = pendingList.filter((p) => {
    const titleOrSupplier = p.expense_title || p.supplier_name || '';
    const vendor = p.vendor_name || p.supplier_name || '';
    const matchesSearch =
      titleOrSupplier.toLowerCase().includes(search.toLowerCase()) ||
      vendor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Clock className="w-6 h-6 text-rose-400" />
            <h2 className="text-xl font-black uppercase tracking-wide">Accounts Payable (Expense Credit History)</h2>
          </div>
          <p className="text-xs text-stone-300">
            Log unpaid bills, supplier credit expenses, vendor payables, due dates, and execute expense payment workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-950/80 border border-rose-800 px-4 py-2.5 rounded-2xl text-right">
            <div className="text-[10px] font-black uppercase tracking-wider text-rose-300">Total Unpaid Pending Bills</div>
            <div className="text-lg font-black text-white font-mono">{formatAED(totalPendingUnpaid)}</div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:opacity-95 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Close Form' : '+ Add Pending Expense'}</span>
          </button>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {selectedPending && (
        <div className="bg-white rounded-2xl p-6 border-2 border-rose-400 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-600" />
              <span>Process Expense Payment Workflow</span>
            </h3>
            <button
              type="button"
              onClick={() => setSelectedPending(null)}
              className="text-xs text-stone-500 hover:text-stone-900 font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
            <div className="flex justify-between font-bold">
              <span>Title: {selectedPending.expense_title || selectedPending.supplier_name}</span>
              <span className="font-mono text-rose-900">Total Bill: {formatAED(selectedPending.amount)}</span>
            </div>
            <div className="flex justify-between font-mono text-stone-600">
              <span>Vendor: {selectedPending.vendor_name || selectedPending.supplier_name || '-'}</span>
              <span className="font-bold text-rose-700">Remaining Balance: {formatAED(selectedPending.remaining_amount ?? selectedPending.amount)}</span>
            </div>
          </div>

          <form onSubmit={handlePayPending} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-black text-stone-700 mb-1">Payment Amount (AED) *</label>
              <input
                type="number"
                step="0.01"
                max={selectedPending.remaining_amount ?? selectedPending.amount}
                placeholder={(selectedPending.remaining_amount ?? selectedPending.amount).toString()}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono font-black text-stone-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Cash Source *</label>
              <select
                value={paySource}
                onChange={(e) => setPaySource(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-rose-600"
              >
                <option value="Daily Sales Cash">Daily Sales Cash (Main Drawer)</option>
                <option value="Petty Cash Box">Petty Cash Box</option>
                <option value="Bank Account">Bank Account / Transfer</option>
              </select>
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Payment Notes / Ref</label>
              <input
                type="text"
                placeholder="e.g. Paid via Cash Voucher #502"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPending(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl cursor-pointer shadow-sm"
              >
                Execute Payment & Log Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Pending Expense Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl p-6 border-2 border-rose-300 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Create New Pending Expense / Unpaid Bill</span>
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

          <form onSubmit={handleCreatePending} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-black text-stone-700 mb-1">Expense Title / Description *</label>
              <input
                type="text"
                placeholder="e.g. Fuel Invoice - Al Ain Petroleum"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Vendor / Supplier Name</label>
              <input
                type="text"
                placeholder="e.g. Yamaha Spares Dubai"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-rose-600"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
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
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono font-black text-stone-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div>
              <label className="block font-black text-stone-700 mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Terms 30 days"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl cursor-pointer shadow-sm"
              >
                Save Pending Bill
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
            placeholder="Search by title or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 font-medium focus:outline-hidden focus:border-rose-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
        >
          <option value="ALL">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial Paid</option>
          <option value="Paid">Fully Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-[11px] font-black uppercase text-stone-600 tracking-wider">
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Bill Amount</th>
                <th className="p-3.5 text-right">Paid Amount</th>
                <th className="p-3.5 text-right">Remaining</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs text-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No pending expenses recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3.5 font-bold text-stone-900">{p.expense_title || p.supplier_name}</td>
                    <td className="p-3.5 font-medium text-stone-700">{p.vendor_name || p.supplier_name || '-'}</td>
                    <td className="p-3.5 font-mono text-stone-600">{p.due_date || '-'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                      {formatAED(p.amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatAED(p.paid_amount || 0)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-rose-600">
                      {formatAED(p.remaining_amount ?? (p.amount - (p.paid_amount || 0)))}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          p.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Partially Paid' || p.status === 'Partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {p.status !== 'Paid' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPending(p);
                            setPayAmount((p.remaining_amount ?? (p.amount - (p.paid_amount || 0))).toString());
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ml-auto"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pay Expense</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600">Paid ✓</span>
                      )}
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
