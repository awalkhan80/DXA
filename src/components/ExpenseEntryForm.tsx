import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  Building2,
  Utensils,
  Fuel,
  Wrench,
  Paperclip,
  Users,
  Zap,
  ShieldCheck,
  Megaphone,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Tag,
  Store,
  Layers
} from 'lucide-react';
import { ExpenseCategory, CashSource, ExpenseFormData, ExpenseRecord } from '../types';
import { formatAED } from '../lib/utils';

interface ExpenseEntryFormProps {
  categories: ExpenseCategory[];
  cashSources: CashSource[];
  todayExpenses?: ExpenseRecord[];
  allExpenses?: ExpenseRecord[];
  onSaveExpense: (data: ExpenseFormData) => void;
  onUpdateExpense?: (id: number, data: Partial<ExpenseFormData>) => void;
  onAddExpenseCategory?: (name: string) => void;
  onAddCashSource?: (name: string) => void;
  editingExpense?: ExpenseRecord | null;
  onCancelEdit?: () => void;
  onEditExpense?: (expense: ExpenseRecord) => void;
  onDeleteExpense?: (id: number) => void;
  onOpenCapitalModal?: () => void;
}

export const ExpenseEntryForm: React.FC<ExpenseEntryFormProps> = ({
  categories,
  cashSources,
  onSaveExpense,
  onUpdateExpense,
  onAddExpenseCategory,
  onAddCashSource,
  editingExpense,
  onCancelEdit,
  onOpenCapitalModal
}) => {
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [expenseTime, setExpenseTime] = useState<string>('');
  const [isAutoTime, setIsAutoTime] = useState<boolean>(true);
  const [expenseCategory, setExpenseCategory] = useState<string>('Fuel & Maintenance');
  const [expenseSource, setExpenseSource] = useState<string>('Daily Sales Cash');
  const [amount, setAmount] = useState<string>('');
  const [paidTo, setPaidTo] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showOptional, setShowOptional] = useState<boolean>(false);

  // Inline Add New Category & Source states
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isAddingSource, setIsAddingSource] = useState<boolean>(false);
  const [newSourceName, setNewSourceName] = useState<string>('');

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  const activeCategories = categories.filter((c) => c.is_active === 1);
  const activeSources = cashSources.filter((s) => s.is_active === 1);

  // Common quick vendor suggestions for fast voucher recording
  const commonVendors = [
    'ADNOC Petrol',
    'Emarat Station',
    'Al Ain Water & Ice',
    'Supermarket Supply',
    'Staff Meal & Tea',
    'Quad Parts Workshop',
    'DEWA / Utility'
  ];

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('fuel') || lower.includes('diesel') || lower.includes('petrol')) return Fuel;
    if (lower.includes('maint') || lower.includes('repair') || lower.includes('part')) return Wrench;
    if (lower.includes('food') || lower.includes('beverage') || lower.includes('kitchen')) return Utensils;
    if (lower.includes('staff') || lower.includes('salary') || lower.includes('meal')) return Users;
    if (lower.includes('rent') || lower.includes('stall')) return Store;
    if (lower.includes('utility') || lower.includes('bill') || lower.includes('dewa')) return Zap;
    if (lower.includes('market') || lower.includes('ad')) return Megaphone;
    if (lower.includes('license') || lower.includes('gov')) return ShieldCheck;
    if (lower.includes('office') || lower.includes('supply')) return Paperclip;
    return Tag;
  };

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toTimeString().split(' ')[0].substring(0, 5);

    if (!editingExpense) {
      setExpenseDate(formattedDate);
      setExpenseTime(formattedTime);
    }
  }, []);

  useEffect(() => {
    if (editingExpense || !isAutoTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      setExpenseTime(now.toTimeString().split(' ')[0].substring(0, 5));
    }, 15000);
    return () => clearInterval(interval);
  }, [isAutoTime, editingExpense]);

  useEffect(() => {
    if (editingExpense) {
      setExpenseDate(editingExpense.expense_date);
      setExpenseTime(editingExpense.expense_time ? editingExpense.expense_time.substring(0, 5) : '');
      setIsAutoTime(false);
      setExpenseCategory(editingExpense.expense_category);
      setExpenseSource(editingExpense.expense_source);
      setAmount(editingExpense.amount.toString());
      setPaidTo(editingExpense.paid_to || '');
      setReferenceNo(editingExpense.reference_no || '');
      setDescription(editingExpense.description || '');
      setValidationErrors({});
      setShowOptional(Boolean(editingExpense.paid_to || editingExpense.reference_no || editingExpense.description));
    }
  }, [editingExpense]);

  // Set initial category when activeCategories loads
  useEffect(() => {
    if (!editingExpense && activeCategories.length > 0 && !activeCategories.some(c => c.category_name === expenseCategory)) {
      setExpenseCategory(activeCategories[0].category_name);
    }
  }, [categories]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    try {
      if (onAddExpenseCategory) {
        onAddExpenseCategory(trimmed);
      }
      setExpenseCategory(trimmed);
      setNewCategoryName('');
      setIsAddingCategory(false);
      setSuccessToast(`Added & selected Category "${trimmed}"!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setValidationErrors({ general: err.message || 'Failed to add category' });
    }
  };

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSourceName.trim();
    if (!trimmed) return;
    try {
      if (onAddCashSource) {
        onAddCashSource(trimmed);
      }
      setExpenseSource(trimmed);
      setNewSourceName('');
      setIsAddingSource(false);
      setSuccessToast(`Added & selected Cash Source "${trimmed}"!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setValidationErrors({ general: err.message || 'Failed to add source' });
    }
  };

  const resetForm = () => {
    const now = new Date();
    setExpenseDate(now.toISOString().split('T')[0]);
    setExpenseTime(now.toTimeString().split(' ')[0].substring(0, 5));
    setIsAutoTime(true);
    setExpenseCategory(activeCategories[0]?.category_name || 'Fuel & Maintenance');
    setExpenseSource(activeSources[0]?.source_name || 'Daily Sales Cash');
    setAmount('');
    setPaidTo('');
    setReferenceNo('');
    setDescription('');
    setValidationErrors({});
    setShowOptional(false);
    if (onCancelEdit) onCancelEdit();
  };

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    if (!expenseCategory) {
      errors.expenseCategory = 'Please select an expense category';
    }
    if (!expenseSource) {
      errors.expenseSource = 'Select where cash was spent from';
    }
    if (!expenseDate) errors.expenseDate = 'Expense date is required';
    if (!expenseTime) errors.expenseTime = 'Expense time is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validate()) return;

    const parsedAmount = parseFloat(amount);

    const formData: ExpenseFormData = {
      expense_date: expenseDate,
      expense_time: expenseTime.length === 5 ? `${expenseTime}:00` : expenseTime,
      expense_category: expenseCategory,
      expense_source: expenseSource,
      amount: parsedAmount,
      paid_to: paidTo.trim(),
      reference_no: referenceNo.trim(),
      description: description.trim()
    };

    try {
      if (editingExpense && onUpdateExpense) {
        onUpdateExpense(editingExpense.id, formData);
        setSuccessToast(`Expense #${editingExpense.id} updated successfully!`);
      } else {
        onSaveExpense(formData);
        setSuccessToast(`Expense of ${formatAED(parsedAmount)} recorded!`);
        resetForm();
      }

      setTimeout(() => setSuccessToast(null), 3500);
      amountInputRef.current?.focus();
    } catch (err: any) {
      setValidationErrors({ general: err.message || 'Error saving expense' });
    }
  };

  const addPresetAmount = (preset: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount((cur + preset).toString());
    amountInputRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-3 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-sm">
            💸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-stone-800">
                {editingExpense ? `Edit Expense #${editingExpense.id}` : 'Record Expense Voucher'}
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                editingExpense ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {editingExpense ? 'Editing' : 'Expense Voucher'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Record operational costs, fuel, maintenance, petty cash payouts, and supplier bills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCapitalModal && (
            <button
              type="button"
              onClick={onOpenCapitalModal}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Owner Capital Inflow</span>
            </button>
          )}

          {editingExpense && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successToast && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-bold">{successToast}</span>
        </div>
      )}

      {validationErrors.general && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-bold">{validationErrors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Step 1: Expense Category + Add New Category */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>1. Expense Category</span>
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Category</span>
            </button>
          </div>

          {/* Quick Add Category Inline Box */}
          {isAddingCategory && (
            <div className="mb-3 p-3 bg-rose-50/80 rounded-xl border border-rose-200 flex items-center gap-2 animate-in fade-in">
              <input
                type="text"
                placeholder="Enter new category name (e.g. Quad Tires, Generator Fuel, Camp Rent)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-hidden focus:border-rose-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Save Category
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {activeCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.category_name);
              const isSelected = expenseCategory === cat.category_name;
              return (
                <button
                  type="button"
                  key={cat.category_name}
                  onClick={() => setExpenseCategory(cat.category_name)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/70 text-rose-800 shadow-2xs scale-[1.01]'
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{cat.category_name}</span>
                </button>
              );
            })}

            {/* Quick Add Tile inside the grid */}
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-stone-300 hover:border-rose-400 bg-stone-50/50 hover:bg-rose-50/50 text-stone-500 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 text-stone-400">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">+ Add Category</span>
            </button>
          </div>
        </div>

        {/* Step 2: Cash Source & Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cash Source */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span>2. Paid From (Cash Source)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingSource(!isAddingSource)}
                  className="text-[10px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-stone-200 border border-stone-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>+ Source</span>
                </button>
              </div>

              {/* Quick Add Source Inline Box */}
              {isAddingSource && (
                <div className="mb-2 p-2.5 bg-white rounded-xl border border-stone-300 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="e.g. Dubai Islamic Bank, Petty Box 2"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs text-stone-800 focus:outline-hidden focus:border-stone-700"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateSource}
                    disabled={!newSourceName.trim()}
                    className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSource(false)}
                    className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                {activeSources.map((src) => {
                  const isSelected = expenseSource === src.source_name;
                  return (
                    <button
                      type="button"
                      key={src.source_name}
                      onClick={() => setExpenseSource(src.source_name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{src.source_name}</span>
                      {src.source_name === 'Daily Sales Cash' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Deducts Drawer Safe
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border-2 border-rose-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-rose-900">
                  3. Expense Amount <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-rose-700 font-bold">AED</span>
              </div>
              <div className="relative">
                <input
                  ref={amountInputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full text-2xl font-black bg-white border-2 border-rose-300 rounded-xl pl-3 pr-14 py-2.5 text-rose-900 focus:outline-hidden focus:border-rose-600 font-mono shadow-2xs"
                />
                <span className="absolute right-3 top-3.5 text-xs font-black text-rose-600 font-mono">
                  AED
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {[50, 100, 200, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addPresetAmount(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-stone-700 hover:text-rose-800 border border-stone-300 font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {validationErrors.amount && (
              <p className="text-[11px] text-rose-600 font-bold mt-2">{validationErrors.amount}</p>
            )}
          </div>
        </div>

        {/* Date & Time Row */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Date:</span>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Time:</span>
              <input
                type="time"
                value={expenseTime}
                onChange={(e) => {
                  setExpenseTime(e.target.value);
                  setIsAutoTime(false);
                }}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="text-xs text-stone-500 hover:text-stone-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Optional Details (Paid To / Vendor, Bill Ref, Description)</span>
            {showOptional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Optional Details */}
        {showOptional && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-3">
            {/* Quick Vendor Chips */}
            <div>
              <span className="text-[11px] font-bold text-stone-600 block mb-1.5">
                Quick Vendor / Supplier Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {commonVendors.map((vendor) => (
                  <button
                    key={vendor}
                    type="button"
                    onClick={() => setPaidTo(vendor)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition-colors cursor-pointer"
                  >
                    + {vendor}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-stone-600 mb-1">Paid To / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. ADNOC Fuel Station / Emarat"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-600 mb-1">Bill / Voucher Ref</label>
                <input
                  type="text"
                  placeholder="e.g. INV-9901 / Receipt #442"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-600 mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Quad buggy diesel refill for morning trip"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="submit"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-black px-8 py-3 rounded-xl text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{editingExpense ? 'Update Expense Voucher' : 'Save Expense Voucher'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
