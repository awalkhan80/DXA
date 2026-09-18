import React from 'react';
import { HardDrive, ShieldCheck, Scale, Wallet, Database, Keyboard } from 'lucide-react';

interface AppFooterProps {
  onOpenMasterData: () => void;
  onOpenCapitalModal: () => void;
  onOpenReconciliation: () => void;
  onOpenSqlConsole: () => void;
  capitalInjectionsCount: number;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenMasterData,
  onOpenCapitalModal,
  onOpenReconciliation,
  onOpenSqlConsole,
  capitalInjectionsCount,
}) => {
  return (
    <footer className="bg-[#0D1A2D] text-slate-300 border-t border-blue-900/50 py-2.5 px-4 sm:px-6 text-xs select-none sticky bottom-0 z-20 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Left: System & DB Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-blue-950/80 text-emerald-400 px-2.5 py-1 rounded-lg border border-blue-800/60 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite Local DB</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="font-semibold text-white">DESERT XTREME POS</span>
            <span className="text-slate-600">•</span>
            <span>Tour Operations & Safari Cashier</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-400 text-[10px]">v1.0.0</span>
          </div>
        </div>

        {/* Center: Hotkey Helper Pills */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">
            <Keyboard className="w-3 h-3 text-[#FF6B35]" />
            <span className="text-[#FF6B35] font-bold">F2</span>
            <span>New Sale</span>
          </div>
          <div className="flex items-center gap-1 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">
            <span className="text-rose-400 font-bold">Alt+E</span>
            <span>Expense</span>
          </div>
          <div className="flex items-center gap-1 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">
            <span className="text-emerald-400 font-bold">Alt+C</span>
            <span>Capital</span>
          </div>
          <div className="flex items-center gap-1 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">
            <span className="text-amber-400 font-bold">Alt+R</span>
            <span>Safe Audit</span>
          </div>
        </div>

        {/* Right: Management Links */}
        <div className="flex items-center gap-3 text-[11px] font-medium flex-wrap">
          <button
            type="button"
            onClick={onOpenMasterData}
            className="flex items-center gap-1 text-slate-300 hover:text-white hover:underline transition-colors cursor-pointer"
            title="Manage Counters, Payment Methods & Expense Categories"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Master Tables</span>
          </button>

          <span className="text-slate-700">•</span>

          <button
            type="button"
            onClick={onOpenCapitalModal}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline transition-colors cursor-pointer font-bold"
            title="Inject or View Owner Capital Deposits"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Capital ({capitalInjectionsCount})</span>
          </button>

          <span className="text-slate-700">•</span>

          <button
            type="button"
            onClick={onOpenReconciliation}
            className="flex items-center gap-1 text-slate-300 hover:text-white hover:underline transition-colors cursor-pointer"
            title="Open Daily Cashier Balance Sheet"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Cashier Audit</span>
          </button>

          <span className="text-slate-700">•</span>

          <button
            type="button"
            onClick={onOpenSqlConsole}
            className="flex items-center gap-1 text-slate-400 hover:text-white hover:underline transition-colors cursor-pointer font-mono"
            title="Open SQLite Query Terminal"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>SQLite Terminal</span>
          </button>
        </div>

      </div>
    </footer>
  );
};
