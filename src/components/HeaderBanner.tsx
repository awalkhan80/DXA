import React from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  FileSpreadsheet,
  Database,
  Sliders,
  Zap
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
  customLogo
}) => {
  return (
    <header className="bg-gradient-to-r from-[#161924] via-[#1C2030] to-[#161924] text-white border-b border-amber-900/40 px-3.5 py-2.5 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Left: Brand Identity & Active Section Title */}
        <div className="flex items-center gap-3">
          <DesertXtremeLogo
            customLogo={customLogo}
            size="md"
          />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
                  Desert Xtreme
                </span>
                <span className="text-[#FF7A00] font-bold">POS</span>
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
            <p className="text-[11px] text-amber-200/70 flex items-center gap-2 mt-0.5">
              <span>Cash Register • Daily Float • Quick Vouchers</span>
            </p>
          </div>
        </div>

        {/* Center: Live Financial Snapshot Badges in Brand Styling */}
        <div className="hidden lg:flex items-center gap-2 bg-[#12141C]/90 border border-stone-800 rounded-xl p-1.5 px-3 shadow-inner">
          {/* Drawer Safe Float */}
          <div 
            onClick={onOpenReconciliation}
            className="flex items-center gap-2 pr-3 border-r border-stone-800 cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to Count Safe Cash"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Cash in Safe</div>
              <div className="text-xs font-mono font-black text-amber-300">
                {formatAED(cashFlow.estimatedCashInDrawer)} <span className="text-[10px] font-normal text-stone-400">AED</span>
              </div>
            </div>
          </div>

          {/* Today's Sales */}
          <div 
            onClick={() => onNavigate('sales-history')}
            className="flex items-center gap-2 px-3 border-r border-stone-800 cursor-pointer hover:opacity-80 transition-opacity"
            title="View Sales Register"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Sales Today</div>
              <div className="text-xs font-mono font-black text-emerald-400">
                {formatAED(metrics.totalNet)} <span className="text-[10px] font-normal text-stone-400">AED</span>
              </div>
            </div>
          </div>

          {/* Today's Expenses */}
          <div 
            onClick={() => onNavigate('expenses-history')}
            className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-80 transition-opacity"
            title="View Expense Register"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400 border border-rose-500/30">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Expenses Today</div>
              <div className="text-xs font-mono font-black text-rose-400">
                {formatAED(expenseMetrics.totalExpense)} <span className="text-[10px] font-normal text-stone-400">AED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: QUICK ACTIONS Menu & Direct Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main "QUICK ACTIONS" Dropdown Trigger */}
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

          {/* Direct + New Sale POS Button */}
          <button
            type="button"
            onClick={onNewSaleClick}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:brightness-110 text-white font-black px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer border border-amber-300/30"
            title="Fast POS Sale Entry (F2)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale</span>
            <span className="hidden sm:inline bg-black/25 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">F2</span>
          </button>

          {/* Direct + Expense Button */}
          <button
            type="button"
            onClick={onNewExpenseClick}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-rose-950/70 text-rose-300 hover:text-white border border-rose-500/40 font-bold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
            title="Record Expense Voucher (Alt+E)"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>Expense</span>
          </button>

          {/* Direct + Capital Button */}
          <button
            type="button"
            onClick={onOpenCapitalModal}
            className="hidden sm:flex items-center gap-1.5 bg-stone-800 hover:bg-emerald-950/70 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
            title="Inject Owner Capital (Alt+C)"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Capital</span>
          </button>
        </div>

      </div>
    </header>
  );
};
