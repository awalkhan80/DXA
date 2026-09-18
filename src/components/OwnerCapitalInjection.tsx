import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  RotateCcw,
  Trash2,
  TrendingUp,
  Tag
} from 'lucide-react';
import { CapitalInjectionFormData, CapitalInjectionRecord } from '../types';
import { formatAED } from '../lib/utils';

interface OwnerCapitalInjectionProps {
  capitalInjections: CapitalInjectionRecord[];
  onAddCapital: (data: CapitalInjectionFormData) => void;
  onDeleteCapital?: (id: number) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

const PURPOSE_OPTIONS = [
  'Operational Expenses',
  'Inventory Purchase',
  'Equipment Repair',
  'Emergency',
  'Other (specify in notes)'
];

export const OwnerCapitalInjection: React.FC<OwnerCapitalInjectionProps> = ({
  capitalInjections,
  onAddCapital,
  onDeleteCapital,
  isModal = false,
  onCloseModal
}) => {
  // Form State
  const [injectionDate, setInjectionDate] = useState<string>('');
  const [injectionTime, setInjectionTime] = useState<string>('');
  const [isAutoTime, setIsAutoTime] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('Operational Expenses');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Initialize date & time
  useEffect(() => {
    const now = new Date();
    setInjectionDate(now.toISOString().split('T')[0]);
    setInjectionTime(now.toTimeString().split(' ')[0].substring(0, 5));
  }, []);

  // Update time live when Auto is enabled
  useEffect(() => {
    if (!isAutoTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      setInjectionTime(now.toTimeString().split(' ')[0].substring(0, 5));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAutoTime]);

  const handleClear = () => {
    const now = new Date();
    setInjectionDate(now.toISOString().split('T')[0]);
    setInjectionTime(now.toTimeString().split(' ')[0].substring(0, 5));
    setIsAutoTime(true);
    setAmount('');
    setPurpose('Operational Expenses');
    setCustomPurpose('');
    setNotes('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount);

    // Capital Validation exactly as requested
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Capital amount must be greater than 0");
      return;
    }

    const finalPurpose = purpose === 'Other (specify in notes)' && customPurpose.trim()
      ? customPurpose.trim()
      : purpose;

    if (!finalPurpose) {
      setError("Specify purpose of capital injection");
      return;
    }

    if (!injectionDate) {
      setError('Please select a date');
      return;
    }

    try {
      onAddCapital({
        injection_date: injectionDate,
        injection_time: injectionTime.length === 5 ? `${injectionTime}:00` : injectionTime,
        amount: parsedAmount,
        source: 'Owner Capital',
        purpose: finalPurpose,
        notes: notes.trim()
      });

      setSuccess(`Successfully injected ${formatAED(parsedAmount)} from Owner Capital into safe drawer!`);
      setAmount('');
      setCustomPurpose('');
      setNotes('');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to record capital injection');
    }
  };

  const totalCapital = capitalInjections.reduce((sum, item) => sum + item.amount, 0);
  const parsedAmount = parseFloat(amount) || 0;

  return (
    <div className="space-y-6">
      {/* 1. Main Owner Capital Injection Card */}
      <div className="bg-white rounded-xl shadow-md border border-emerald-200/80 overflow-hidden relative">
        {/* Green Gradient Header matching exact user wireframe */}
        <div
          className="text-white px-5 py-4 flex items-center justify-between border-b border-emerald-600/30"
          style={{
            background: 'linear-gradient(135deg, #06D6A0 0%, #059669 100%)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-2xl shadow-inner shrink-0">
              💰
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 drop-shadow-xs tracking-tight">
                <span>Owner Capital Injection</span>
                <span className="text-[11px] bg-white/25 text-white font-bold px-2 py-0.5 rounded-full border border-white/30">
                  Desert Xtreme Adventure
                </span>
              </h2>
              <p className="text-emerald-100 text-xs font-medium mt-0.5">
                Record capital funds brought in by the owner for operations, float & inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-emerald-950 bg-white/40 px-2.5 py-1.5 rounded-lg border border-white/40 font-bold backdrop-blur-xs">
              <span>SQLite: capital_injections</span>
            </div>
            {isModal && onCloseModal && (
              <button
                type="button"
                onClick={onCloseModal}
                className="text-white/80 hover:text-white p-1 rounded transition-colors cursor-pointer text-lg font-bold"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Live Feedback Banners */}
        {success && (
          <div className="bg-[#06D6A0] text-stone-900 px-4 py-2.5 flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 border-b border-emerald-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-stone-900" />
              <span>{success}</span>
            </div>
            <span className="text-[10px] bg-emerald-800/20 px-2 py-0.5 rounded font-mono">
              Cash Drawer Float Increased
            </span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2.5 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 bg-white">
          {/* ROW 1: 📅 Date & 🕐 Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 📅 Date */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>📅 Date</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={injectionDate}
                onChange={(e) => setInjectionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 font-medium"
                required
              />
            </div>

            {/* 🕐 Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🕐 Time</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newAuto = !isAutoTime;
                    setIsAutoTime(newAuto);
                    if (newAuto) {
                      const now = new Date();
                      setInjectionTime(now.toTimeString().split(' ')[0].substring(0, 5));
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    isAutoTime
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 text-stone-600 border border-stone-300'
                  }`}
                >
                  {isAutoTime ? '● Auto' : '○ Manual'}
                </button>
              </div>
              <input
                type="time"
                value={injectionTime}
                onChange={(e) => {
                  setIsAutoTime(false);
                  setInjectionTime(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono bg-stone-50/50 font-medium"
                required
              />
            </div>
          </div>

          {/* ROW 2: 💵 Capital Amount (AED) */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>💵 Capital Amount</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {parsedAmount > 0 ? formatAED(parsedAmount) : 'Enter AED amount'}
              </span>
            </div>

            <div className="relative">
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 text-base font-bold rounded-lg border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner text-stone-900"
                required
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-emerald-700">AED</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="text-[10px] font-bold text-stone-500 mr-1">Quick Add:</span>
              {[500, 1000, 2000, 3000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    const current = parseFloat(amount) || 0;
                    setAmount((current + val).toString());
                    setError(null);
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="text-[10px] font-medium text-stone-500 hover:text-stone-800 ml-auto underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ROW 3: 📋 Purpose (Radio Options matching wireframe) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>📋 Purpose:</span>
              <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200">
              {PURPOSE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs font-medium transition-all ${
                    purpose === opt
                      ? 'bg-emerald-100/80 text-emerald-950 border border-emerald-300 font-bold shadow-2xs'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="capital_purpose"
                    value={opt}
                    checked={purpose === opt}
                    onChange={() => setPurpose(opt)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Custom Purpose Input when Other is selected */}
            {purpose === 'Other (specify in notes)' && (
              <div className="mt-2">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Specify Custom Purpose: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="e.g. Quad Buggy Fleet Expansion, Cash Drawer Reserve"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium bg-emerald-50/30"
                  required
                />
              </div>
            )}
          </div>

          {/* ROW 4: 📝 Notes: [Optional] */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>📝 Notes: [Optional]</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide extra details (e.g. deposited cash to drawer safe for morning quad safari tour, or specify custom purpose)..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Form Actions: [Add Capital] [Clear] */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Clear all fields"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #06D6A0 0%, #059669 100%)'
              }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Capital</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Capital History Table matching exact user ASCII diagram */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="bg-stone-100 px-5 py-3.5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Capital History:</span>
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {capitalInjections.length} Records
            </span>
          </div>

          <div className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-mono">
            Total Capital Injected: {formatAED(totalCapital)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-bold border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Purpose</th>
                {onDeleteCapital && <th className="px-4 py-3 text-center w-16">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {capitalInjections.length > 0 ? (
                capitalInjections.map((injection) => (
                  <tr key={injection.id} className="hover:bg-emerald-50/40 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 font-mono text-stone-800 text-[11px] whitespace-nowrap">
                      <div>{injection.injection_date}</div>
                      {injection.injection_time && (
                        <div className="text-[10px] text-stone-400">
                          {injection.injection_time.substring(0, 5)}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                      {formatAED(injection.amount)}
                    </td>

                    {/* Purpose & Notes */}
                    <td className="px-4 py-3 text-stone-800">
                      <div className="font-semibold">{injection.purpose}</div>
                      {injection.notes && (
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {injection.notes}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    {onDeleteCapital && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove capital injection of ${formatAED(injection.amount)}?`)) {
                              onDeleteCapital(injection.id);
                            }
                          }}
                          className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete capital injection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={onDeleteCapital ? 4 : 3} className="text-center py-8 text-stone-400 text-xs">
                    No capital injections recorded yet. Fill the form above to add owner capital.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Total Summary Banner matching wireframe: Total Capital Injected: 18,000 AED */}
        <div className="bg-emerald-50/80 px-5 py-3 border-t border-emerald-200 flex items-center justify-between font-mono">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">
            Total Capital Injected:
          </span>
          <span className="text-base font-black text-emerald-800">
            {formatAED(totalCapital)}
          </span>
        </div>
      </div>
    </div>
  );
};
