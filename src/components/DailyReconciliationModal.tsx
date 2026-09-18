import React from 'react';
import { X, Printer, RefreshCw, Calendar, CheckCircle2, TrendingUp, TrendingDown, Wallet, Scale } from 'lucide-react';
import { SummaryMetrics, CashFlowSummary } from '../types';
import { formatAED } from '../lib/utils';

interface DailyReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: SummaryMetrics;
  cashFlow?: CashFlowSummary;
  dateFilterLabel: string;
}

export const DailyReconciliationModal: React.FC<DailyReconciliationModalProps> = ({
  isOpen,
  onClose,
  metrics,
  cashFlow,
  dateFilterLabel
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#2D3142] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#06D6A0]" />
            <div>
              <h3 className="text-sm font-bold text-white">Daily Reconciliation & Cashier Balance Sheet</h3>
              <p className="text-[10px] text-stone-400">
                Period: {dateFilterLabel} • Desert Xtreme Adventure (Step 1 Sales + Step 2 Expenses)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Sheet Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-stone-50/40 text-xs text-stone-800">
          {/* Company Brand & Report Title */}
          <div className="text-center pb-4 border-b border-stone-200">
            <h2 className="text-lg font-black text-[#FF6B35] tracking-tight">
              DESERT XTREME ADVENTURE
            </h2>
            <p className="text-xs font-bold text-stone-700 mt-0.5">
              DAILY CASH REGISTER & FINANCIAL RECONCILIATION AUDIT
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 mt-1">
              <span>Date: {todayStr}</span>
              <span>•</span>
              <span>Filter: {dateFilterLabel}</span>
              <span>•</span>
              <span>Total Transactions: {metrics.transactionCount}</span>
            </div>
          </div>

          {/* Grand Totals Summary Box */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-orange-700">Gross Sales</span>
              <div className="text-lg font-black text-[#FF6B35] mt-0.5 font-mono">
                {formatAED(metrics.totalGross)}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-700">Commissions</span>
              <div className="text-lg font-black text-[#F7931E] mt-0.5 font-mono">
                -{formatAED(metrics.totalCommission)}
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Net Sales Realized</span>
              <div className="text-lg font-black text-[#06D6A0] mt-0.5 font-mono">
                {formatAED(metrics.totalNet)}
              </div>
            </div>
          </div>

          {/* Step 2 Cash Drawer Audit Section */}
          {cashFlow && (
            <div className="border border-stone-300 rounded-lg overflow-hidden bg-white shadow-xs">
              <div className="bg-stone-800 text-white px-3.5 py-2 font-bold text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#F7931E]" />
                  <span>Physical Cash Drawer Count & Audit Formula</span>
                </span>
                <span className="text-[10px] font-mono text-stone-300">SQLite Auto Balanced</span>
              </div>
              <div className="p-3.5 space-y-2 bg-stone-50/60 font-mono text-xs">
                <div className="flex items-center justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-700 font-sans">(+) Cash Sales Collected:</span>
                  <span className="font-bold text-emerald-700">+{formatAED(cashFlow.cashSales)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-700 font-sans">(+) Owner Capital Opening Float:</span>
                  <span className="font-bold text-emerald-600">+{formatAED(cashFlow.totalOwnerCapital)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-700 font-sans">(-) Cash Commissions Paid (Guides/Drivers):</span>
                  <span className="font-bold text-amber-700">-{formatAED(cashFlow.commissionsPaidCash)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-700 font-sans">(-) Cash Expenses Outflows (Fuel/Stock/Wages):</span>
                  <span className="font-bold text-rose-700">-{formatAED(cashFlow.expensesFromCash)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm bg-emerald-50 -mx-3.5 -mb-3.5 p-3.5 border-t border-emerald-300">
                  <span className="font-bold text-emerald-950 font-sans flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-700" />
                    <span>(=) Theoretical Cash Balance in Safe Drawer:</span>
                  </span>
                  <span className="font-black text-emerald-900 text-base">
                    {formatAED(cashFlow.estimatedCashInDrawer)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Breakdown by Sale Counter */}
          <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
            <div className="bg-stone-100/70 px-3.5 py-2 font-bold text-[11px] text-stone-700 border-b border-stone-200">
              Counter-by-Counter Revenue Breakdown
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] border-b border-stone-200">
                <tr>
                  <th className="px-3 py-1.5">Sale Counter</th>
                  <th className="px-3 py-1.5 text-center">Orders</th>
                  <th className="px-3 py-1.5 text-right">Gross (AED)</th>
                  <th className="px-3 py-1.5 text-right">Net (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {Object.entries(metrics.counterBreakdown).map(([counter, data]) => (
                  <tr key={counter} className="hover:bg-stone-50">
                    <td className="px-3 py-2 font-medium text-stone-800">{counter}</td>
                    <td className="px-3 py-2 text-center text-stone-500 font-mono">{data.count}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-stone-700">
                      {formatAED(data.gross)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-[#06D6A0]">
                      {formatAED(data.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Cash & Payment Breakdown */}
          <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
            <div className="bg-stone-100/70 px-3.5 py-2 font-bold text-[11px] text-stone-700 border-b border-stone-200">
              Payment Method Breakdown & Cashier Verification
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] border-b border-stone-200">
                <tr>
                  <th className="px-3 py-1.5">Payment Method</th>
                  <th className="px-3 py-1.5 text-center">Count</th>
                  <th className="px-3 py-1.5 text-right">Gross (AED)</th>
                  <th className="px-3 py-1.5 text-right">Net (AED)</th>
                  <th className="px-3 py-1.5 text-right">Cashier Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {Object.entries(metrics.paymentBreakdown).map(([method, data]) => (
                  <tr key={method} className="hover:bg-stone-50">
                    <td className="px-3 py-2 font-bold text-stone-800">{method}</td>
                    <td className="px-3 py-2 text-center text-stone-500 font-mono">{data.count}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-stone-700">
                      {formatAED(data.gross)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-stone-900">
                      {formatAED(data.net)}
                    </td>
                    <td className="px-3 py-2 text-right text-stone-400 font-mono">
                      [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-200 text-stone-600 text-xs">
            <div>
              <p className="font-semibold mb-8">Cashier / Operator Signature:</p>
              <div className="border-b border-stone-400 w-48"></div>
              <p className="text-[10px] text-stone-400 mt-1">Date: ____________________</p>
            </div>
            <div>
              <p className="font-semibold mb-8">Duty Manager Signature:</p>
              <div className="border-b border-stone-400 w-48"></div>
              <p className="text-[10px] text-stone-400 mt-1">Verified: ____________________</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            SQLite audit log compliant
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-stone-600 hover:text-stone-800 font-medium px-3 py-1.5 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#2D3142] hover:bg-stone-900 px-4 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
