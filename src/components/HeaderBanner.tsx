import React from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  ArrowLeft,
  RotateCcw,
  Database,
  Download,
  Upload
} from 'lucide-react';
import { SummaryMetrics, ExpenseMetrics, CashFlowSummary } from '../types';
import { formatAED } from '../lib/utils';
import { DesertXtremeLogo } from './DesertXtremeLogo';
import { QuickActionsMenu } from './QuickActionsMenu';
import { NavView } from './AppSidebar';

interface HeaderBannerProps {
  activeModule: 'sales' | 'expenses' | 'capital' | 'cashflow';
  onSelectModule: (mod: 'sales' | 'expenses' | 'capital' | 'cashflow') => void;
  metrics: SummaryMetrics;
  expenseMetrics: ExpenseMetrics;
  cashFlow: CashFlowSummary;
  onNewSaleClick: () => void;
  onNewExpenseClick: () => void;
  onOpenCapitalModal: () => void;
  onOpenReconciliation: () => void;
  onReceiveB2BPayment?: () => void;
  onBackupDatabase: () => void;
  onOpenMasterData: (tab?: 'counters' | 'categories' | 'backup' | 'branding') => void;
  onOpenSqlConsole: () => void;
  onExportCsv: () => void;
  onExportSql: () => void;
  onNavigate: (view: NavView) => void;
  customLogo?: string | null;
  currentView?: NavView;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  activeModule,
  onSelectModule,
  metrics,
  expenseMetrics,
  cashFlow,
  onNewSaleClick,
  onNewExpenseClick,
  onOpenCapitalModal,
  onOpenReconciliation,
  onReceiveB2BPayment,
  onBackupDatabase,
  onOpenMasterData,
  onOpenSqlConsole,
  onExportCsv,
  onExportSql,
  onNavigate,
  customLogo,
  currentView = 'home-dashboard'
}) => {
  const isNotHome = currentView !== 'home-dashboard';

  return (
    <header className="bg-[#0F172A] text-slate-100 border-b border-slate-800 px-4 sm:px-6 py-2.5 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Left: Back Button (if on subpage) & Brand Title */}
        <div className="flex items-center gap-3">
          {isNotHome && (
            <button
              type="button"
              onClick={() => onNavigate('home-dashboard')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Return to Main Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <DesertXtremeLogo
            customLogo={customLogo}
            size="md"
          />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                <span className="text-slate-100">Desert Xtreme</span>
                <span className="text-[#FF6B35] font-black text-xs bg-[#FF6B35]/15 px-1.5 py-0.5 rounded border border-[#FF6B35]/30">
                  POS
                </span>
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wide uppercase">Active</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Tour Operations & POS Cashier Engine
            </p>
          </div>
        </div>

        {/* Center: Live Financial Snapshot */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl p-1.5 px-3.5 shadow-inner">
          {/* Drawer Safe Float */}
          <div 
            onClick={onOpenReconciliation}
            className="flex items-center gap-2 pr-3 border-r border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
            title="Click for Safe Reconciliation Audit"
          >
            <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30 shrink-0">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cash In Safe</div>
              <div className="text-xs font-mono font-black text-amber-300">
                {formatAED(cashFlow.estimatedCashInDrawer)} <span className="text-[9px] font-normal text-slate-400">AED</span>
              </div>
            </div>
          </div>

          {/* Today's Sales */}
          <div 
            onClick={() => onNavigate('sales-history')}
            className="flex items-center gap-2 px-3 border-r border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
            title="View Sales Ledger"
          >
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Today's Sales</div>
              <div className="text-xs font-mono font-black text-emerald-400">
                {formatAED(metrics.totalNet)} <span className="text-[9px] font-normal text-slate-400">AED</span>
              </div>
            </div>
          </div>

          {/* Today's Expenses */}
          <div 
            onClick={() => onNavigate('expenses-history')}
            className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-90 transition-opacity"
            title="View Expense Ledger"
          >
            <div className="w-6 h-6 rounded-md bg-rose-500/15 flex items-center justify-center text-rose-400 border border-rose-500/30 shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Today's Expenses</div>
              <div className="text-xs font-mono font-black text-rose-400">
                {formatAED(expenseMetrics.totalExpense)} <span className="text-[9px] font-normal text-slate-400">AED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Restore, Backup & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Quick Restore Button */}
          <button
            type="button"
            onClick={() => onOpenMasterData('backup')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-amber-950/80 text-amber-300 hover:text-white border border-amber-500/40 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
            title="Import or Restore Database Backup File"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Restore Data</span>
          </button>

          {/* Quick Backup Button */}
          <button
            type="button"
            onClick={onBackupDatabase}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
            title="Download Full Database Backup (.db)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Quick Actions Dropdown */}
          <QuickActionsMenu
            onNavigate={onNavigate}
            onNewSale={onNewSaleClick}
            onNewExpense={onNewExpenseClick}
            onOpenCapitalModal={onOpenCapitalModal}
            onOpenReconciliation={onOpenReconciliation}
            onReceiveB2BPayment={onReceiveB2BPayment}
            onBackupDatabase={onBackupDatabase}
            onOpenMasterData={onOpenMasterData}
            onOpenSqlConsole={onOpenSqlConsole}
            onExportCsv={onExportCsv}
          />

          {/* Primary CTA: + New Sale */}
          <button
            type="button"
            onClick={onNewSaleClick}
            className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#ff7a47] text-white font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer border border-[#FF6B35]/40"
            title="Fast POS Sale Entry (F2)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale</span>
            <span className="hidden sm:inline bg-black/25 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ml-0.5">F2</span>
          </button>

          {/* Secondary CTA: + Expense */}
          <button
            type="button"
            onClick={onNewExpenseClick}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-white border border-rose-500/40 font-bold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
            title="Record Expense Voucher (Alt+E)"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>Expense</span>
          </button>
        </div>

      </div>
    </header>
  );
};

