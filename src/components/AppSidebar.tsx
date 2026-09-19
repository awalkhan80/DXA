import React from 'react';
import {
  Zap,
  PlusCircle,
  Receipt,
  TrendingDown,
  FileText,
  Wallet,
  Scale,
  BarChart3,
  PieChart,
  BadgePercent,
  Database,
  Sliders,
  Sparkles,
  Terminal,
  LayoutDashboard,
  X,
  ChevronRight,
  ShieldCheck,
  Car,
  Users,
  CreditCard,
  Clock
} from 'lucide-react';
import { SummaryMetrics, ExpenseMetrics, CashFlowSummary } from '../types';
import { formatAED } from '../lib/utils';
import { DesertXtremeLogo } from './DesertXtremeLogo';

export type AppView =
  | 'home-dashboard'
  | 'sales-income'
  | 'sales-new'
  | 'sales-history'
  | 'vehicles-fleet'
  | 'customers-report'
  | 'credit-history'
  | 'petty-cash'
  | 'pending-expenses'
  | 'expenses-add'
  | 'expenses-history'
  | 'expenses-capital'
  | 'reports'
  | 'reports-b2b-sales'
  | 'reports-b2b-ledger'
  | 'reports-b2c-sales'
  | 'reports-cashflow'
  | 'reports-sales'
  | 'reports-expenses'
  | 'reports-counters'
  | 'reports-datewise';

export type NavView = AppView;

interface AppSidebarProps {
  currentView: AppView;
  onSelectView?: (view: AppView) => void;
  onNavigate?: (view: AppView) => void;
  salesMetrics: SummaryMetrics;
  expenseMetrics: ExpenseMetrics;
  cashFlow: CashFlowSummary;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  onBackupDatabase: () => void;
  onOpenSqlConsole: () => void;
  onOpenMasterData: (tab?: 'counters' | 'categories' | 'backup' | 'branding') => void;
  onOpenReconciliation: () => void;
  customLogo?: string | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onSelectView,
  onNavigate,
  salesMetrics,
  expenseMetrics,
  cashFlow,
  isMobileOpen,
  onToggleMobile,
  onBackupDatabase,
  onOpenSqlConsole,
  onOpenMasterData,
  onOpenReconciliation,
  customLogo
}) => {
  const handleNavClick = (view: AppView) => {
    if (onSelectView) onSelectView(view);
    else if (onNavigate) onNavigate(view);

    if (isMobileOpen) {
      onToggleMobile();
    }
  };

  const isSalesActive = ['sales-income', 'sales-new'].includes(currentView);
  const isSalesHistoryActive = currentView === 'sales-history';
  const isExpenseActive = currentView === 'expenses-add';
  const isExpenseHistoryActive = currentView === 'expenses-history';

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#141724] text-stone-200 border-r border-amber-900/30 flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-stone-800 flex items-center justify-between bg-[#10121D]">
          <DesertXtremeLogo
            customLogo={customLogo}
            size="sm"
            showText={true}
          />

          <button
            onClick={onToggleMobile}
            className="md:hidden text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 text-xs">
          
          {/* Section 1: Dashboard */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF8A00] flex items-center justify-between">
              <span>Overview</span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick('home-dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'home-dashboard'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-amber-300" />
                  <span>Main Dashboard</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  currentView === 'home-dashboard' ? 'bg-black/20 text-white' : 'bg-stone-800 text-stone-400'
                }`}>
                  Live
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Quick POS & Sales */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF8A00] flex items-center justify-between">
              <span>Sales & Cashier</span>
            </div>
            <div className="space-y-1">
              {/* New Sale Entry */}
              <button
                type="button"
                onClick={() => handleNavClick('sales-new')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSalesActive
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-amber-300" />
                  <span>New Sale (POS)</span>
                </div>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-700/60 font-bold">
                  F2
                </span>
              </button>

              {/* Sales History */}
              <button
                type="button"
                onClick={() => handleNavClick('sales-history')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSalesHistoryActive
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4" />
                  <span>Sales Register</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isSalesHistoryActive
                    ? 'bg-black/20 text-white'
                    : 'bg-stone-800 text-stone-400'
                }`}>
                  {salesMetrics.transactionCount}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2.5: DXA Fleet & Customers */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF8A00] flex items-center justify-between">
              <span>Operations & Fleet</span>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick('vehicles-fleet')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'vehicles-fleet'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-orange-400" />
                  <span>Vehicle Master Fleet</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('customers-report')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'customers-report'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Customer Directory</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('credit-history')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'credit-history'
                    ? 'bg-gradient-to-r from-purple-800 to-purple-600 text-white shadow-md font-black'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Accounts Receivable (B2B Credit)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('petty-cash')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'petty-cash'
                    ? 'bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-md font-black'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span>Petty Cash System</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('pending-expenses')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'pending-expenses'
                    ? 'bg-gradient-to-r from-rose-800 to-rose-600 text-white shadow-md font-black'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span>Accounts Payable (Expense Credit)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Expenses & Capital */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF8A00]">
              Expenses & Capital
            </div>
            <div className="space-y-1">
              {/* Record Expense */}
              <button
                type="button"
                onClick={() => handleNavClick('expenses-add')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isExpenseActive
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>Record Expense</span>
                </div>
              </button>

              {/* Expense History */}
              <button
                type="button"
                onClick={() => handleNavClick('expenses-history')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isExpenseHistoryActive
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  <span>Expense Register</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isExpenseHistoryActive
                    ? 'bg-black/20 text-white'
                    : 'bg-stone-800 text-stone-400'
                }`}>
                  {expenseMetrics.expenseCount}
                </span>
              </button>

              {/* Owner Capital */}
              <button
                type="button"
                onClick={() => handleNavClick('expenses-capital')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'expenses-capital'
                    ? 'bg-emerald-600 text-white shadow-md font-black'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Owner Capital</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  currentView === 'expenses-capital'
                    ? 'bg-black/20 text-white'
                    : 'bg-stone-800 text-emerald-400'
                }`}>
                  +{formatAED(cashFlow.totalOwnerCapital)}
                </span>
              </button>
            </div>
          </div>

          {/* Section 4: Reports */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF8A00]">
              Financial & Sales Reports
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick('reports-b2b-sales')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'reports-b2b-sales'
                    ? 'bg-gradient-to-r from-orange-600 to-[#FF6B35] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BadgePercent className="w-4 h-4 text-orange-400" />
                  <span>B2B Sales Report</span>
                </div>
                <span className="text-[9px] bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded font-bold">
                  B2B
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reports-b2b-ledger')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'reports-b2b-ledger'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-amber-600 text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-300" />
                  <span>B2B Customer Ledger</span>
                </div>
                <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  STMT
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reports-b2c-sales')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'reports-b2c-sales'
                    ? 'bg-stone-900 text-white ring-1 ring-emerald-500 shadow-md font-black'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>B2C Sales Report</span>
                </div>
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  B2C
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reports-cashflow')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'reports-cashflow' || currentView === 'reports'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Scale className="w-4 h-4 text-amber-300" />
                  <span>Cash Flow & Drawer</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reports-sales')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'reports-sales'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-blue-300" />
                  <span>Total Sales Report</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reports-expenses')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'reports-expenses'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PieChart className="w-4 h-4 text-rose-300" />
                  <span>Expense Breakdown</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reports-counters')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'reports-counters'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white shadow-md font-black border border-amber-300/30'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BadgePercent className="w-4 h-4 text-emerald-300" />
                  <span>Counter Performance</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 5: Settings & Tools */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500">
              Settings & Database
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onBackupDatabase();
                  if (isMobileOpen) onToggleMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:bg-stone-800/80 hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Backup System Data</span>
                </div>
                <span className="text-[9px] text-indigo-400 font-mono font-bold">SAVE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenMasterData('counters');
                  if (isMobileOpen) onToggleMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:bg-stone-800/80 hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Counters & Categories</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenMasterData('branding');
                  if (isMobileOpen) onToggleMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:bg-stone-800/80 hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                  <span>Logo & Branding</span>
                </div>
                {customLogo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenReconciliation();
                  if (isMobileOpen) onToggleMobile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Safe Drawer Audit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenSqlConsole();
                  if (isMobileOpen) onToggleMobile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>DB Console & Diagnostics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Safe Cash Status Widget in Sidebar Bottom */}
        <div className="p-3 border-t border-stone-800 bg-[#10121D]">
          <div 
            onClick={onOpenReconciliation}
            className="bg-gradient-to-b from-[#181B28] to-[#12141F] rounded-xl p-2.5 border border-amber-500/20 shadow-inner cursor-pointer hover:border-amber-400/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Drawer Safe Cash</span>
              </span>
              <span className="text-[9px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">LIVE</span>
            </div>
            <div className="text-base font-black font-mono text-white">
              {formatAED(cashFlow.estimatedCashInDrawer)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[10px] text-stone-400 flex items-center justify-between mt-1 pt-1 border-t border-stone-800/80">
              <span className="text-emerald-400">+{formatAED(cashFlow.cashSales)}</span>
              <span className="text-rose-400">-{formatAED(cashFlow.expensesFromCash)}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
