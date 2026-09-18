import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  Receipt, 
  Clock, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Tag,
  CheckCircle2,
  FileSpreadsheet,
  PlusCircle,
  BarChart3,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  Database,
  Percent,
  Users,
  CreditCard,
  Banknote
} from 'lucide-react';
import { CashFlowSummary, SummaryMetrics, ExpenseMetrics, SaleRecord, ExpenseRecord, CapitalInjectionRecord } from '../types';
import { formatAED } from '../lib/utils';
import { NavView } from './AppSidebar';
import { db } from '../db/sqlite';
import { DesertXtremeLogo } from './DesertXtremeLogo';

interface DashboardOverviewProps {
  cashFlow: CashFlowSummary;
  salesMetrics: SummaryMetrics;
  expenseMetrics: ExpenseMetrics;
  recentSales: SaleRecord[];
  recentExpenses: ExpenseRecord[];
  recentCapital: CapitalInjectionRecord[];
  onNavigate: (view: NavView) => void;
  onOpenReconciliation: () => void;
  onOpenCapitalModal: () => void;
}

// Generate ASCII-style block meter (20 blocks wide): ████████████░░░░░░░░
function generateAsciiBar(pct: number, totalBlocks = 20): string {
  const filled = Math.min(totalBlocks, Math.max(0, Math.round((pct / 100) * totalBlocks)));
  const unfilled = totalBlocks - filled;
  return '█'.repeat(filled) + '░'.repeat(unfilled);
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  cashFlow,
  salesMetrics,
  expenseMetrics,
  recentSales,
  recentExpenses,
  recentCapital,
  onNavigate,
  onOpenReconciliation,
  onOpenCapitalModal
}) => {
  const [counterPeriod, setCounterPeriod] = useState<'today' | 'month' | 'all'>('today');

  // Dates
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // 1. TODAY'S DATA CALCULATION
  const allSales = db.getSales({});
  const allExpenses = db.getExpenses({});
  const allCapital = db.getCapitalInjections({});
  const allB2BPayments = db.getB2BPayments({});

  const todaySalesList = allSales.filter((s) => s.sale_date === todayStr);
  const todayExpensesList = allExpenses.filter((e) => e.expense_date === todayStr);
  const todayCapitalList = allCapital.filter((c) => c.injection_date === todayStr);
  const todayB2BPaymentsList = allB2BPayments.filter((p) => p.payment_date === todayStr);

  const todayTotalSalesGross = todaySalesList.reduce((sum, s) => sum + s.gross_amount, 0);
  const todayTotalSalesNet = todaySalesList.reduce((sum, s) => sum + s.net_amount, 0);
  const todayCashSalesGross = todaySalesList.filter(s => s.payment_method === 'Cash').reduce((sum, s) => sum + s.gross_amount, 0);
  const todayCardSalesGross = todaySalesList.filter(s => s.payment_method === 'Card').reduce((sum, s) => sum + s.gross_amount, 0);
  const todayB2BPaymentsCash = todayB2BPaymentsList.filter(p => p.payment_method === 'Cash').reduce((sum, p) => sum + p.amount, 0);
  const todayCommissionsPaidCash = todaySalesList.reduce((sum, s) => sum + s.commission_amount, 0);
  const todayCommissionRate = (todayTotalSalesGross || todayTotalSalesNet) > 0 ? (todayCommissionsPaidCash / (todayTotalSalesGross || todayTotalSalesNet)) * 100 : 0;
  const todayTotalExpenses = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const todayCashExpenses = todayExpensesList.filter(e => e.expense_source === 'Daily Sales Cash' || e.expense_source === 'Petty Cash Box').reduce((sum, e) => sum + e.amount, 0);
  const todayOwnerCapital = todayCapitalList.reduce((sum, c) => sum + c.amount, 0);
  
  // Rule: Cash in hand = Cash Sales + B2B Cash Received + Owner Capital - Cash Commissions (including on Card sales) - Cash Expenses
  const todayCashInHand = Math.round((todayCashSalesGross + todayB2BPaymentsCash + todayOwnerCapital - todayCommissionsPaidCash - todayCashExpenses) * 100) / 100;
  const todayNetCashFlow = Math.round((todayTotalSalesNet + todayOwnerCapital - todayTotalExpenses) * 100) / 100;
  const todayTransCount = todaySalesList.length;

  // Today's Guide Breakdown
  const todayCommissionsByGuide: { guide: string; amount: number; count: number }[] = Object.entries(
    todaySalesList.reduce((acc, s) => {
      if (s.commission_amount > 0) {
        const guide = s.guide_name?.trim() || 'Unassigned Guide';
        if (!acc[guide]) acc[guide] = { amount: 0, count: 0 };
        acc[guide].amount += s.commission_amount;
        acc[guide].count += 1;
      }
      return acc;
    }, {} as Record<string, { amount: number; count: number }>)
  ).map(([guide, data]) => ({ guide, amount: Math.round(data.amount * 100) / 100, count: data.count }))
   .sort((a, b) => b.amount - a.amount);

  // 2. THIS MONTH'S DATA CALCULATION
  const monthSalesList = allSales.filter((s) => s.sale_date >= monthStartStr && s.sale_date <= todayStr);
  const monthExpensesList = allExpenses.filter((e) => e.expense_date >= monthStartStr && e.expense_date <= todayStr);
  const monthCapitalList = allCapital.filter((c) => c.injection_date >= monthStartStr && c.injection_date <= todayStr);

  const monthTotalSalesGross = monthSalesList.reduce((sum, s) => sum + s.gross_amount, 0);
  const monthTotalSalesNet = monthSalesList.reduce((sum, s) => sum + s.net_amount, 0);
  const monthCashSalesGross = monthSalesList.filter(s => s.payment_method === 'Cash').reduce((sum, s) => sum + s.gross_amount, 0);
  const monthCardSalesGross = monthSalesList.filter(s => s.payment_method === 'Card').reduce((sum, s) => sum + s.gross_amount, 0);
  const monthCommissionsPaidCash = monthSalesList.reduce((sum, s) => sum + s.commission_amount, 0);
  const monthCommissionRate = (monthTotalSalesGross || monthTotalSalesNet) > 0 ? (monthCommissionsPaidCash / (monthTotalSalesGross || monthTotalSalesNet)) * 100 : 0;
  const monthTotalExpenses = monthExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const monthOwnerCapital = monthCapitalList.reduce((sum, c) => sum + c.amount, 0);
  const monthNet = monthTotalSalesNet + monthOwnerCapital - monthTotalExpenses;

  // 3. COUNTER PERFORMANCE (TODAY / MONTH / ALL)
  const activeSalesForCounters = 
    counterPeriod === 'today'
      ? (todaySalesList.length > 0 ? todaySalesList : allSales)
      : counterPeriod === 'month'
      ? monthSalesList
      : allSales;

  const standardCountersConfig = [
    { label: 'DXA Counter', fullMatch: 'DXA Sale Counter', color: '#FF6B35', barClass: 'bg-[#FF6B35]' },
    { label: 'Photo', fullMatch: 'Photo Sale', color: '#00B4D8', barClass: 'bg-[#00B4D8]' },
    { label: 'Juice', fullMatch: 'Juice Counter Sale', color: '#06D6A0', barClass: 'bg-[#06D6A0]' },
    { label: 'Supermarket', fullMatch: 'Supermarket Sale', color: '#F7931E', barClass: 'bg-[#F7931E]' },
    { label: 'Popcorn', fullMatch: 'Popcorn Sale', color: '#FF7A00', barClass: 'bg-[#FF7A00]' }
  ];

  const totalCounterSales = activeSalesForCounters.reduce((sum, s) => sum + s.gross_amount, 0) || 1;

  const counterStats = standardCountersConfig.map((counter) => {
    const matchedSales = activeSalesForCounters.filter((s) => 
      s.sale_counter.toLowerCase().includes(counter.label.toLowerCase()) || 
      s.sale_counter === counter.fullMatch
    );
    const amount = matchedSales.reduce((sum, s) => sum + s.gross_amount, 0);
    const count = matchedSales.length;
    const pct = totalCounterSales > 0 ? Math.round((amount / totalCounterSales) * 100) : 0;
    const asciiBar = generateAsciiBar(pct, 20);

    return {
      ...counter,
      amount,
      count,
      pct,
      asciiBar
    };
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. BRAND HERO HEADER (Desert Flame & Sunburst Gradient)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-[#FF5722] via-[#FF6B35] to-[#F7931E] text-white shadow-xl relative overflow-hidden border border-amber-300/40">
        {/* Subtle desert dune decorative curve */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 bg-yellow-300/15 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <DesertXtremeLogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-sm uppercase">
                  Desert Xtreme Adventure
                </h1>
              </div>
              <p className="text-amber-100 text-xs sm:text-sm font-medium flex items-center gap-2 mt-1">
                <span>Live Accounting, Daily Cash Flow & Operations Intelligence</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-mono bg-black/20 px-2 py-0.5 rounded text-amber-200 text-xs">
                  {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shadow-xs">
              <div className="text-[10px] uppercase font-black text-amber-200 tracking-wider">Engine Status</div>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>SQLite DB • Offline-Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HIGH-IMPACT "QUICK ACTIONS" MENU BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#141724] via-[#1A1E2E] to-[#141724] text-white rounded-2xl p-5 shadow-lg border border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white shadow-md border border-amber-300/40 shrink-0">
              <Zap className="w-5 h-5 fill-current text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <span>QUICK ACTIONS</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-mono">
                  HOTKEYS
                </span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                Instant shortcuts for cashier and financial management
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 flex-wrap">
            {/* [New Sale POS] */}
            <button
              type="button"
              onClick={() => onNavigate('sales-new')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white text-xs font-black hover:brightness-110 transition-all shadow-md cursor-pointer active:scale-95 border border-amber-300/30"
              title="Shortcut: F2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Sale</span>
              <span className="bg-black/25 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">F2</span>
            </button>

            {/* [Add Expense] */}
            <button
              type="button"
              onClick={() => onNavigate('expenses-add')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95 border border-rose-400/30"
              title="Shortcut: Alt+E"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Expense</span>
              <span className="bg-black/25 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">Alt+E</span>
            </button>

            {/* [Capital Deposit] */}
            <button
              type="button"
              onClick={onOpenCapitalModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95 border border-emerald-400/30"
              title="Shortcut: Alt+C"
            >
              <Wallet className="w-4 h-4" />
              <span>Capital</span>
              <span className="bg-black/25 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">Alt+C</span>
            </button>

            {/* [Safe Drawer Audit] */}
            <button
              type="button"
              onClick={onOpenReconciliation}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95 border border-amber-400/30"
              title="Shortcut: Alt+R"
            >
              <Scale className="w-4 h-4 text-amber-200" />
              <span>Safe Audit</span>
              <span className="bg-black/25 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">Alt+R</span>
            </button>

            {/* [View Reports] */}
            <button
              type="button"
              onClick={() => onNavigate('reports-cashflow')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95 border border-stone-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TODAY'S SUMMARY
          ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>TODAY'S SUMMARY</span>
            </h2>
            <span className="text-[11px] font-mono text-stone-600 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200 font-bold">
              {todayStr}
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">Real-time daily transactions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Total Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-[#FF6B35]/40 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Sales</span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FF6B35] flex items-center justify-center border border-orange-200/50">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-stone-900">
              {formatAED(todayTotalSalesGross || todayTotalSalesNet)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Net Revenue:</span>
              <span className="font-mono font-bold text-[#FF6B35]">{formatAED(todayTotalSalesNet)} AED</span>
            </div>
          </div>

          {/* Card Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Card Sales</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-600">
              {formatAED(todayCardSalesGross)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Terminal:</span>
              <span className="font-bold text-stone-700">{todaySalesList.filter(s => s.payment_method === 'Card').length} tickets</span>
            </div>
          </div>

          {/* Cash Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Cash Sales</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
              {formatAED(todayCashSalesGross)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>In Drawer:</span>
              <span className="font-bold text-stone-700">+{formatAED(todayB2BPaymentsCash)} B2B</span>
            </div>
          </div>

          {/* Commissions Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Commissions</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-600">
              {formatAED(todayCommissionsPaidCash)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Guides:</span>
              <span className="font-mono font-bold text-amber-800">{todayCommissionRate.toFixed(1)}% rate</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Expenses</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/50">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600">
              {formatAED(todayTotalExpenses)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Logged:</span>
              <span className="font-bold text-stone-700">{todayExpensesList.length} expenses</span>
            </div>
          </div>

          {/* Net Cash in Hand / Drawer */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xs transition-colors ${
            todayCashInHand >= 0 
              ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300' 
              : 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
          }`}>
            <div className="flex items-center justify-between text-stone-600 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Net Cash in Hand</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                todayCashInHand >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono flex items-center gap-1 ${
              todayCashInHand >= 0 ? 'text-emerald-800' : 'text-rose-700'
            }`}>
              <span>{todayCashInHand >= 0 ? `+${formatAED(todayCashInHand)}` : formatAED(todayCashInHand)}</span>
              <span className="text-xs font-normal text-stone-500">AED</span>
            </div>
            <div className="text-[11px] text-stone-600 mt-1 font-medium flex items-center justify-between">
              <span>Drawer Safe:</span>
              <span className="font-mono font-bold text-emerald-800">Ready</span>
            </div>
          </div>
        </div>

        {/* Guide Commissions Breakdown Chips (if present today) */}
        {todayCommissionsByGuide.length > 0 && (
          <div className="mt-3 bg-amber-50/60 border border-amber-200/80 rounded-xl px-3.5 py-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-amber-800 flex items-center gap-1 shrink-0">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Guide Payouts Today:</span>
            </span>
            {todayCommissionsByGuide.map((g) => (
              <span key={g.guide} className="bg-white border border-amber-300/80 text-amber-900 font-medium px-2 py-0.5 rounded-lg text-[11px] shadow-2xs flex items-center gap-1">
                <span>{g.guide}:</span>
                <span className="font-mono font-bold text-amber-700">{formatAED(g.amount)} AED</span>
                <span className="text-[10px] text-stone-400">({g.count}x)</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. THIS MONTH
          ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F7931E]" />
              <span>THIS MONTH</span>
            </h2>
            <span className="text-[11px] font-mono text-stone-600 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200 font-bold">
              {monthName}
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">Month-to-date performance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Total Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-[#FF6B35]/40 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Sales</span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FF6B35] flex items-center justify-center border border-orange-200/50">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-stone-900">
              {formatAED(monthTotalSalesGross || monthTotalSalesNet)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Net:</span>
              <span className="font-mono font-bold text-[#FF6B35]">{formatAED(monthTotalSalesNet)} AED</span>
            </div>
          </div>

          {/* Card Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Card Sales</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-600">
              {formatAED(monthCardSalesGross)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Terminal:</span>
              <span className="font-bold text-stone-700">{monthSalesList.filter(s => s.payment_method === 'Card').length} tickets</span>
            </div>
          </div>

          {/* Cash Sales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Cash Sales</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
              {formatAED(monthCashSalesGross)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Volume:</span>
              <span className="font-bold text-stone-700">{monthSalesList.filter(s => s.payment_method === 'Cash').length} tickets</span>
            </div>
          </div>

          {/* Month Commissions */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Commissions</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-600">
              {formatAED(monthCommissionsPaidCash)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Rate:</span>
              <span className="font-mono font-bold text-amber-800">{monthCommissionRate.toFixed(1)}% rate</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Expenses</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/50">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600">
              {formatAED(monthTotalExpenses)} <span className="text-xs font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-medium flex items-center justify-between">
              <span>Volume:</span>
              <span className="font-bold text-stone-700">{monthExpensesList.length} records</span>
            </div>
          </div>

          {/* Net Operating */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-xs transition-colors ${
            monthNet >= 0 
              ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300' 
              : 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
          }`}>
            <div className="flex items-center justify-between text-stone-600 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Net</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                monthNet >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {monthNet >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              monthNet >= 0 ? 'text-emerald-800' : 'text-rose-700'
            }`}>
              {monthNet >= 0 ? `+${formatAED(monthNet)}` : `${formatAED(monthNet)}`} <span className="text-xs font-normal text-stone-500">AED</span>
            </div>
            <div className="text-[11px] text-stone-600 mt-1 font-medium flex items-center justify-between">
              <span>Position:</span>
              <span className="font-bold">{monthNet >= 0 ? 'Surplus' : 'Deficit'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. COUNTER PERFORMANCE (Today / Month / All)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#FF6B35]" />
              <span>COUNTER PERFORMANCE ({counterPeriod === 'today' ? 'Today' : counterPeriod === 'month' ? 'This Month' : 'All Time'})</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Revenue distribution across all 5 operational stations
            </p>
          </div>

          <div className="flex items-center gap-1 bg-amber-50/60 p-0.5 rounded-xl text-xs font-bold border border-amber-200/60">
            <button
              type="button"
              onClick={() => setCounterPeriod('today')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                counterPeriod === 'today' ? 'bg-[#FF6B35] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCounterPeriod('month')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                counterPeriod === 'month' ? 'bg-[#FF6B35] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setCounterPeriod('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                counterPeriod === 'all' ? 'bg-[#FF6B35] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Counter Rows */}
        <div className="space-y-4">
          {counterStats.map((c) => (
            <div key={c.label} className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/80 hover:bg-stone-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md" style={{ backgroundColor: c.color }} />
                  <span className="font-black text-stone-900 text-sm">{c.label}:</span>
                  <span className="text-xs text-stone-500">({c.count} tickets)</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-black text-stone-900 text-sm">
                    {formatAED(c.amount)} AED
                  </span>
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-stone-200/80 text-stone-800">
                    {c.pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar + ASCII Block representation */}
              <div className="space-y-1.5">
                <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${c.barClass}`}
                    style={{ width: `${Math.max(c.pct, c.amount > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-stone-500 select-none">
                  <span className="text-[#FF6B35] font-bold tracking-tight sm:tracking-normal">{c.asciiBar}</span>
                  <span className="text-[10px] text-stone-400 font-sans">{c.pct}% share</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. LIVE SAFE DRAWER AUDIT & RECENT TRANSACTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drawer Safe Cash Widget */}
        <div className="bg-white rounded-2xl border border-amber-300/80 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Physical Drawer Cash</span>
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                Safe Balance
              </span>
            </div>

            <div className="text-3xl font-black font-mono text-stone-900 mb-3">
              {formatAED(cashFlow.estimatedCashInDrawer)} <span className="text-sm font-bold text-stone-500">AED</span>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
              <div className="flex justify-between">
                <span>Direct Cash Sales Inflow:</span>
                <span className="font-mono font-bold text-emerald-700">+{formatAED(cashFlow.cashSales)} AED</span>
              </div>
              {cashFlow.b2bPaymentsCash > 0 && (
                <div className="flex justify-between">
                  <span>B2B Cash Receipts:</span>
                  <span className="font-mono font-bold text-emerald-700">+{formatAED(cashFlow.b2bPaymentsCash)} AED</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Owner Capital Deposits:</span>
                <span className="font-mono font-bold text-blue-700">+{formatAED(cashFlow.totalOwnerCapital)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Commissions (Paid Out):</span>
                <span className="font-mono font-bold text-amber-700">-{formatAED(cashFlow.commissionsPaidCash)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Drawer Cash Expenses:</span>
                <span className="font-mono font-bold text-rose-600">-{formatAED(cashFlow.expensesFromCash)} AED</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenReconciliation}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-white" />
            <span>Count Cash Drawer Safe</span>
          </button>
        </div>

        {/* Recent Income Feed */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Recent Sales</span>
            </h4>
            <button
              type="button"
              onClick={() => onNavigate('sales-history')}
              className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 text-xs flex-1 max-h-60 overflow-y-auto">
            {recentSales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="p-3 hover:bg-stone-50 transition-colors flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span className="truncate max-w-[120px]">{sale.sale_counter}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      sale.payment_method === 'Cash' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : sale.payment_method === 'Card'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {sale.payment_method}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                    {sale.sale_time.substring(0, 5)} • {sale.reference_no}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-700">
                    +{formatAED(sale.gross_amount)}
                  </div>
                  {sale.commission_amount > 0 && (
                    <div className="text-[10px] font-mono font-bold text-amber-700">
                      -{formatAED(sale.commission_amount)} comm {sale.guide_name ? `(${sale.guide_name})` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses Feed */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
              <span>Recent Expenses</span>
            </h4>
            <button
              type="button"
              onClick={() => onNavigate('expenses-history')}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 text-xs flex-1 max-h-60 overflow-y-auto">
            {recentExpenses.length > 0 ? (
              recentExpenses.slice(0, 4).map((exp) => (
                <div key={exp.id} className="p-3 hover:bg-stone-50 transition-colors flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-900 truncate max-w-[130px]">
                      {exp.expense_category}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 truncate max-w-[140px]">
                      {exp.paid_to || exp.expense_source}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-rose-600">
                      -{formatAED(exp.amount)}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {exp.expense_time?.substring(0, 5) || '--:--'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-stone-400 text-xs">
                No operating expenses logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
