import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileText, 
  Clock, 
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  TrendingDown,
  Scale
} from 'lucide-react';
import { CreditHistoryRecord, PendingExpenseRecord } from '../types';
import { db } from '../db/sqlite';
import { formatAED } from '../lib/utils';

interface CreditHistoryModuleProps {
  initialTab?: 'accounts-receivable' | 'accounts-payable';
}

export const CreditHistoryModule: React.FC<CreditHistoryModuleProps> = ({ 
  initialTab = 'accounts-payable' 
}) => {
  const [activeTab, setActiveTab] = useState<'accounts-receivable' | 'accounts-payable'>(initialTab);

  // Accounts Receivable (B2B Customer Credit) State
  const [arRecords, setArRecords] = useState<CreditHistoryRecord[]>([]);
  const [arSearch, setArSearch] = useState('');
  const [arStatusFilter, setArStatusFilter] = useState('ALL');
  const [selectedArCredit, setSelectedArCredit] = useState<CreditHistoryRecord | null>(null);
  const [arPaymentAmount, setArPaymentAmount] = useState('');
  const [arPaymentMethod, setArPaymentMethod] = useState('Cash');
  const [arNotes, setArNotes] = useState('');

  // Accounts Payable (Expense Credit History) State
  const [apRecords, setApRecords] = useState<PendingExpenseRecord[]>([]);
  const [apSearch, setApSearch] = useState('');
  const [apStatusFilter, setApStatusFilter] = useState('ALL');
  
  // New Expense Credit Form
  const [isAddingAp, setIsAddingAp] = useState(false);
  const [apTitle, setApTitle] = useState('');
  const [apVendorName, setApVendorName] = useState('');
  const [apCategory, setApCategory] = useState('Operating Expenses');
  const [apAmount, setApAmount] = useState('');
  const [apDueDate, setApDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [apNotes, setApNotes] = useState('');

  // Pay Expense Credit Modal
  const [selectedApExpense, setSelectedApExpense] = useState<PendingExpenseRecord | null>(null);
  const [apPayAmount, setApPayAmount] = useState('');
  const [apPaySource, setApPaySource] = useState('Daily Sales Cash');
  const [apPayNotes, setApPayNotes] = useState('');

  // Notification state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = db.getExpenseCategories().map((c) => c.category_name);

  const reloadData = () => {
    setArRecords(db.getCreditHistory());
    setApRecords(db.getPendingExpenses());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Sync initial tab when changed by navigation
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle AR Settlement (Customer Payment Received)
  const handleSettleAr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArCredit) return;
    setError(null);

    const amt = parseFloat(arPaymentAmount) || 0;
    if (amt <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }
    if (amt > selectedArCredit.remaining_amount) {
      setError(`Payment cannot exceed remaining credit balance of ${formatAED(selectedArCredit.remaining_amount)}.`);
      return;
    }

    try {
      db.settleCreditPayment(selectedArCredit.id, amt, arPaymentMethod, arNotes);
      setSuccess(`Successfully recorded B2B customer collection of ${formatAED(amt)}!`);
      setTimeout(() => setSuccess(null), 3000);

      setSelectedArCredit(null);
      setArPaymentAmount('');
      setArNotes('');
      reloadData();
    } catch (err: any) {
      setError(err.message || 'Failed to settle B2B credit payment.');
    }
  };

  // Handle AP Creation (New Unpaid / Credit Expense)
  const handleCreateAp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(apAmount) || 0;
    if (amt <= 0 || !apTitle.trim()) {
      setError('Please provide a valid title and amount greater than 0.');
      return;
    }

    try {
      db.addPendingExpense({
        expense_title: apTitle.trim(),
        supplier_name: apVendorName.trim() || apTitle.trim(),
        vendor_name: apVendorName.trim() || undefined,
        expense_category: apCategory,
        amount: amt,
        due_date: apDueDate,
        notes: apNotes.trim() || undefined
      });

      setSuccess(`Expense Credit entry "${apTitle}" recorded in Accounts Payable!`);
      setTimeout(() => setSuccess(null), 3000);

      setApTitle('');
      setApVendorName('');
      setApAmount('');
      setApNotes('');
      setIsAddingAp(false);
      reloadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create credit expense record.');
    }
  };

  // Handle AP Settlement (Pay Vendor Expense)
  const handlePayAp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApExpense) return;
    setError(null);

    const amt = parseFloat(apPayAmount) || 0;
    const remaining = selectedApExpense.remaining_amount ?? selectedApExpense.amount;
    if (amt <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }
    if (amt > remaining) {
      setError(`Payment cannot exceed remaining balance of ${formatAED(remaining)}.`);
      return;
    }

    try {
      db.payPendingExpense(selectedApExpense.id, amt, apPaySource, apPayNotes);
      setSuccess(`Successfully paid ${formatAED(amt)} towards ${selectedApExpense.expense_title || selectedApExpense.supplier_name || 'Vendor Expense'}! Recorded in ledger.`);
      setTimeout(() => setSuccess(null), 3000);

      setSelectedApExpense(null);
      setApPayAmount('');
      setApPayNotes('');
      reloadData();
    } catch (err: any) {
      setError(err.message || 'Failed to process AP expense payment.');
    }
  };

  // AR Computations
  const filteredAr = arRecords.filter((r) => {
    const matchesSearch =
      r.customer_name.toLowerCase().includes(arSearch.toLowerCase()) ||
      (r.reference_no && r.reference_no.toLowerCase().includes(arSearch.toLowerCase()));
    const matchesStatus = arStatusFilter === 'ALL' || r.status === arStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalArOutstanding = arRecords
    .filter((r) => r.status !== 'Paid')
    .reduce((sum, r) => sum + r.remaining_amount, 0);

  const totalArCollected = arRecords.reduce((sum, r) => sum + r.paid_amount, 0);

  // AP Computations
  const filteredAp = apRecords.filter((r) => {
    const titleText = r.expense_title || r.supplier_name || r.vendor_name || '';
    const vendorText = r.vendor_name || r.supplier_name || '';
    const matchesSearch =
      titleText.toLowerCase().includes(apSearch.toLowerCase()) ||
      vendorText.toLowerCase().includes(apSearch.toLowerCase()) ||
      r.expense_category.toLowerCase().includes(apSearch.toLowerCase());
    const remaining = r.remaining_amount ?? r.amount;
    const isPaid = remaining <= 0 || r.status === 'Paid';
    const isPartial = Boolean((r.paid_amount || 0) > 0 && remaining > 0);
    
    let matchesStatus = true;
    if (apStatusFilter === 'Pending') matchesStatus = !isPaid && !isPartial;
    if (apStatusFilter === 'Partial') matchesStatus = isPartial;
    if (apStatusFilter === 'Paid') matchesStatus = isPaid;

    return matchesSearch && matchesStatus;
  });

  const totalApOutstanding = apRecords
    .filter((r) => (r.remaining_amount ?? r.amount) > 0)
    .reduce((sum, r) => sum + (r.remaining_amount ?? r.amount), 0);

  const totalApPaid = apRecords.reduce((sum, r) => sum + (r.paid_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Messages */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-950 font-bold">✕</button>
        </div>
      )}

      {/* Main Dual Module Selector Header */}
      <div className="bg-[#141724] rounded-2xl p-5 text-white shadow-md border border-stone-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-[#FF6B35]" />
              <h2 className="text-lg font-black uppercase tracking-wide text-stone-100">
                Financial Credit & Debt Management Center
              </h2>
            </div>
            <p className="text-xs text-stone-400">
              Clear accounting separation between <span className="text-rose-400 font-bold">Accounts Payable (Vendor Credit Expenses)</span> and <span className="text-emerald-400 font-bold">Accounts Receivable (B2B Customer Credit)</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-rose-950/80 border border-rose-800/80 px-3.5 py-1.5 rounded-xl text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1 justify-end">
                <ArrowUpRight className="w-3 h-3 text-rose-400" /> Total AP Owed
              </div>
              <div className="text-sm font-black text-rose-200 font-mono">{formatAED(totalApOutstanding)}</div>
            </div>

            <div className="bg-emerald-950/80 border border-emerald-800/80 px-3.5 py-1.5 rounded-xl text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1 justify-end">
                <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Total AR Receivable
              </div>
              <div className="text-sm font-black text-emerald-200 font-mono">{formatAED(totalArOutstanding)}</div>
            </div>
          </div>
        </div>

        {/* Primary Accounting Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('accounts-payable')}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'accounts-payable'
                ? 'bg-rose-950/90 border-rose-500 text-white shadow-lg ring-2 ring-rose-500/30'
                : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div className={`p-2 rounded-lg ${activeTab === 'accounts-payable' ? 'bg-rose-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>Accounts Payable (AP)</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded">
                    Expense Credit History
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Unpaid supplier, vendor & fuel expenses DXA needs to pay
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-black text-rose-300">{formatAED(totalApOutstanding)}</div>
              <div className="text-[10px] text-stone-500">{apRecords.filter(r => (r.remaining_amount ?? r.amount) > 0).length} Unsettled</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts-receivable')}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'accounts-receivable'
                ? 'bg-purple-950/90 border-purple-500 text-white shadow-lg ring-2 ring-purple-500/30'
                : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div className={`p-2 rounded-lg ${activeTab === 'accounts-receivable' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>Accounts Receivable (AR)</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">
                    B2B Customer Credit
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Credit sales & tour booking invoices owed to DXA
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-black text-purple-300">{formatAED(totalArOutstanding)}</div>
              <div className="text-[10px] text-stone-500">{arRecords.filter(r => r.status !== 'Paid').length} Uncollected</div>
            </div>
          </button>
        </div>
      </div>

      {/* TAB 1: ACCOUNTS PAYABLE (EXPENSE CREDIT HISTORY) */}
      {activeTab === 'accounts-payable' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Header Action & Metrics */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-600" />
                <span>Accounts Payable — Vendor & Supplier Expense Ledger</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Record credit expenses from suppliers, maintenance shops, and partners that require deferred payment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingAp(!isAddingAp)}
              className="bg-rose-700 hover:bg-rose-800 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingAp ? 'Close Form' : 'Record New Credit Expense (AP)'}</span>
            </button>
          </div>

          {/* New AP Expense Form */}
          {isAddingAp && (
            <div className="bg-white rounded-2xl p-5 border-2 border-rose-300 shadow-md space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Record Deferred / Credit Expense Entry (Accounts Payable)</span>
                </h4>
                <button
                  onClick={() => setIsAddingAp(false)}
                  className="text-xs text-stone-400 hover:text-stone-700 font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateAp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-black text-stone-700 mb-1">Expense Title / Invoice Item *</label>
                  <input
                    type="text"
                    placeholder="e.g. Quad Bike Spare Parts Bill"
                    value={apTitle}
                    onChange={(e) => setApTitle(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Vendor / Supplier / Creditor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Al Badayer Spare Parts Trading"
                    value={apVendorName}
                    onChange={(e) => setApVendorName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Expense Category *</label>
                  <select
                    value={apCategory}
                    onChange={(e) => setApCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-rose-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Total Credit Amount (AED) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={apAmount}
                    onChange={(e) => setApAmount(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono font-black text-rose-900 focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Payment Due Date *</label>
                  <input
                    type="date"
                    value={apDueDate}
                    onChange={(e) => setApDueDate(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Description / PO Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Invoice #DXA-PUR-882"
                    value={apNotes}
                    onChange={(e) => setApNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingAp(false)}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl cursor-pointer shadow-xs"
                  >
                    Save Accounts Payable Entry
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pay Expense Credit Modal */}
          {selectedApExpense && (
            <div className="bg-white rounded-2xl p-5 border-2 border-rose-500 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-rose-950 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  <span>Settle Accounts Payable — Pay Vendor Expense</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedApExpense(null)}
                  className="text-xs text-stone-400 hover:text-stone-800 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Vendor / Expense: {selectedApExpense.expense_title || selectedApExpense.supplier_name}</span>
                  <span className="font-mono text-rose-900">Total Owed: {formatAED(selectedApExpense.amount)}</span>
                </div>
                <div className="flex justify-between font-mono text-stone-600">
                  <span>Category: {selectedApExpense.expense_category}</span>
                  <span className="font-black text-rose-700">
                    Remaining Unpaid: {formatAED(selectedApExpense.remaining_amount ?? selectedApExpense.amount)}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePayAp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-black text-stone-700 mb-1">Payment Amount (AED) *</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedApExpense.remaining_amount ?? selectedApExpense.amount}
                    placeholder={(selectedApExpense.remaining_amount ?? selectedApExpense.amount).toString()}
                    value={apPayAmount}
                    onChange={(e) => setApPayAmount(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono font-black text-stone-900 focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Payment Cash Source *</label>
                  <select
                    value={apPaySource}
                    onChange={(e) => setApPaySource(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-rose-600"
                  >
                    <option value="Daily Sales Cash">Daily Sales Cash</option>
                    <option value="Bank Transfer">Bank Transfer / Card</option>
                    <option value="Petty Cash Box">Petty Cash Box</option>
                    <option value="Owner Capital">Owner Capital / Injection</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Payment Reference / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via Bank Transfer Tx #9981"
                    value={apPayNotes}
                    onChange={(e) => setApPayNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-rose-600"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedApExpense(null)}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl cursor-pointer shadow-xs"
                  >
                    Execute AP Expense Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Status Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search vendor, title, or category..."
                value={apSearch}
                onChange={(e) => setApSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 font-medium focus:outline-hidden focus:border-rose-600"
              />
            </div>

            <select
              value={apStatusFilter}
              onChange={(e) => setApStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
            >
              <option value="ALL">All AP Statuses</option>
              <option value="Pending">Unpaid Pending</option>
              <option value="Partial">Partially Paid</option>
              <option value="Paid">Fully Paid / Settled</option>
            </select>
          </div>

          {/* AP Expense Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-[11px] font-black uppercase text-stone-600 tracking-wider">
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Vendor / Supplier</th>
                    <th className="p-3.5">Expense Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Total Amount</th>
                    <th className="p-3.5 text-right">Paid Amount</th>
                    <th className="p-3.5 text-right">Remaining AP Owed</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs text-stone-800">
                  {filteredAp.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-stone-400">
                        No Accounts Payable records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAp.map((r) => {
                      const remaining = r.remaining_amount ?? r.amount;
                      const isPaid = remaining <= 0 || r.status === 'Paid';
                      const isPartial = r.paid_amount && r.paid_amount > 0 && remaining > 0;

                      return (
                        <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-3.5 font-mono text-stone-600">{r.due_date || r.created_date || '-'}</td>
                          <td className="p-3.5 font-bold text-stone-900">{r.vendor_name || r.supplier_name || 'General Supplier'}</td>
                          <td className="p-3.5 font-medium text-stone-800">{r.expense_title || 'Credit Expense'}</td>
                          <td className="p-3.5 text-stone-600 font-mono text-[11px]">{r.expense_category}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-stone-900">{formatAED(r.amount)}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{formatAED(r.paid_amount || 0)}</td>
                          <td className="p-3.5 text-right font-mono font-black text-rose-600">{formatAED(remaining)}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPartial
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPaid ? 'Fully Paid' : isPartial ? 'Partial' : 'Unpaid AP'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedApExpense(r);
                                  setApPayAmount(remaining.toString());
                                }}
                                className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ml-auto"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Pay Expense</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600">Settled ✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS RECEIVABLE (B2B CUSTOMER CREDIT) */}
      {activeTab === 'accounts-receivable' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Header Action & Summary */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span>Accounts Receivable — B2B Customer & Agency Ledger</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Track credit tour sales, tour agency invoices, and collections received from B2B partners.
              </p>
            </div>
          </div>

          {/* AR Settlement Modal */}
          {selectedArCredit && (
            <div className="bg-white rounded-2xl p-5 border-2 border-purple-500 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-purple-950 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span>Settle Accounts Receivable — Record B2B Customer Payment</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedArCredit(null)}
                  className="text-xs text-stone-400 hover:text-stone-800 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Customer / Agency: {selectedArCredit.customer_name}</span>
                  <span className="font-mono text-purple-900">Total Invoice: {formatAED(selectedArCredit.total_amount)}</span>
                </div>
                <div className="flex justify-between font-mono text-stone-600">
                  <span>Reference: {selectedArCredit.reference_no || '-'}</span>
                  <span className="font-black text-rose-700">
                    Remaining Uncollected: {formatAED(selectedArCredit.remaining_amount)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSettleAr} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-black text-stone-700 mb-1">Collection Amount (AED) *</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedArCredit.remaining_amount}
                    placeholder={selectedArCredit.remaining_amount.toString()}
                    value={arPaymentAmount}
                    onChange={(e) => setArPaymentAmount(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-mono font-black text-stone-900 focus:outline-hidden focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Payment Method *</label>
                  <select
                    value={arPaymentMethod}
                    onChange={(e) => setArPaymentMethod(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:outline-hidden focus:border-purple-600"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-stone-700 mb-1">Receipt Ref / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Received via Cheque #1029"
                    value={arNotes}
                    onChange={(e) => setArNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:border-purple-600"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedArCredit(null)}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl cursor-pointer shadow-xs"
                  >
                    Record Collection Settlement
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Status Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by B2B customer name or reference no..."
                value={arSearch}
                onChange={(e) => setArSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 font-medium focus:outline-hidden focus:border-purple-600"
              />
            </div>

            <select
              value={arStatusFilter}
              onChange={(e) => setArStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
            >
              <option value="ALL">All AR Statuses</option>
              <option value="Outstanding">Uncollected Outstanding</option>
              <option value="Partial">Partially Collected</option>
              <option value="Paid">Fully Collected / Paid</option>
            </select>
          </div>

          {/* AR Credit Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-[11px] font-black uppercase text-stone-600 tracking-wider">
                    <th className="p-3.5">Invoice Date</th>
                    <th className="p-3.5">B2B Customer / Agency</th>
                    <th className="p-3.5">Reference No</th>
                    <th className="p-3.5 text-right">Invoice Amount</th>
                    <th className="p-3.5 text-right">Collected Amount</th>
                    <th className="p-3.5 text-right">Remaining Receivable</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs text-stone-800">
                  {filteredAr.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        No Accounts Receivable records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAr.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono text-stone-600">{r.credit_date || r.invoice_date || '-'}</td>
                        <td className="p-3.5 font-bold text-stone-900">{r.customer_name}</td>
                        <td className="p-3.5 font-mono text-stone-600">{r.reference_no || '-'}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-stone-900">{formatAED(r.total_amount)}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{formatAED(r.paid_amount)}</td>
                        <td className="p-3.5 text-right font-mono font-black text-rose-600">{formatAED(r.remaining_amount)}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                              r.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'Partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {r.status === 'Paid' ? 'Fully Collected' : r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {r.status !== 'Paid' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedArCredit(r);
                                setArPaymentAmount(r.remaining_amount.toString());
                              }}
                              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ml-auto"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Settle Collection</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600">Collected ✓</span>
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
      )}
    </div>
  );
};
