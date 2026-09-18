import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  Scale, 
  TrendingUp, 
  Receipt, 
  DollarSign, 
  Sparkles,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { CashFlowSummary, SummaryMetrics, ExpenseMetrics, SaleRecord, ExpenseRecord, CapitalInjectionRecord } from '../types';
import { formatAED } from '../lib/utils';
import { exportTodaySalesToExcel, exportTodayExpensesToExcel } from '../lib/excelExport';

interface ReportsPreviewProps {
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  capitalInjections: CapitalInjectionRecord[];
  cashFlow: CashFlowSummary;
  salesMetrics: SummaryMetrics;
  expenseMetrics: ExpenseMetrics;
  onOpenReconciliation: () => void;
}

export const ReportsPreview: React.FC<ReportsPreviewProps> = ({
  sales,
  expenses,
  capitalInjections,
  cashFlow,
  salesMetrics,
  expenseMetrics,
  onOpenReconciliation
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'reconciliation' | 'sales' | 'expenses' | 'capital'>('reconciliation');
  const todayStr = new Date().toISOString().split('T')[0];

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.expense_category] = (acc[exp.expense_category] || 0) + exp.amount;
    return acc;
  }, {} as { [key: string]: number });

  // Group sales by counter
  const salesByCounter = sales.reduce((acc, sale) => {
    if (!acc[sale.sale_counter]) {
      acc[sale.sale_counter] = { gross: 0, count: 0, commission: 0, net: 0 };
    }
    acc[sale.sale_counter].gross += sale.gross_amount;
    acc[sale.sale_counter].count += 1;
    acc[sale.sale_counter].commission += sale.commission_amount;
    acc[sale.sale_counter].net += sale.net_amount;
    return acc;
  }, {} as { [key: string]: { gross: number; count: number; commission: number; net: number } });

  return (
    <div className="space-y-6">
      {/* Top Banner indicating Reports (Next Step) */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-5 rounded-xl border border-indigo-700/50 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
              Step 3 Preview • Next Step
            </span>
            <span className="text-xs text-indigo-200">Financial Audit & Analytics</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
            <span>Operational & Financial Reports</span>
          </h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            Audit safe drawer balances, counter distributions, operational expenses and capital history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/20"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={() => exportTodaySalesToExcel(sales, todayStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveReportTab('reconciliation')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeReportTab === 'reconciliation'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Daily Cash Reconciliation
        </button>
        <button
          type="button"
          onClick={() => setActiveReportTab('sales')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeReportTab === 'sales'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Sales by Counter (5 Counters)
        </button>
        <button
          type="button"
          onClick={() => setActiveReportTab('expenses')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeReportTab === 'expenses'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Expense Breakdown (9 Categories)
        </button>
        <button
          type="button"
          onClick={() => setActiveReportTab('capital')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeReportTab === 'capital'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Owner Capital Injections
        </button>
      </div>

      {/* REPORT CONTENT AREA */}

      {/* TAB 1: Reconciliation Sheet */}
      {activeReportTab === 'reconciliation' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Daily Safe Cash Drawer Balance Sheet
              </h3>
              <p className="text-xs text-stone-500">
                Mathematical balance formula: Opening Float + Cash Sales - Drawer Expenses + Owner Capital
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenReconciliation}
              className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 cursor-pointer"
            >
              Open Audit Calculator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs">
              <div className="font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                Inflows & Opening
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Base Safe Float:</span>
                <span className="font-mono font-bold text-stone-800">500.00 AED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Cash Sales (Customer Payments):</span>
                <span className="font-mono font-bold text-emerald-700">+{formatAED(cashFlow.cashSales)}</span>
              </div>
              {cashFlow.b2bPaymentsCash > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-600">B2B Cash Receipts:</span>
                  <span className="font-mono font-bold text-emerald-700">+{formatAED(cashFlow.b2bPaymentsCash)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600">Owner Capital (Drawer Deposits):</span>
                <span className="font-mono font-bold text-emerald-700">+{formatAED(cashFlow.totalOwnerCapital)}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-bold">
                <span>Total Cash Available:</span>
                <span className="font-mono text-emerald-800">
                  {formatAED(500 + cashFlow.cashSales + cashFlow.b2bPaymentsCash + cashFlow.totalOwnerCapital)}
                </span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs">
              <div className="font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                Outflows & Closing Safe Target
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Commissions Paid (All Sales / Card):</span>
                <span className="font-mono font-bold text-amber-700">-{formatAED(cashFlow.commissionsPaidCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Disbursed from Safe Drawer (Expenses):</span>
                <span className="font-mono font-bold text-rose-600">-{formatAED(cashFlow.expensesFromCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Bank / Card Payments (Non-Drawer):</span>
                <span className="font-mono text-stone-500">
                  {formatAED(cashFlow.expensesFromOther)}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-black text-sm bg-emerald-100/60 p-2 rounded-lg text-emerald-950">
                <span>Expected Drawer Safe Cash:</span>
                <span className="font-mono">{formatAED(cashFlow.estimatedCashInDrawer)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Sales by Counter */}
      {activeReportTab === 'sales' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Revenue Breakdown by Counter
            </h3>
            <span className="text-xs font-mono font-bold text-stone-700">
              Total Revenue: {formatAED(salesMetrics.totalGross)}
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Counter</th>
                <th className="p-3 text-center">Transactions</th>
                <th className="p-3 text-right">Gross Amount</th>
                <th className="p-3 text-right">Agency Commission</th>
                <th className="p-3 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {Object.entries(salesByCounter).map(([counter, data]) => (
                <tr key={counter} className="hover:bg-stone-50">
                  <td className="p-3 font-bold text-stone-900">{counter}</td>
                  <td className="p-3 text-center font-mono">{data.count}</td>
                  <td className="p-3 text-right font-mono font-bold text-stone-800">{formatAED(data.gross)}</td>
                  <td className="p-3 text-right font-mono text-purple-700">
                    {data.commission > 0 ? `-${formatAED(data.commission)}` : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-emerald-700">{formatAED(data.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Expenses by Category */}
      {activeReportTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Operating Expenses by Category (9 Categories)
            </h3>
            <span className="text-xs font-mono font-bold text-rose-600">
              Total Outflows: {formatAED(expenseMetrics.totalExpense)}
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(expensesByCategory).map(([cat, total]) => {
              const pct = expenseMetrics.totalExpense > 0 ? (total / expenseMetrics.totalExpense) * 100 : 0;
              return (
                <div key={cat} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="text-xs font-bold text-stone-800 mb-1 truncate">{cat}</div>
                  <div className="text-base font-black font-mono text-rose-600">{formatAED(total)}</div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono mt-1 text-right">{pct.toFixed(1)}% of total</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Owner Capital Ledger */}
      {activeReportTab === 'capital' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center">
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Owner Capital Injection Ledger
            </h3>
            <span className="text-xs font-mono font-black text-emerald-800">
              Total Capital: {formatAED(capitalInjections.reduce((sum, item) => sum + item.amount, 0))}
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {capitalInjections.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/30">
                  <td className="p-3 font-mono">{item.injection_date} {item.injection_time?.substring(0, 5)}</td>
                  <td className="p-3 text-right font-mono font-black text-emerald-700">{formatAED(item.amount)}</td>
                  <td className="p-3 font-semibold text-stone-800">{item.purpose}</td>
                  <td className="p-3 text-stone-500">{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
