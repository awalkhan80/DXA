import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Calendar, 
  Download, 
  Printer, 
  FileText, 
  DollarSign, 
  Scale, 
  UserCheck, 
  Receipt,
  User,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { SaleRecord, B2BPaymentRecord } from '../../types';
import { formatAED } from '../../lib/utils';
import { exportB2BCustomerLedgerToExcel } from '../../lib/excelExport';
import { exportB2BCustomerLedgerPdf } from '../../lib/pdfExport';
import { db } from '../../db/sqlite';

interface B2BCustomerLedgerProps {
  sales: SaleRecord[];
  b2bPayments?: B2BPaymentRecord[];
  fromDate: string;
  toDate: string;
  onReceivePayment?: (partnerName?: string) => void;
  onRefresh?: () => void;
}

const DEFAULT_B2B_PARTNERS = [
  'Tripa tour',
  'DFT',
  'Dream Journey',
  'Sand Journey',
  'Desert Tiger'
];

interface LedgerItem {
  id: string;
  type: 'SALE' | 'PAYMENT';
  date: string;
  time: string;
  refNo: string;
  description: string;
  guideOrChannel: string;
  debit: number; // Invoiced charge
  credit: number; // Commission or Payment received
  netChange: number; // +debit or -credit
  runningBalance: number;
  notes: string;
  originalId: number;
}

export const B2BCustomerLedger: React.FC<B2BCustomerLedgerProps> = ({
  sales,
  b2bPayments = [],
  fromDate,
  toDate,
  onReceivePayment,
  onRefresh
}) => {
  const [selectedPartner, setSelectedPartner] = useState<string>('Tripa tour');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Extract all available partners from database sales, payments, and master customer list
  const allPartners = useMemo(() => {
    const set = new Set<string>(DEFAULT_B2B_PARTNERS);
    try {
      db.getB2BCustomers().forEach(c => {
        if (c.customer_name && c.customer_name.trim()) {
          set.add(c.customer_name.trim());
        }
      });
    } catch (e) {}
    sales.forEach(s => {
      if (s.customer_name && (s.sale_type === 'B2B' || s.payment_method?.includes('B2B') || DEFAULT_B2B_PARTNERS.some(p => p.toLowerCase() === s.customer_name?.toLowerCase()))) {
        set.add(s.customer_name.trim());
      }
    });
    b2bPayments.forEach(p => {
      if (p.customer_name) {
        set.add(p.customer_name.trim());
      }
    });
    return Array.from(set);
  }, [sales, b2bPayments]);

  // Filter sales for the selected partner
  const partnerSales = useMemo(() => {
    return sales.filter(s => {
      if (!selectedPartner) return true;
      const pName = (s.customer_name || '').toLowerCase().trim();
      return pName === selectedPartner.toLowerCase().trim();
    });
  }, [sales, selectedPartner]);

  // Filter payments for the selected partner
  const partnerPayments = useMemo(() => {
    return b2bPayments.filter(p => {
      if (!selectedPartner) return true;
      const pName = (p.customer_name || '').toLowerCase().trim();
      return pName === selectedPartner.toLowerCase().trim();
    });
  }, [b2bPayments, selectedPartner]);

  // Financial Metrics for Statement
  const totalDebitGross = useMemo(() => partnerSales.reduce((sum, s) => sum + s.gross_amount, 0), [partnerSales]);
  const totalCreditCommission = useMemo(() => partnerSales.reduce((sum, s) => sum + s.commission_amount, 0), [partnerSales]);
  const netInvoicedCharges = useMemo(() => partnerSales.reduce((sum, s) => sum + s.net_amount, 0), [partnerSales]);
  const totalPaymentsReceived = useMemo(() => partnerPayments.reduce((sum, p) => sum + p.amount, 0), [partnerPayments]);
  const netOutstandingBalance = useMemo(() => Math.round((netInvoicedCharges - totalPaymentsReceived) * 100) / 100, [netInvoicedCharges, totalPaymentsReceived]);

  // Combine and Sort Sales + Payments Chronologically
  const mergedLedgerItems = useMemo(() => {
    const items: Array<Omit<LedgerItem, 'runningBalance'>> = [];

    // Add Sales
    partnerSales.forEach((s) => {
      items.push({
        id: `sale-${s.id}`,
        type: 'SALE',
        date: s.sale_date,
        time: s.sale_time || '00:00:00',
        refNo: s.reference_no || `DXA-${s.id}`,
        description: s.sale_counter,
        guideOrChannel: s.guide_name || '-',
        debit: s.gross_amount,
        credit: s.commission_amount,
        netChange: s.net_amount, // Positive (increases receivable)
        notes: s.notes || '',
        originalId: s.id
      });
    });

    // Add Received Payments
    partnerPayments.forEach((p) => {
      items.push({
        id: `payment-${p.id}`,
        type: 'PAYMENT',
        date: p.payment_date,
        time: p.payment_time || '00:00:00',
        refNo: p.reference_no || `REC-${p.id}`,
        description: `Payment Received (${p.payment_method})`,
        guideOrChannel: p.received_by || p.payment_method,
        debit: 0,
        credit: p.amount,
        netChange: -p.amount, // Negative (reduces receivable)
        notes: p.notes ? `${p.notes}` : `Settlement receipt via ${p.payment_method}`,
        originalId: p.id
      });
    });

    // Sort chronologically
    items.sort((a, b) => {
      const dtA = `${a.date} ${a.time}`;
      const dtB = `${b.date} ${b.time}`;
      return dtA.localeCompare(dtB);
    });

    // Compute running balance
    let running = 0;
    return items.map((item) => {
      running += item.netChange;
      return {
        ...item,
        runningBalance: Math.round(running * 100) / 100
      };
    });
  }, [partnerSales, partnerPayments]);

  const handleDeletePayment = (paymentId: number) => {
    try {
      db.deleteB2BPayment(paymentId);
      setDeleteConfirmId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  const handleExcelExport = () => {
    exportB2BCustomerLedgerToExcel(selectedPartner, fromDate, toDate, partnerSales, partnerPayments);
  };

  const handlePdfExport = () => {
    exportB2BCustomerLedgerPdf(selectedPartner, fromDate, toDate, partnerSales, partnerPayments);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 rounded-2xl border border-stone-700 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF6B35] text-white px-2.5 py-0.5 rounded-full shadow-xs">
              PARTNER LEDGER & STATEMENT
            </span>
            <span className="text-xs text-amber-200 font-medium">Desert Xtreme Adventure Accounts</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#FF6B35]" />
            <span>B2B Customer Ledger & Settlement Statement</span>
          </h3>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Individual statement of account showing all credit vouchers, payments received, commission adjustments, and real-time net balances.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onReceivePayment && (
            <button
              type="button"
              id="ledger-receive-payment-btn"
              onClick={() => onReceivePayment(selectedPartner)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Receive Amount (Receipt)</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Export</span>
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#e0531f] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Statement PDF</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Partner Selector Card */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#FF6B35]" />
            <span>Select B2B Tour Operator / Partner Account:</span>
          </label>
          <span className="text-[11px] font-bold text-stone-500">
            Statement for: <strong className="text-stone-900">{selectedPartner || 'All Partners'}</strong>
          </span>
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex flex-wrap gap-2">
          {allPartners.map((partner) => {
            const isSelected = selectedPartner.toLowerCase() === partner.toLowerCase();
            return (
              <button
                key={partner}
                type="button"
                onClick={() => setSelectedPartner(partner)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'border-[#FF6B35] bg-[#FF6B35] text-white shadow-sm font-black scale-102'
                    : 'border-stone-300 bg-stone-50 text-stone-700 hover:bg-orange-50 hover:border-orange-300'
                }`}
              >
                <UserCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-200' : 'text-stone-400'}`} />
                <span>{partner}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Official Account Statement Summary Card */}
      <div className="bg-gradient-to-br from-stone-50 to-orange-50/40 rounded-2xl border-2 border-stone-300 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200 gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Statement of Account</div>
            <h4 className="text-xl font-black text-stone-900 mt-0.5 flex items-center gap-2">
              <span>{selectedPartner || 'Consolidated B2B Ledger'}</span>
            </h4>
            <div className="text-xs text-stone-600 mt-1">
              Period: <strong className="text-stone-800">{fromDate || 'Start of Operations'}</strong> to <strong className="text-stone-800">{toDate || 'Present'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {onReceivePayment && (
              <button
                type="button"
                onClick={() => onReceivePayment(selectedPartner)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Receive Payment from {selectedPartner}</span>
              </button>
            )}
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">Total Credit Balance (Due)</div>
              <div className={`text-2xl font-black font-mono ${netOutstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatAED(netOutstandingBalance)}
              </div>
              <div className="text-[10px] text-stone-500 font-semibold">
                {netOutstandingBalance > 0 ? 'Outstanding Credit Receivable' : 'Fully Settled / Cleared'}
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Financial Statement Metric Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Total Sales (Credit) Gross</span>
            <div className="text-lg font-black text-stone-900 font-mono mt-0.5">{formatAED(totalDebitGross)}</div>
            <span className="text-[10px] text-stone-400 font-medium">{partnerSales.length} total tour credit sales</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Guide Commissions</span>
            <div className="text-lg font-black text-amber-700 font-mono mt-0.5">{formatAED(totalCreditCommission)}</div>
            <span className="text-[10px] text-stone-400 font-medium">Guide commission deductions</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Net Invoiced Credit Charges</span>
            <div className="text-lg font-black text-stone-900 font-mono mt-0.5">{formatAED(netInvoicedCharges)}</div>
            <span className="text-[10px] text-stone-400 font-medium">Total credit billed to {selectedPartner}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-2xs">
            <span className="text-[11px] font-black text-emerald-800 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Total Payments Received
            </span>
            <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">{formatAED(totalPaymentsReceived)}</div>
            <span className="text-[10px] text-emerald-700 font-medium">{partnerPayments.length} settlement payments</span>
          </div>
        </div>
      </div>

      {/* Itemized Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-stone-700" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Itemized Statement & Ledger Transactions ({mergedLedgerItems.length})
            </h4>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 font-semibold text-stone-700">
              <span className="w-2 h-2 rounded-full bg-stone-800"></span> Sales (Credit) ({partnerSales.length})
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Payments Received ({partnerPayments.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Transaction Type</th>
                <th className="p-3">Voucher / Receipt #</th>
                <th className="p-3">Activity / Channel</th>
                <th className="p-3">Guide / Received By</th>
                <th className="p-3 text-right">Debit (Credit Sale AED)</th>
                <th className="p-3 text-right">Credit (Paid / Comm AED)</th>
                <th className="p-3 text-right">Net Impact</th>
                <th className="p-3 text-right">Total Credit Balance</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium">
              {mergedLedgerItems.length > 0 ? (
                mergedLedgerItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-orange-50/30 transition-colors ${
                      item.type === 'PAYMENT' ? 'bg-emerald-50/25' : ''
                    }`}
                  >
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{item.date}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{item.time}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {item.type === 'SALE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100/90 text-orange-950 font-black text-[10px] border border-orange-300 shadow-2xs">
                          <ArrowUpRight className="w-3 h-3 text-[#FF6B35]" />
                          Sales (Credit)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-black text-[10px] border border-emerald-300 shadow-2xs">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                          Payments Received
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-bold text-stone-800 whitespace-nowrap">
                      {item.refNo}
                    </td>

                    <td className="p-3 text-stone-700 whitespace-nowrap font-semibold">
                      {item.description}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {item.type === 'SALE' ? (
                        item.guideOrChannel && item.guideOrChannel !== '-' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                            <User className="w-3 h-3 text-amber-700" />
                            <span>{item.guideOrChannel}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-semibold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item.guideOrChannel}</span>
                        </span>
                      )}
                    </td>

                    {/* Debit Column */}
                    <td className="p-3 text-right font-mono text-stone-800 font-bold">
                      {item.type === 'SALE' ? formatAED(item.debit) : '-'}
                    </td>

                    {/* Credit Column */}
                    <td className="p-3 text-right font-mono font-bold">
                      {item.type === 'SALE' ? (
                        item.credit > 0 ? (
                          <span className="text-amber-700">{formatAED(item.credit)}</span>
                        ) : (
                          '-'
                        )
                      ) : (
                        <span className="text-emerald-600 font-bold">+{formatAED(item.credit)}</span>
                      )}
                    </td>

                    {/* Net Impact */}
                    <td className="p-3 text-right font-mono font-bold">
                      {item.type === 'SALE' ? (
                        <span className="text-stone-900">+{formatAED(item.netChange)}</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">-{formatAED(Math.abs(item.netChange))}</span>
                      )}
                    </td>

                    {/* Running Balance */}
                    <td className="p-3 text-right font-mono font-black bg-stone-50/50">
                      <span className={item.runningBalance > 0 ? 'text-[#FF6B35]' : 'text-emerald-700'}>
                        {formatAED(item.runningBalance)}
                      </span>
                    </td>

                    <td className="p-3 text-stone-500 max-w-xs truncate">
                      {item.notes || '-'}
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      {item.type === 'PAYMENT' && (
                        deleteConfirmId === item.originalId ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(item.originalId)}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-[10px] hover:bg-stone-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            title="Delete this payment receipt"
                            onClick={() => setDeleteConfirmId(item.originalId)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-stone-400">
                    No transactions or receipts recorded for <strong>{selectedPartner}</strong> in this date range.
                  </td>
                </tr>
              )}
            </tbody>
            {mergedLedgerItems.length > 0 && (
              <tfoot className="bg-stone-50 font-black border-t-2 border-stone-300 text-stone-900">
                <tr>
                  <td colSpan={5} className="p-3 uppercase">
                    Total Statement Summary ({partnerSales.length} vouchers, {partnerPayments.length} receipts)
                  </td>
                  <td className="p-3 text-right font-mono">{formatAED(totalDebitGross)}</td>
                  <td className="p-3 text-right font-mono text-emerald-700">
                    {formatAED(totalPaymentsReceived + totalCreditCommission)}
                  </td>
                  <td className="p-3 text-right font-mono text-stone-900">
                    {formatAED(netInvoicedCharges)}
                  </td>
                  <td className={`p-3 text-right font-mono font-black ${netOutstandingBalance > 0 ? 'text-[#FF6B35]' : 'text-emerald-700'}`}>
                    {formatAED(netOutstandingBalance)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
