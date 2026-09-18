import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  PlusCircle,
  TrendingDown,
  Wallet,
  Scale,
  FileSpreadsheet,
  Database,
  Sliders,
  Sparkles,
  Terminal,
  Printer,
  ChevronDown,
  X
} from 'lucide-react';
import { NavView } from './AppSidebar';

interface QuickActionsMenuProps {
  onNavigate: (view: NavView) => void;
  onNewSale: () => void;
  onNewExpense: () => void;
  onOpenCapitalModal: () => void;
  onOpenReconciliation: () => void;
  onReceiveB2BPayment?: () => void;
  onBackupDatabase: () => void;
  onOpenMasterData: (tab?: 'counters' | 'categories' | 'backup' | 'branding') => void;
  onOpenSqlConsole: () => void;
  onExportCsv?: () => void;
  compact?: boolean;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  onNavigate,
  onNewSale,
  onNewExpense,
  onOpenCapitalModal,
  onOpenReconciliation,
  onReceiveB2BPayment,
  onBackupDatabase,
  onOpenMasterData,
  onOpenSqlConsole,
  onExportCsv,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actions = [
    {
      label: 'New Sale (POS)',
      shortcut: 'F2',
      icon: PlusCircle,
      desc: 'Quick cash / card ticket entry',
      color: 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white hover:brightness-110 shadow-sm border border-amber-300/30',
      textColor: 'text-white',
      action: () => {
        onNewSale();
        setIsOpen(false);
      }
    },
    {
      label: 'Receive B2B Payment',
      shortcut: 'Alt+P',
      icon: Wallet,
      desc: 'Credit recovery receipt for partner',
      color: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:brightness-110 shadow-sm',
      textColor: 'text-white',
      action: () => {
        if (onReceiveB2BPayment) {
          onReceiveB2BPayment();
        } else {
          onNavigate('reports-b2b-ledger');
        }
        setIsOpen(false);
      }
    },
    {
      label: 'Record Expense',
      shortcut: 'Alt+E',
      icon: TrendingDown,
      desc: 'Cash voucher & supplier bills',
      color: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:brightness-110 shadow-sm',
      textColor: 'text-white',
      action: () => {
        onNewExpense();
        setIsOpen(false);
      }
    },
    {
      label: 'Owner Capital Deposit',
      shortcut: 'Alt+C',
      icon: Wallet,
      desc: 'Inject funds into safe or bank',
      color: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-sm',
      textColor: 'text-white',
      action: () => {
        onOpenCapitalModal();
        setIsOpen(false);
      }
    },
    {
      label: 'Safe Drawer Audit',
      shortcut: 'Alt+R',
      icon: Scale,
      desc: 'Count physical notes & coins',
      color: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:brightness-110 shadow-sm',
      textColor: 'text-white',
      action: () => {
        onOpenReconciliation();
        setIsOpen(false);
      }
    },
    {
      label: 'Financial Reports',
      shortcut: 'Alt+F',
      icon: FileSpreadsheet,
      desc: 'Cash flow & sales summary',
      color: 'bg-stone-800 text-amber-300 hover:bg-stone-700 border border-stone-700',
      textColor: 'text-amber-300',
      action: () => {
        onNavigate('reports-cashflow');
        setIsOpen(false);
      }
    },
    {
      label: 'Backup Database',
      shortcut: 'Alt+B',
      icon: Database,
      desc: 'Save local SQLite .db file',
      color: 'bg-stone-800 text-indigo-300 hover:bg-stone-700 border border-stone-700',
      textColor: 'text-indigo-300',
      action: () => {
        onBackupDatabase();
        setIsOpen(false);
      }
    },
    {
      label: 'Logo & Master Data',
      shortcut: '',
      icon: Sparkles,
      desc: 'Counters, categories & branding',
      color: 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700',
      textColor: 'text-stone-200',
      action: () => {
        onOpenMasterData('branding');
        setIsOpen(false);
      }
    }
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button styled with Desert Xtreme Flame Gradient */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B35] via-[#FF7A00] to-[#F7931E] text-white font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all border border-amber-200/40 cursor-pointer"
        title="Quick Actions Menu (Shortcuts: F2, Alt+E, Alt+C, Alt+R)"
      >
        <Zap className="w-3.5 h-3.5 fill-current text-amber-200 animate-pulse" />
        <span className="tracking-wide">QUICK ACTIONS</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#181B26] border border-amber-500/30 text-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#131520] via-[#1c2030] to-[#131520] border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white text-xs font-black shadow-xs">
                ⚡
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Quick Actions Menu
                </div>
                <div className="text-[10px] text-stone-400">
                  Instant POS & Accounting Operations
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action List Grid */}
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={act.action}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer group hover:scale-[1.01] ${act.color}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-black/20 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{act.label}</div>
                      <div className="text-[10px] opacity-80 truncate">{act.desc}</div>
                    </div>
                  </div>

                  {act.shortcut && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-black bg-black/30 text-white shrink-0 ml-2 border border-white/20">
                      {act.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-[#10121a] border-t border-stone-800/80 text-[10px] text-stone-400 flex items-center justify-between">
            <span>Press keys anywhere on screen</span>
            <span className="text-amber-400 font-mono font-bold">F2 for New Sale</span>
          </div>
        </div>
      )}
    </div>
  );
};
