import React, { useEffect, useState } from 'react';
import { Minus, Square, X, HardDrive, PanelLeft, Clock } from 'lucide-react';

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
    <div className="bg-[#0B132B] text-slate-200 select-none text-[11px] border-b border-blue-900/60 flex items-center justify-between px-3 py-1 z-40 sticky top-0 shadow-xs">
      {/* Left side: Navigation Toggle & App Title */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isSidebarOpen ? 'bg-stone-800 text-amber-400 hover:bg-stone-700' : 'hover:bg-stone-800 text-stone-400 hover:text-white'
            }`}
            title="Toggle Sidebar Navigation"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="w-4 h-4 rounded bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white font-black text-[9px] shadow-2xs">
          DX
        </div>
        <div className="flex items-center gap-1.5 font-medium tracking-wide">
          <span className="text-stone-200 font-semibold text-[11px]">Desert Xtreme POS</span>
          <span className="text-stone-600">•</span>
          <span className="text-stone-400 text-[10px] font-mono">v1.0.0</span>
        </div>

        {/* Database Status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2.5 border-l border-stone-800 text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-800/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0] animate-pulse"></span>
          <HardDrive className="w-3 h-3 text-[#06D6A0]" />
          <span>POS Database Connected</span>
        </div>
      </div>

      {/* Right side: Live Time & Window Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1 text-stone-400 font-mono text-[10px] bg-stone-900/80 px-2 py-0.5 rounded border border-stone-800">
          <Clock className="w-3 h-3 text-stone-500" />
          <span>{time}</span>
        </div>

        <div className="flex items-center gap-0.5 -mr-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-5 flex items-center justify-center hover:bg-stone-800 text-stone-400 hover:text-white rounded transition-colors"
            title="Minimize"
            aria-label="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-5 flex items-center justify-center hover:bg-stone-800 text-stone-400 hover:text-white rounded transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
            aria-label="Maximize"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-5 flex items-center justify-center hover:bg-rose-600 text-stone-400 hover:text-white rounded transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

