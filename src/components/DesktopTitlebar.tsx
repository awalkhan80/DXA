import React, { useEffect, useState } from 'react';
import { Database, Minus, Square, X, RefreshCw, HardDrive, ShieldCheck, PanelLeft } from 'lucide-react';

interface DesktopTitlebarProps {
  onOpenSqlConsole: () => void;
  onOpenMasterData: () => void;
  onOpenReconciliation: () => void;
  onBackup: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const DesktopTitlebar: React.FC<DesktopTitlebarProps> = ({
  onOpenSqlConsole,
  onOpenMasterData,
  onOpenReconciliation,
  onBackup,
  onToggleSidebar,
  isSidebarOpen = true
}) => {
  const [time, setTime] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMinimize = () => {
    // Check if running in Electron
    if ((window as any).electronAPI?.minimize) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if ((window as any).electronAPI?.maximize) {
      (window as any).electronAPI.maximize();
      setIsMaximized(!isMaximized);
    } else {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI?.close) {
      (window as any).electronAPI.close();
    }
  };

  return (
    <div className="bg-[#2D3142] text-amber-50 select-none text-xs border-b border-stone-700/60 flex items-center justify-between px-3 py-1.5 z-40 sticky top-0 shadow-sm">
      {/* Left side: App branding & SQLite status */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-1 rounded transition-colors cursor-pointer mr-0.5 ${
              isSidebarOpen ? 'bg-stone-800 text-amber-400 hover:bg-stone-700' : 'hover:bg-stone-800 text-stone-400 hover:text-white'
            }`}
            title="Toggle Sidebar Navigation"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="w-5 h-5 rounded bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white font-black text-[10px] shadow-sm">
          DX
        </div>
        <div className="flex items-center gap-1.5 font-medium tracking-wide">
          <span className="text-white font-semibold">DESERT XTREME ADVENTURE</span>
          <span className="text-stone-400">|</span>
          <span className="text-stone-300">Income Entry v1.0.0</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300 border border-stone-700 font-mono">
            WIN-DESKTOP
          </span>
        </div>

        {/* Database Status indicator */}
        <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l border-stone-700 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
          <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse"></span>
          <HardDrive className="w-3.5 h-3.5 text-[#06D6A0]" />
          <span>SQLite: local embedded [sales.db]</span>
        </div>
      </div>

      {/* Center Tools & Time */}
      <div className="hidden lg:flex items-center gap-2 text-stone-300">
        <button
          onClick={onOpenSqlConsole}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800/80 hover:bg-[#FF6B35] hover:text-white transition-colors border border-stone-700"
          title="Open Embedded SQLite Terminal & Query Inspector"
        >
          <Database className="w-3 h-3 text-[#00B4D8]" />
          <span>SQLite Console</span>
        </button>

        <button
          onClick={onOpenMasterData}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800/80 hover:bg-[#FF6B35] hover:text-white transition-colors border border-stone-700"
          title="Manage Counters & Payment Methods Master Data"
        >
          <ShieldCheck className="w-3 h-3 text-[#F7931E]" />
          <span>Master Tables</span>
        </button>

        <button
          onClick={onOpenReconciliation}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800/80 hover:bg-[#FF6B35] hover:text-white transition-colors border border-stone-700"
          title="Cashier Daily Reconciliation Sheet"
        >
          <RefreshCw className="w-3 h-3 text-[#06D6A0]" />
          <span>Daily Sheet</span>
        </button>

        <span className="text-stone-400 font-mono text-[11px] px-2 py-0.5 bg-stone-800/60 rounded border border-stone-700/50">
          {time}
        </span>
      </div>

      {/* Right side: Native Windows Controls */}
      <div className="flex items-center gap-1 -mr-1">
        <button
          onClick={handleMinimize}
          className="w-8 h-6 flex items-center justify-center hover:bg-stone-700/80 text-stone-300 hover:text-white rounded transition-colors"
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-6 flex items-center justify-center hover:bg-stone-700/80 text-stone-300 hover:text-white rounded transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-6 flex items-center justify-center hover:bg-rose-600 text-stone-300 hover:text-white rounded transition-colors"
          title="Close"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
