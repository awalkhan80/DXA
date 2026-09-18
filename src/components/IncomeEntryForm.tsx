import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Globe,
  Camera,
  Store,
  CupSoda,
  Popcorn as PopcornIcon,
  Compass,
  ChevronDown,
  ChevronUp,
  Plus,
  Building,
  UserCheck,
  User,
  X,
  Info,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { PaymentMethod, SaleCounter, SaleFormData, SaleRecord, B2BCustomer, TourGuide } from '../types';
import { formatAED } from '../lib/utils';

export const validateSale = (data: {
  sale_counter?: string;
  payment_method?: string;
  gross_amount: number;
  commission_amount: number;
  guide_name?: string;
}): string | null => {
  if (!data.sale_counter) return "Select sale counter";
  if (!data.payment_method) return "Select payment method";
  if (data.gross_amount <= 0) return "Amount must be greater than 0";
  if (data.commission_amount < 0) return "Commission cannot be negative";
  if (data.commission_amount > data.gross_amount) return "Commission cannot exceed gross amount";
  // Guide selection is mandatory ONLY when a commission is entered
  if (data.commission_amount > 0 && (!data.guide_name || !data.guide_name.trim())) {
    return "Guide selection (Sajid, Shahid, or Add New) is required when a commission is entered.";
  }
  return null;
};

interface IncomeEntryFormProps {
  counters: SaleCounter[];
  paymentMethods: PaymentMethod[];
  b2bCustomers?: B2BCustomer[];
  tourGuides?: TourGuide[];
  editingRecord: SaleRecord | null;
  onSave: (data: SaleFormData) => void;
  onCancelEdit: () => void;
  onAddCounter?: (name: string) => void;
  onAddPaymentMethod?: (name: string) => void;
  onAddB2BCustomer?: (name: string) => void;
  onAddTourGuide?: (name: string) => void;
  formRef?: React.RefObject<HTMLDivElement | null>;
}

export const IncomeEntryForm: React.FC<IncomeEntryFormProps> = ({
  counters,
  paymentMethods,
  b2bCustomers = [],
  tourGuides = [],
  editingRecord,
  onSave,
  onCancelEdit,
  onAddCounter,
  onAddPaymentMethod,
  onAddB2BCustomer,
  onAddTourGuide,
  formRef
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0].substring(0, 5);
  };

  const [date, setDate] = useState<string>(getTodayDate());
  const [time, setTime] = useState<string>(getCurrentTime());
  const [isAutoTime, setIsAutoTime] = useState<boolean>(true);

  const fallbackCounters = [
    { name: 'DXA Sale Counter', icon: Compass },
    { name: 'Photo Sale', icon: Camera },
    { name: 'Juice Counter Sale', icon: CupSoda },
    { name: 'Supermarket Sale', icon: Store },
    { name: 'Popcorn', icon: PopcornIcon }
  ];

  const activeCounters = counters.filter((c) => c.is_active === 1);
  // Clean and deduplicate payment methods, ensuring 'B2B' has no 'Car' prefix
  const seenMethods = new Set<string>();
  const activePaymentMethods = paymentMethods
    .filter((p) => p.is_active === 1)
    .map((p) => ({
      ...p,
      method_name: p.method_name === 'Car B2B' ? 'B2B' : p.method_name
    }))
    .filter((p) => {
      if (seenMethods.has(p.method_name)) return false;
      seenMethods.add(p.method_name);
      return true;
    });
  const activeB2BCustomers = b2bCustomers.filter((b) => b.is_active === 1);
  const activeTourGuides = tourGuides.filter((g) => g.is_active === 1);

  // Default B2B presets if list empty
  const defaultB2BPresets = [
    'Tripa tour',
    'DFT',
    'Dream Journey',
    'Sand Journey',
    'Desert Tiger'
  ];

  const availableB2BNames = activeB2BCustomers.length > 0 
    ? activeB2BCustomers.map(b => b.customer_name)
    : defaultB2BPresets;

  // Default Guides presets - default options: Sajid, Shahid
  const defaultGuidePresets = ['Sajid', 'Shahid'];
  const activeGuideList = activeTourGuides.map((g) => g.guide_name);
  const availableGuideNames = Array.from(
    new Set([...defaultGuidePresets, ...activeGuideList])
  );

  const [saleType, setSaleType] = useState<'B2B' | 'B2C'>('B2C');
  const [selectedCounter, setSelectedCounter] = useState<string>('DXA Sale Counter');
  const [selectedPayment, setSelectedPayment] = useState<string>('Cash');
  const [selectedB2BCustomer, setSelectedB2BCustomer] = useState<string>('');
  const [selectedGuide, setSelectedGuide] = useState<string>('');

  const generateAutoRef = (type: 'B2B' | 'B2C', selectedDate: string) => {
    const dateStr = (selectedDate || getTodayDate()).replace(/-/g, '');
    const seq = Math.floor(1000 + Math.random() * 9000);
    return `DXA-${type}-${dateStr}-${seq}`;
  };

  const [grossAmount, setGrossAmount] = useState<string>('');
  const [commissionAmount, setCommissionAmount] = useState<string>('');

  const [referenceNo, setReferenceNo] = useState<string>(() => generateAutoRef('B2C', getTodayDate()));
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);

  // Quick Inline Add Modal States
  const [isAddingB2B, setIsAddingB2B] = useState<boolean>(false);
  const [newB2BName, setNewB2BName] = useState<string>('');
  const [isAddingGuide, setIsAddingGuide] = useState<boolean>(false);
  const [newGuideName, setNewGuideName] = useState<string>('');
  const [isAddingCounter, setIsAddingCounter] = useState<boolean>(false);
  const [newCounterName, setNewCounterName] = useState<string>('');
  const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
  const [newPaymentName, setNewPaymentName] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const grossInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAutoTime || editingRecord) return;
    const interval = setInterval(() => {
      setTime(getCurrentTime());
    }, 15000);
    return () => clearInterval(interval);
  }, [isAutoTime, editingRecord]);

  useEffect(() => {
    if (editingRecord) {
      const isB2B = editingRecord.sale_type === 'B2B' || 
                    editingRecord.payment_method?.toUpperCase().includes('B2B') ||
                    availableB2BNames.some(n => n.toLowerCase() === editingRecord.customer_name?.toLowerCase());
      const recSaleType: 'B2B' | 'B2C' = editingRecord.sale_type || (isB2B ? 'B2B' : 'B2C');
      setSaleType(recSaleType);
      setDate(editingRecord.sale_date);
      setTime(editingRecord.sale_time.substring(0, 5));
      setSelectedCounter(editingRecord.sale_counter);
      setSelectedPayment(editingRecord.payment_method === 'Car B2B' ? 'B2B' : editingRecord.payment_method);
      setGrossAmount(editingRecord.gross_amount.toString());
      setCommissionAmount(
        editingRecord.commission_amount > 0 ? editingRecord.commission_amount.toString() : ''
      );
      setReferenceNo(editingRecord.reference_no || generateAutoRef(recSaleType, editingRecord.sale_date));
      setCustomerName(editingRecord.customer_name || '');
      setSelectedB2BCustomer(editingRecord.customer_name || '');
      setSelectedGuide(editingRecord.guide_name || '');
      setNotes(editingRecord.notes || '');
      setIsAutoTime(false);
      setShowOptionalFields(Boolean(editingRecord.reference_no || editingRecord.customer_name || editingRecord.notes));
    } else {
      if (!referenceNo) {
        setReferenceNo(generateAutoRef(saleType, date));
      }
    }
  }, [editingRecord]);

  const parsedGross = parseFloat(grossAmount) || 0;
  const parsedCommission = parseFloat(commissionAmount) || 0;
  const netAmount = Math.max(0, parsedGross - parsedCommission);

  const applyCommissionPercent = (percent: number) => {
    if (parsedGross > 0) {
      const calc = Math.round(((parsedGross * percent) / 100) * 100) / 100;
      setCommissionAmount(calc.toString());
      if (!selectedGuide && availableGuideNames.length > 0) {
        setSelectedGuide(availableGuideNames[0]);
      }
    }
  };

  const addPresetAmount = (preset: number) => {
    const cur = parseFloat(grossAmount) || 0;
    setGrossAmount((cur + preset).toString());
    grossInputRef.current?.focus();
  };

  const handleSelectB2BCustomer = (name: string) => {
    if (selectedB2BCustomer === name) {
      setSelectedB2BCustomer('');
      setCustomerName('');
    } else {
      setSelectedB2BCustomer(name);
      setCustomerName(name);
      // Auto-calculate 15% commission if not already set
      if (saleType === 'B2B' || selectedPayment === 'B2B' || !commissionAmount || commissionAmount === '0') {
        if (parsedGross > 0) {
          setCommissionAmount((Math.round(parsedGross * 0.15 * 100) / 100).toString());
        }
        if (!selectedGuide && availableGuideNames.length > 0) {
          setSelectedGuide(availableGuideNames[0]);
        }
      }
    }
  };

  const handleCreateNewB2B = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newB2BName.trim();
    if (!trimmed) return;
    try {
      if (onAddB2BCustomer) {
        onAddB2BCustomer(trimmed);
      }
      setSelectedB2BCustomer(trimmed);
      setCustomerName(trimmed);
      setNewB2BName('');
      setIsAddingB2B(false);
      setSuccessMessage(`Added & selected B2B Customer "${trimmed}"!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add B2B Customer');
    }
  };

  const handleCreateNewGuide = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGuideName.trim();
    if (!trimmed) return;
    try {
      if (onAddTourGuide) {
        onAddTourGuide(trimmed);
      }
      setSelectedGuide(trimmed);
      setNewGuideName('');
      setIsAddingGuide(false);
      setSuccessMessage(`Added & selected Tour Guide "${trimmed}"!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add Tour Guide');
    }
  };

  const handleCreateNewCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCounterName.trim();
    if (!trimmed) return;
    try {
      if (onAddCounter) {
        onAddCounter(trimmed);
      }
      setSelectedCounter(trimmed);
      setNewCounterName('');
      setIsAddingCounter(false);
      setSuccessMessage(`Added & selected Counter "${trimmed}"!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add Counter');
    }
  };

  const handleCreateNewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPaymentName.trim();
    if (!trimmed) return;
    try {
      if (onAddPaymentMethod) {
        onAddPaymentMethod(trimmed);
      }
      setSelectedPayment(trimmed);
      setNewPaymentName('');
      setIsAddingPayment(false);
      setSuccessMessage(`Added & selected Payment Method "${trimmed}"!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add Payment Method');
    }
  };

  const resetForm = () => {
    setDate(getTodayDate());
    setTime(getCurrentTime());
    setIsAutoTime(true);
    setSelectedCounter(activeCounters[0]?.counter_name || 'DXA Sale Counter');
    setSelectedPayment(saleType === 'B2B' ? 'B2B' : 'Cash');
    setSelectedB2BCustomer('');
    setSelectedGuide('');
    setGrossAmount('');
    setCommissionAmount('');
    setReferenceNo(generateAutoRef(saleType, getTodayDate()));
    setCustomerName('');
    setNotes('');
    setError(null);
    setShowOptionalFields(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const validationError = validateSale({
      sale_counter: selectedCounter,
      payment_method: selectedPayment,
      gross_amount: parsedGross,
      commission_amount: parsedCommission,
      guide_name: selectedGuide
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const finalRef = referenceNo.trim() || generateAutoRef(saleType, date);
      onSave({
        sale_date: date,
        sale_time: time,
        sale_counter: selectedCounter,
        payment_method: selectedPayment,
        gross_amount: parsedGross,
        commission_amount: parsedCommission,
        net_amount: netAmount,
        reference_no: finalRef,
        customer_name: (saleType === 'B2B' ? (selectedB2BCustomer || customerName) : customerName).trim(),
        guide_name: selectedGuide.trim(),
        sale_type: saleType,
        notes: notes.trim()
      });

      setSuccessMessage(`Sale of ${formatAED(netAmount)} recorded successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);

      resetForm();
      grossInputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to save sale.');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        onCancelEdit();
        resetForm();
        grossInputRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (editingRecord) {
          onCancelEdit();
        } else {
          resetForm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [date, time, selectedCounter, selectedPayment, parsedGross, parsedCommission, referenceNo, customerName, selectedGuide, notes, editingRecord]);

  const getCounterIcon = (name: string) => {
    if (name.includes('Photo')) return Camera;
    if (name.includes('Juice')) return CupSoda;
    if (name.includes('Supermarket')) return Store;
    if (name.includes('Popcorn')) return PopcornIcon;
    return Compass;
  };

  const getPaymentIcon = (name: string) => {
    if (name.toLowerCase().includes('card')) return CreditCard;
    if (name.toLowerCase().includes('b2b')) return Globe;
    return Banknote;
  };

  return (
    <div
      ref={formRef as any}
      className="bg-white rounded-2xl shadow-sm border border-stone-200/90 overflow-hidden mb-6"
    >
      {/* Clean, Modern Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white font-black text-xs shadow-sm">
            POS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {editingRecord ? `Edit Sale Ticket #${editingRecord.id}` : 'Counter Sale Voucher Entry'}
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                editingRecord ? 'bg-amber-400 text-stone-950' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {editingRecord ? 'Editing Mode' : 'Instant Cashier'}
              </span>
            </div>
            <p className="text-[11px] text-stone-300">
              DXA Counter • B2B Tour Operators • Multi-Payment • Automatic Guide Commission
            </p>
          </div>
        </div>

        {/* Shortcuts / Status */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="bg-stone-800 text-stone-300 px-2.5 py-1 rounded-lg border border-stone-700 font-mono flex items-center gap-1">
            <kbd className="font-bold text-amber-400">F2</kbd>
            <span>New</span>
          </span>
          <span className="bg-stone-800 text-stone-300 px-2.5 py-1 rounded-lg border border-stone-700 font-mono flex items-center gap-1">
            <kbd className="font-bold text-amber-400">Ctrl+S</kbd>
            <span>Save</span>
          </span>
          {editingRecord && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer border border-rose-700"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Main Sales Channel: B2B vs B2C */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <span>Select Sales Channel</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setSaleType('B2C');
                if (selectedPayment === 'B2B') setSelectedPayment('Cash');
                setReferenceNo(generateAutoRef('B2C', date));
              }}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all cursor-pointer text-left ${
                saleType === 'B2C'
                  ? 'bg-stone-900 text-white shadow-md ring-2 ring-stone-700/50 scale-[1.01]'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                saleType === 'B2C' ? 'bg-stone-800 text-emerald-400' : 'bg-stone-200 text-stone-600'
              }`}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wide">B2C Retail & Walk-in</div>
                <div className={`text-[11px] ${saleType === 'B2C' ? 'text-stone-300' : 'text-stone-500'}`}>
                  Direct guest, cash/card counters & retail
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSaleType('B2B');
                setSelectedPayment('B2B');
                if (availableB2BNames.length > 0 && !selectedB2BCustomer) {
                  setSelectedB2BCustomer(availableB2BNames[0]);
                  setCustomerName(availableB2BNames[0]);
                }
                setReferenceNo(generateAutoRef('B2B', date));
              }}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all cursor-pointer text-left ${
                saleType === 'B2B'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md ring-2 ring-orange-300/60 scale-[1.01]'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                saleType === 'B2B' ? 'bg-white/20 text-amber-100' : 'bg-stone-200 text-stone-600'
              }`}>
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wide">B2B Tour Operator / Agency</div>
                <div className={`text-[11px] ${saleType === 'B2B' ? 'text-orange-100' : 'text-stone-500'}`}>
                  Tripa, DFT, Dream Journey, Sand Journey...
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Auto Reference Number & Date/Time Bar */}
        <div className="p-3 bg-stone-50/90 rounded-xl border border-stone-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-stone-600 uppercase tracking-wider flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Ref No:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Auto Reference"
                className="font-mono text-xs font-black text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-[#FF6B35] w-52 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setReferenceNo(generateAutoRef(saleType, date))}
                className="text-[10px] bg-stone-200 hover:bg-stone-300 text-stone-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Regenerate auto reference number"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Auto-Gen</span>
              </button>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
                Auto-Generated
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (referenceNo.startsWith('DXA-')) {
                    setReferenceNo(generateAutoRef(saleType, e.target.value));
                  }
                }}
                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Time:</span>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setIsAutoTime(false);
                }}
                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Step 1: Select Sale Counter + Add New Counter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>1. Sale Counter</span>
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCounter(!isAddingCounter)}
              className="text-[11px] font-bold text-[#FF6B35] hover:text-[#e0531f] flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-orange-50 border border-orange-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Counter</span>
            </button>
          </div>

          {/* Quick Add Counter Inline Box */}
          {isAddingCounter && (
            <div className="mb-3 p-3 bg-orange-50/80 rounded-xl border border-orange-200 flex items-center gap-2 animate-in fade-in">
              <input
                type="text"
                placeholder="Enter new counter name (e.g. VIP Lounge, Quad Rental)"
                value={newCounterName}
                onChange={(e) => setNewCounterName(e.target.value)}
                className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-hidden focus:border-[#FF6B35]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateNewCounter}
                disabled={!newCounterName.trim()}
                className="bg-[#FF6B35] hover:bg-[#e0531f] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Save Counter
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCounter(false)}
                className="text-stone-500 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {(activeCounters.length > 0 ? activeCounters : fallbackCounters.map((c, i) => ({ id: i, counter_name: c.name, is_active: 1 }))).map((counter) => {
              const Icon = getCounterIcon(counter.counter_name);
              const isSelected = selectedCounter === counter.counter_name;
              return (
                <button
                  type="button"
                  key={counter.counter_name}
                  onClick={() => setSelectedCounter(counter.counter_name)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-[#FF6B35] bg-orange-50/80 text-[#FF6B35] shadow-xs scale-[1.02]'
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#FF6B35] text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{counter.counter_name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Payment Method */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>2. Payment Method</span>
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingPayment(!isAddingPayment)}
              className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Payment Method</span>
            </button>
          </div>

          {/* Quick Add Payment Inline Box */}
          {isAddingPayment && (
            <div className="mb-3 p-3 bg-stone-100 rounded-xl border border-stone-300 flex items-center gap-2 animate-in fade-in">
              <input
                type="text"
                placeholder="Enter new payment method (e.g. Bank Transfer, Tabby)"
                value={newPaymentName}
                onChange={(e) => setNewPaymentName(e.target.value)}
                className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-hidden focus:border-stone-800"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateNewPayment}
                disabled={!newPaymentName.trim()}
                className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Save Method
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPayment(false)}
                className="text-stone-500 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
            {(activePaymentMethods.length > 0 ? activePaymentMethods : [
              { id: 1, method_name: 'Cash', is_active: 1 },
              { id: 2, method_name: 'Card', is_active: 1 },
              { id: 3, method_name: 'B2B', is_active: 1 }
            ]).map((method) => {
              // Normalize method name to avoid "Car B2B"
              const cleanMethodName = method.method_name === 'Car B2B' ? 'B2B' : method.method_name;
              const Icon = getPaymentIcon(cleanMethodName);
              const isSelected = selectedPayment === cleanMethodName;
              return (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => {
                    setSelectedPayment(cleanMethodName);
                    if (cleanMethodName === 'B2B' && (!commissionAmount || commissionAmount === '0')) {
                      if (parsedGross > 0) {
                        setCommissionAmount((Math.round(parsedGross * 0.15 * 100) / 100).toString());
                      }
                      if (!selectedGuide && availableGuideNames.length > 0) {
                        setSelectedGuide(availableGuideNames[0]);
                      }
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span className="truncate">{cleanMethodName}</span>
                </button>
              );
            })}
          </div>

          {/* Card payment helper callout when commission is present */}
          {selectedPayment === 'Card' && parsedCommission > 0 && (
            <div className="mt-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2 animate-in fade-in">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Card Payment Commission Rule:</span> Gross sale of <span className="font-mono font-bold">{formatAED(parsedGross)}</span> is billed via Card terminal. The commission of <span className="font-mono font-bold text-amber-700">{formatAED(parsedCommission)}</span> for guide <span className="font-bold">{selectedGuide || '(select guide)'}</span> will be paid out directly from <span className="font-bold underline">Cash</span> in the drawer.
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Dynamic B2B Customer Dropdown & Quick Selector */}
        <div className={`rounded-2xl p-4 border transition-all ${
          selectedPayment === 'B2B' 
            ? 'bg-orange-50/60 border-orange-300 ring-2 ring-orange-200/50' 
            : 'bg-stone-50/70 border-stone-200'
        } space-y-3`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FF6B35]" />
              <label className="text-xs font-black uppercase tracking-wider text-stone-800">
                3. B2B Customer / Tour Operator
              </label>
              {selectedPayment === 'B2B' && (
                <span className="text-[10px] bg-[#FF6B35] text-white font-black px-2 py-0.5 rounded-full uppercase">
                  B2B Active
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsAddingB2B(!isAddingB2B)}
              className="text-xs font-bold text-[#FF6B35] hover:text-[#e0531f] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 border border-orange-300 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New B2B Partner</span>
            </button>
          </div>

          {/* Quick Add B2B Customer Inline Box */}
          {isAddingB2B && (
            <div className="p-3 bg-white rounded-xl border-2 border-orange-300 shadow-sm flex items-center gap-2 animate-in fade-in">
              <input
                type="text"
                placeholder="e.g. Desert Safari Dubai, Arabian Adventures, Royal Safari"
                value={newB2BName}
                onChange={(e) => setNewB2BName(e.target.value)}
                className="flex-1 bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-hidden focus:border-[#FF6B35]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateNewB2B}
                disabled={!newB2BName.trim()}
                className="bg-[#FF6B35] hover:bg-[#e0531f] disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Save & Select
              </button>
              <button
                type="button"
                onClick={() => setIsAddingB2B(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dynamic Dropdown Select for B2B Customers */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <select
                value={selectedB2BCustomer}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__ADD_NEW__') {
                    setIsAddingB2B(true);
                  } else {
                    handleSelectB2BCustomer(val);
                  }
                }}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#FF6B35] shadow-2xs appearance-none"
              >
                <option value="">-- Select --</option>
                {availableB2BNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="text-[#FF6B35] font-black">
                  + Add New B2B Customer...
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {selectedB2BCustomer && (
              <button
                type="button"
                onClick={() => {
                  setSelectedB2BCustomer('');
                  setCustomerName('');
                }}
                className="text-xs text-stone-500 hover:text-rose-600 flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-stone-300 hover:border-rose-300 bg-white cursor-pointer transition-colors"
                title="Clear B2B selection"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 4: Amount & Commission Calculation */}
        <div className="bg-stone-50/90 rounded-2xl p-4 border border-stone-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gross Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-stone-700">
                  Gross Amount <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-stone-500 font-mono">Total customer bill</span>
              </div>
              <div className="relative">
                <input
                  ref={grossInputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  required
                  className="w-full text-xl font-black bg-white border-2 border-stone-300 rounded-xl pl-3 pr-14 py-2 text-stone-900 focus:outline-hidden focus:border-[#FF6B35] font-mono shadow-2xs"
                />
                <span className="absolute right-3 top-3 text-xs font-black text-stone-500 font-mono">
                  AED
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[50, 100, 200, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addPresetAmount(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 text-stone-700 hover:text-orange-700 border border-stone-300 font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Commission Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <span>Commission (Cash)</span>
                </label>
                <span className="text-[10px] text-stone-500">Paid from cash drawer</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={commissionAmount}
                  onChange={(e) => {
                    setCommissionAmount(e.target.value);
                    const val = parseFloat(e.target.value) || 0;
                    if (val > 0 && !selectedGuide && availableGuideNames.length > 0) {
                      setSelectedGuide(availableGuideNames[0]);
                    }
                  }}
                  className="w-full text-xl font-black bg-white border-2 border-stone-300 rounded-xl pl-3 pr-14 py-2 text-amber-700 focus:outline-hidden focus:border-amber-500 font-mono shadow-2xs"
                />
                <span className="absolute right-3 top-3 text-xs font-black text-stone-500 font-mono">
                  AED
                </span>
              </div>

              {/* Commission Quick Percentages */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-stone-400 font-medium">Presets:</span>
                <button
                  type="button"
                  onClick={() => setCommissionAmount('')}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-stone-100 text-stone-600 border border-stone-300 cursor-pointer font-bold"
                >
                  0%
                </button>
                <button
                  type="button"
                  onClick={() => applyCommissionPercent(10)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 cursor-pointer font-bold"
                >
                  10%
                </button>
                <button
                  type="button"
                  onClick={() => applyCommissionPercent(15)}
                  className="text-[10px] px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 cursor-pointer font-black"
                >
                  15% (B2B)
                </button>
              </div>
            </div>

            {/* Net Amount Display */}
            <div className="bg-emerald-50 rounded-xl p-3.5 border-2 border-emerald-300 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  Net Amount (Income)
                </span>
                <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                  Gross - Commission
                </span>
              </div>

              <div className="my-1">
                <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                  {formatAED(netAmount)}
                </div>
              </div>

              <div className="text-[10px] text-emerald-800 font-mono flex items-center justify-between">
                <span>{formatAED(parsedGross)} - {formatAED(parsedCommission)}</span>
                {selectedPayment === 'Card' && parsedCommission > 0 && (
                  <span className="text-[9px] text-amber-800 font-bold bg-amber-100 px-1 py-0.5 rounded">
                    Comm. paid from Cash
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Guide Name Selector (Mandatory ONLY when commission > 0, Optional when commission is 0) */}
        <div className={`rounded-2xl p-4 border transition-all ${
          parsedCommission > 0
            ? 'bg-amber-50/90 border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
            : 'bg-stone-50/70 border-stone-200'
        } space-y-3`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <User className={`w-4 h-4 ${parsedCommission > 0 ? 'text-amber-700' : 'text-stone-500'}`} />
              <label className={`text-xs font-black uppercase tracking-wider ${
                parsedCommission > 0 ? 'text-amber-900' : 'text-stone-700'
              } flex items-center gap-1.5`}>
                <span>5. Tour Guide {parsedCommission > 0 ? '(Commission Recipient)' : ''}</span>
                {parsedCommission > 0 ? (
                  <span className="text-rose-600 font-black text-[11px] bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                    * Mandatory for Commission
                  </span>
                ) : (
                  <span className="text-stone-400 font-normal text-[10px] lowercase">
                    (optional - no commission entered)
                  </span>
                )}
              </label>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingGuide(!isAddingGuide)}
              className={`text-xs font-bold ${
                parsedCommission > 0 
                  ? 'text-amber-800 hover:text-amber-950 border-amber-300 bg-white hover:bg-amber-100' 
                  : 'text-stone-600 hover:text-stone-900 border-stone-300 bg-white hover:bg-stone-100'
              } flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shadow-2xs`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Guide</span>
            </button>
          </div>

          {/* Quick Add Guide Inline Box */}
          {isAddingGuide && (
            <div className="p-3 bg-white rounded-xl border-2 border-amber-400 shadow-sm flex items-center gap-2 animate-in fade-in">
              <input
                type="text"
                placeholder="Enter guide name (e.g. Sajid, Shahid, Tariq)..."
                value={newGuideName}
                onChange={(e) => setNewGuideName(e.target.value)}
                className="flex-1 bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-hidden focus:border-amber-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateNewGuide}
                disabled={!newGuideName.trim()}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Save & Select
              </button>
              <button
                type="button"
                onClick={() => setIsAddingGuide(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dropdown Select for Guide */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <select
                value={selectedGuide}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__ADD_NEW_GUIDE__') {
                    setIsAddingGuide(true);
                  } else {
                    setSelectedGuide(val);
                  }
                }}
                className={`w-full bg-white border ${
                  parsedCommission > 0 && !selectedGuide
                    ? 'border-2 border-amber-500 ring-2 ring-amber-300/60'
                    : 'border-stone-300'
                } rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-hidden focus:border-amber-600 shadow-2xs appearance-none`}
              >
                <option value="">
                  {parsedCommission > 0 ? '-- Select Guide (Mandatory for Commission) --' : '-- Select Guide (Optional) --'}
                </option>
                {availableGuideNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__ADD_NEW_GUIDE__" className="text-amber-700 font-black">
                  + Add New Guide...
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {selectedGuide && (
              <button
                type="button"
                onClick={() => setSelectedGuide('')}
                className="text-xs text-stone-500 hover:text-rose-600 flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-stone-300 hover:border-rose-300 bg-white cursor-pointer transition-colors"
                title="Clear Guide selection"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Guide Chips (Sajid, Shahid, etc.) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase self-center mr-1">
              Quick Select:
            </span>
            {availableGuideNames.map((name) => {
              const isSelected = selectedGuide.toLowerCase() === name.toLowerCase();
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => setSelectedGuide(name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-amber-600 bg-amber-600 text-white shadow-2xs scale-[1.02] font-black'
                      : 'border-stone-300 bg-white text-stone-800 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  <User className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-100' : 'text-amber-600'}`} />
                  <span>{name}</span>
                  {isSelected && (
                    <span className="ml-1 text-[10px] bg-white/20 text-white rounded-full px-1">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Optional Information (Guest / Notes) */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1.5 cursor-pointer py-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" />
              <span>{showOptionalFields ? 'Hide' : 'Add'} Additional Info (Guest Name, Specific Package, Notes)</span>
              {showOptionalFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showOptionalFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 mt-2 bg-stone-50 rounded-xl border border-stone-200 text-xs animate-in fade-in">
              <div>
                <label className="block font-bold text-stone-600 mb-1">Guest / Passenger Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Smith / Walk-in Family"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-hidden focus:border-[#FF6B35]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-600 mb-1">Notes / Activity Details</label>
                <input
                  type="text"
                  placeholder="e.g. 2x Sunset Dune Buggy + VIP Refreshment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-hidden focus:border-[#FF6B35]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear (Esc)</span>
          </button>

          <button
            type="submit"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:brightness-110 text-white font-black px-8 py-3 rounded-xl text-sm shadow-md transition-all active:scale-98 cursor-pointer border border-amber-300/30"
          >
            <Save className="w-4 h-4" />
            <span>{editingRecord ? 'Update Sale Ticket' : 'Save Sale (Enter)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
