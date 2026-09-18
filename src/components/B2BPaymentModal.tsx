import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  UserCheck,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Banknote,
  ArrowDownRight
} from 'lucide-react';
import { db } from '../db/sqlite';
import { B2BCustomer, B2BPaymentFormData, SaleRecord, B2BPaymentRecord } from '../types';

interface B2BPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSaved: () => void;
  initialCustomerName?: string;
  customers: B2BCustomer[];
}

export const B2BPaymentModal: React.FC<B2BPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSaved,
  initialCustomerName,
  customers
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };
  const generateReceiptNo = () => {
    const d = new Date();
    const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `DXA-REC-${ds}-${rand}`;
  };

  const [formData, setFormData] = useState<B2BPaymentFormData>({
    payment_date: getTodayDate(),
    payment_time: getCurrentTime(),
    customer_name: initialCustomerName || '',
    amount: '',
    payment_method: 'Bank Transfer',
    reference_no: generateReceiptNo(),
    received_by: 'Accounts Desk',
    notes: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Customer Financial State Calculation
  const [customerBalance, setCustomerBalance] = useState<{
    totalGross: number;
    totalComm: number;
    netInvoiced: number;
    totalReceived: number;
    outstandingDue: number;
  }>({
    totalGross: 0,
    totalComm: 0,
    netInvoiced: 0,
    totalReceived: 0,
    outstandingDue: 0
  });

  useEffect(() => {
    if (isOpen) {
      const cust = initialCustomerName || (customers.length > 0 ? customers[0].customer_name : '');
      setFormData({
        payment_date: getTodayDate(),
        payment_time: getCurrentTime(),
        customer_name: cust,
        amount: '',
        payment_method: 'Bank Transfer',
        reference_no: generateReceiptNo(),
        received_by: 'Accounts Desk',
        notes: ''
      });
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialCustomerName, customers]);

  // Recalculate customer balance whenever customer_name changes
  useEffect(() => {
    if (!formData.customer_name) {
      setCustomerBalance({ totalGross: 0, totalComm: 0, netInvoiced: 0, totalReceived: 0, outstandingDue: 0 });
      return;
    }

    const b2bSales: SaleRecord[] = db.getSales().filter(
      (s) => s.payment_method === 'B2B' && s.customer_name?.toLowerCase().trim() === formData.customer_name.toLowerCase().trim()
    );
    const b2bPayments: B2BPaymentRecord[] = db.getB2BPayments().filter(
      (p) => p.customer_name?.toLowerCase().trim() === formData.customer_name.toLowerCase().trim()
    );

    const totalGross = b2bSales.reduce((sum, s) => sum + s.gross_amount, 0);
    const totalComm = b2bSales.reduce((sum, s) => sum + s.commission_amount, 0);
    const netInvoiced = b2bSales.reduce((sum, s) => sum + s.net_amount, 0);
    const totalReceived = b2bPayments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingDue = Math.max(0, netInvoiced - totalReceived);

    setCustomerBalance({
      totalGross,
      totalComm,
      netInvoiced,
      totalReceived,
      outstandingDue: Math.round(outstandingDue * 100) / 100
    });
  }, [formData.customer_name, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(formData.amount);
    if (!formData.customer_name || formData.customer_name === '-- Select --') {
      setError('Please select a valid B2B customer');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount received greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      db.addB2BPayment({
        ...formData,
        amount: numAmount
      });

      setSuccessMessage(`Payment voucher of AED ${numAmount.toLocaleString()} recorded successfully for ${formData.customer_name}`);
      setTimeout(() => {
        setIsSubmitting(false);
        onPaymentSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to record B2B payment');
      setIsSubmitting(false);
    }
  };

  const handlePayFullDue = () => {
    if (customerBalance.outstandingDue > 0) {
      setFormData((prev) => ({
        ...prev,
        amount: customerBalance.outstandingDue.toString()
      }));
    }
  };

  const activeCustomers = customers.filter((c) => c.is_active === 1);

  return (
    <div id="b2b-payment-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="b2b-payment-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <Receipt className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Received Amount from B2B Customer
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/30 text-emerald-200 rounded-md border border-emerald-400/30">
                  Credit Recovery
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80">
                Record incoming settlement receipts to offset outstanding customer balances
              </p>
            </div>
          </div>
          <button
            id="close-b2b-payment-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              B2B Tour Operator / Customer <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                id="b2b-payment-customer-select"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                required
              >
                <option value="">-- Select --</option>
                {activeCustomers.map((c) => (
                  <option key={c.id} value={c.customer_name}>
                    {c.customer_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Outstanding Balance Banner for Selected Customer */}
          {formData.customer_name && formData.customer_name !== '-- Select --' && (
            <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-xl border border-emerald-200/70 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  {formData.customer_name} Statement Summary
                </span>
                {customerBalance.outstandingDue > 0 && (
                  <button
                    type="button"
                    id="pay-full-due-btn"
                    onClick={handlePayFullDue}
                    className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1"
                  >
                    <ArrowDownRight className="w-3 h-3" />
                    Fill Full Due (AED {customerBalance.outstandingDue.toLocaleString()})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Net Invoiced</div>
                  <div className="text-xs font-bold text-slate-800">AED {customerBalance.netInvoiced.toLocaleString()}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Already Paid</div>
                  <div className="text-xs font-bold text-emerald-600">AED {customerBalance.totalReceived.toLocaleString()}</div>
                </div>
                <div className="col-span-2 bg-white p-2 rounded-lg border border-emerald-300 shadow-2xs flex flex-col justify-center items-center">
                  <div className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">Current Balance Due</div>
                  <div className={`text-sm font-extrabold ${customerBalance.outstandingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    AED {customerBalance.outstandingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Amount Received (AED) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 font-bold" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="b2b-payment-amount-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Channel <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  id="b2b-payment-method-select"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                >
                  <option value="Bank Transfer">Bank Transfer (Online/Wire)</option>
                  <option value="Cash">Cash (Counter/Collector)</option>
                  <option value="Cheque">Cheque (PDC/Current)</option>
                  <option value="Card">Card (POS Terminal)</option>
                  <option value="Other">Other Adjustment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date, Time & Voucher Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  id="b2b-payment-date-input"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  id="b2b-payment-time-input"
                  value={formData.payment_time}
                  onChange={(e) => setFormData({ ...formData, payment_time: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Receipt / Bank Ref #
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  id="b2b-payment-ref-input"
                  placeholder="e.g. TRF-12345"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Received By & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Received By / Collector
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  id="b2b-payment-received-by-input"
                  placeholder="e.g. Accounts Desk / Cashier"
                  value={formData.received_by || ''}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Remarks / Notes
              </label>
              <input
                type="text"
                id="b2b-payment-notes-input"
                placeholder="e.g. Cheque clearance / Part-payment for invoice #90"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Cash Drawer Notice */}
          {formData.payment_method === 'Cash' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
              <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Cash Payment Notice:</strong> This cash receipt will automatically be credited to your <strong>Daily Cash In Drawer</strong> balance.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="cancel-b2b-payment-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-b2b-payment-btn"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Recording Receipt...' : 'Save Payment Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
