import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowDownRight, 
  Wallet, 
  Percent, 
  Layers, 
  ShieldCheck,
  Scale
} from 'lucide-react';
import { CashFlowSummary } from '../types';
import { formatAED } from '../lib/utils';

interface CashPositionSummaryProps {
  cashFlow: CashFlowSummary;
  dateFilterLabel: string;
  onOpenCapitalModal: () => void;
}

export const CashPositionSummary: React.FC<CashPositionSummaryProps> = ({
  cashFlow,
  dateFilterLabel,
  onOpenCapitalModal
}) => {
  const netOperatingProfit = cashFlow.netSalesIncome - cashFlow.totalExpenses;
  const isPositiveOperating = netOperatingProfit >= 0;

  return (
    <div className="bg-gradient-to-br from-stone-900 via-[#2D3142] to-stone-900 text-white rounded-xl shadow-md border border-stone-700/80 p-4 sm:p-5 mb-6 overflow-hidden relative">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#FF6B35]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-stone-700/80 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#FF6B35]" />
              <span>Cash Flow & Drawer Net Position ({dateFilterLabel})</span>
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              Live SQLite Balancing
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Real-time reconciliation of Daily Cash Sales + Owner Capital minus Cash Commissions & Cash Expenses
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCapitalModal}
          className="self-start lg:self-auto flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow transition-all cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>+ Owner Capital Inflow</span>
        </button>
      </div>

      {/* Grid of Key Cash Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Cash Sales Inflow */}
        <div className="bg-stone-800/80 rounded-lg p-3 border border-stone-700/70">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span>+ Cash Sales</span>
          </div>
          <div className="text-lg font-black font-mono text-white mt-1">
            {formatAED(cashFlow.cashSales)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Card: {formatAED(cashFlow.cardSales)}
          </div>
        </div>

        {/* 2. Owner Capital Inflow */}
        <div className="bg-stone-800/80 rounded-lg p-3 border border-stone-700/70">
          <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
            <span>+ Owner Capital</span>
          </div>
          <div className="text-lg font-black font-mono text-emerald-300 mt-1">
            +{formatAED(cashFlow.totalOwnerCapital)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Operations float
          </div>
        </div>

        {/* 3. Driver & B2B Commissions */}
        <div className="bg-stone-800/80 rounded-lg p-3 border border-stone-700/70">
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
            <span>- Cash Commissions</span>
          </div>
          <div className="text-lg font-black font-mono text-amber-300 mt-1">
            -{formatAED(cashFlow.commissionsPaidCash)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Paid to drivers/agents
          </div>
        </div>

        {/* 4. Cash Expenses Outflow */}
        <div className="bg-stone-800/80 rounded-lg p-3 border border-stone-700/70">
          <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
            <span>- Cash Expenses</span>
          </div>
          <div className="text-lg font-black font-mono text-rose-300 mt-1">
            -{formatAED(cashFlow.expensesFromCash)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            From daily drawer
          </div>
        </div>

        {/* 5. Net Estimated Cash In Drawer */}
        <div className="bg-emerald-950/60 rounded-lg p-3 border border-emerald-500/40 lg:col-span-1">
          <div className="text-[11px] font-bold text-emerald-300 flex items-center justify-between">
            <span>= Cash in Drawer</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">
            {formatAED(cashFlow.estimatedCashInDrawer)}
          </div>
          <div className="text-[10px] text-emerald-200/70 mt-0.5">
            Expected safe cash
          </div>
        </div>

        {/* 6. Net Operating Profit */}
        <div className={`rounded-lg p-3 border ${
          isPositiveOperating ? 'bg-stone-800/80 border-stone-700/70' : 'bg-rose-950/40 border-rose-800/60'
        }`}>
          <div className="text-[11px] font-semibold text-stone-300 flex items-center gap-1">
            <span>Net Period Profit</span>
          </div>
          <div className={`text-lg font-black font-mono mt-1 ${
            isPositiveOperating ? 'text-white' : 'text-rose-400'
          }`}>
            {formatAED(netOperatingProfit)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Net Sales - All Exp.
          </div>
        </div>
      </div>
    </div>
  );
};
