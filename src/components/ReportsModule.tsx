import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  TrendingUp, 
  Receipt, 
  Layers, 
  Building, 
  Scale, 
  ChevronRight, 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  FileText,
  Calendar,
  Award,
  CreditCard,
  Banknote,
  Briefcase,
  Code,
  Store,
  BookOpen,
  Wallet,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { CashFlowSummary, SummaryMetrics, ExpenseMetrics, SaleRecord, ExpenseRecord, CapitalInjectionRecord, B2BPaymentRecord } from '../types';
import { formatAED } from '../lib/utils';
import { 
  exportCashFlowReportToExcel, 
  exportSalesReportToExcel, 
  exportExpensesReportToExcel, 
  exportCounterSalesReportToExcel 
} from '../lib/excelExport';
import {
  exportCashFlowPdf,
  exportSalesPdf,
  exportExpensesPdf,
  exportCounterSalesPdf
} from '../lib/pdfExport';
import { B2BSalesReport } from './reports/B2BSalesReport';
import { B2BCustomerLedger } from './reports/B2BCustomerLedger';
import { B2CSalesReport } from './reports/B2CSalesReport';

interface ReportsModuleProps {
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  capitalInjections: CapitalInjectionRecord[];
  b2bPayments?: B2BPaymentRecord[];
  cashFlow: CashFlowSummary;
  salesMetrics: SummaryMetrics;
  expenseMetrics: ExpenseMetrics;
  onOpenReconciliation: () => void;
  onReceiveB2BPayment?: (partnerName?: string) => void;
  onRefreshData?: () => void;
  initialTab?: ReportTab;
}

export type ReportTab = 
  | 'b2b-sales' 
  | 'b2b-ledger' 
  | 'b2c-sales' 
  | 'cashflow' 
  | 'sales' 
  | 'expenses' 
  | 'counters' 
  | 'reconciliation';

// Format YYYY-MM-DD into "DD-MMM" (e.g., "15-Mar") matching user request
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthStr = monthNames[monthIdx] || parts[1];
  return `${day}-${monthStr}`;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  sales,
  expenses,
  capitalInjections,
  b2bPayments = [],
  cashFlow,
  salesMetrics,
  expenseMetrics,
  onOpenReconciliation,
  onReceiveB2BPayment,
  onRefreshData,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab || 'cashflow');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Universal Date Range Filter: [From] ───── [To] [Generate]
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>(todayStr);
  const [appliedFromDate, setAppliedFromDate] = useState<string>('');
  const [appliedToDate, setAppliedToDate] = useState<string>(todayStr);
  const [showSql, setShowSql] = useState<boolean>(false);

  // Apply Date Range
  const handleGenerate = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const handleQuickPreset = (preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all') => {
    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
      setAppliedFromDate(todayStr);
      setAppliedToDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setFromDate(yStr);
      setToDate(yStr);
      setAppliedFromDate(yStr);
      setAppliedToDate(yStr);
    } else if (preset === 'thisWeek') {
      const curr = new Date();
      // Monday as first day of week
      const first = curr.getDate() - (curr.getDay() === 0 ? 6 : curr.getDay() - 1);
      const firstDay = new Date(curr.setDate(first)).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(todayStr);
      setAppliedFromDate(firstDay);
      setAppliedToDate(todayStr);
    } else if (preset === 'thisMonth') {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(todayStr);
      setAppliedFromDate(firstDay);
      setAppliedToDate(todayStr);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
      setAppliedFromDate('');
      setAppliedToDate('');
    }
  };

  // Filtered Datasets based on applied dates
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (appliedFromDate && s.sale_date < appliedFromDate) return false;
      if (appliedToDate && s.sale_date > appliedToDate) return false;
      return true;
    });
  }, [sales, appliedFromDate, appliedToDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (appliedFromDate && e.expense_date < appliedFromDate) return false;
      if (appliedToDate && e.expense_date > appliedToDate) return false;
      return true;
    });
  }, [expenses, appliedFromDate, appliedToDate]);

  const filteredCapital = useMemo(() => {
    return capitalInjections.filter((c) => {
      if (appliedFromDate && c.injection_date < appliedFromDate) return false;
      if (appliedToDate && c.injection_date > appliedToDate) return false;
      return true;
    });
  }, [capitalInjections, appliedFromDate, appliedToDate]);

  const filteredB2BPayments = useMemo(() => {
    return b2bPayments.filter((p) => {
      if (appliedFromDate && p.payment_date < appliedFromDate) return false;
      if (appliedToDate && p.payment_date > appliedToDate) return false;
      return true;
    });
  }, [b2bPayments, appliedFromDate, appliedToDate]);

  // 1. CASH FLOW & PHYSICAL CASH IN HAND CALCULATIONS
  const totalSalesGross = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.gross_amount, 0);
  }, [filteredSales]);

  const totalSalesCommission = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.commission_amount, 0);
  }, [filteredSales]);

  const totalSalesNet = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.net_amount, 0);
  }, [filteredSales]);

  const cashSalesGross = useMemo(() => {
    return filteredSales
      .filter((s) => s.payment_method === 'Cash')
      .reduce((sum, s) => sum + s.gross_amount, 0);
  }, [filteredSales]);

  const cardSalesGross = useMemo(() => {
    return filteredSales
      .filter((s) => s.payment_method === 'Card')
      .reduce((sum, s) => sum + s.gross_amount, 0);
  }, [filteredSales]);

  const b2bSalesGross = useMemo(() => {
    return filteredSales
      .filter((s) => s.payment_method === 'B2B' || s.payment_method === 'Car B2B' || s.sale_type === 'B2B')
      .reduce((sum, s) => sum + s.gross_amount, 0);
  }, [filteredSales]);

  const totalOwnerCapital = useMemo(() => {
    return filteredCapital.reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCapital]);

  const b2bPaymentsCash = useMemo(() => {
    return filteredB2BPayments
      .filter((p) => p.payment_method === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredB2BPayments]);

  const b2bPaymentsBank = useMemo(() => {
    return filteredB2BPayments
      .filter((p) => p.payment_method !== 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredB2BPayments]);

  // Rule: All commissions (including on Card sales & B2B sales) are disbursed out of physical Cash in hand
  const commissionsPaidCash = totalSalesCommission;

  const expensesFromCash = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.expense_source === 'Daily Sales Cash' || e.expense_source === 'Petty Cash Box')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const expensesFromBank = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.expense_source !== 'Daily Sales Cash' && e.expense_source !== 'Petty Cash Box')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Physical Cash Inflow
  const totalPhysicalCashIn = cashSalesGross + b2bPaymentsCash + totalOwnerCapital;

  // Physical Cash Outflow (Commissions paid in cash from drawer + Cash expenses)
  const totalPhysicalCashOut = commissionsPaidCash + expensesFromCash;

  // NET PHYSICAL CASH IN HAND (Drawer Balance)
  const netCashPosition = totalPhysicalCashIn - totalPhysicalCashOut;

  // Card / Bank settlements
  const netCardBankPosition = (cardSalesGross + b2bPaymentsBank) - expensesFromBank;

  // Consolidated business net
  const consolidatedNetOperating = totalSalesNet + totalOwnerCapital - totalExpenses;

  const salesByPaymentMethod = useMemo(() => {
    const map: Record<string, number> = {
      'Cash': 0,
      'Card': 0,
      'B2B': 0
    };
    filteredSales.forEach((s) => {
      const methodKey = s.payment_method === 'Car B2B' ? 'B2B' : s.payment_method;
      map[methodKey] = (map[methodKey] || 0) + s.net_amount;
    });
    return map;
  }, [filteredSales]);

  // 3. EXPENSES REPORT: BY CATEGORY & BY CASH SOURCE
  const standardCategories = [
    'Fuel & Maintenance',
    'Staff Salaries',
    'Rent',
    'Utilities',
    'Food & Beverages Stock',
    'Quad/Buggy Parts',
    'Marketing',
    'Stall Rental Expenses',
    'Miscellaneous'
  ];

  const standardCashSources = [
    'Daily Sales Cash',
    'Owner Capital',
    'Bank Account',
    'Petty Cash Box',
    'Card Terminal'
  ];

  const PIE_COLORS = [
    '#FF6B35', // Primary Orange
    '#2563EB', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#64748B', // Slate
    '#EF4444', // Red
    '#D97706'  // Dark Amber
  ];

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    standardCategories.forEach((c) => { map[c] = 0; });
    filteredExpenses.forEach((e) => {
      map[e.expense_category] = (map[e.expense_category] || 0) + e.amount;
    });
    return map;
  }, [filteredExpenses]);

  const expensePieData = useMemo(() => {
    return Object.entries(expensesByCategory)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expensesByCategory]);

  const expensesBySource = useMemo(() => {
    const map: Record<string, number> = {};
    standardCashSources.forEach((s) => { map[s] = 0; });
    filteredExpenses.forEach((e) => {
      // Normalize source names if slightly different
      let key = e.expense_source;
      if (key === 'Bank Account (Company)') key = 'Bank Account';
      if (key === 'Petty Cash Safe') key = 'Petty Cash Box';
      map[key] = (map[key] || 0) + e.amount;
    });
    return map;
  }, [filteredExpenses]);

  // 4. COUNTER-WISE SALES REPORT
  const standardCounters = [
    'DXA Sale Counter',
    'Photo Sale',
    'Juice Counter Sale',
    'Supermarket Sale',
    'Popcorn'
  ];

  const counterPerformance = useMemo(() => {
    const map: Record<string, { count: number; gross: number; commission: number; net: number }> = {};
    standardCounters.forEach((c) => {
      map[c] = { count: 0, gross: 0, commission: 0, net: 0 };
    });

    filteredSales.forEach((s) => {
      // Map existing names to standard if needed
      let cName = s.sale_counter;
      if (cName === 'Quad Buggy Rental Counter') cName = 'DXA Sale Counter';
      if (cName === 'Beverage & Shisha Counter') cName = 'Juice Counter Sale';
      if (cName === 'Camp Activities Counter') cName = 'Supermarket Sale';

      if (!map[cName]) {
        map[cName] = { count: 0, gross: 0, commission: 0, net: 0 };
      }
      map[cName].count += 1;
      map[cName].gross += s.gross_amount;
      map[cName].commission += s.commission_amount;
      map[cName].net += s.net_amount;
    });

    const totalNetAll = Object.values(map).reduce((sum, c) => sum + c.net, 0);

    return Object.entries(map).map(([counter, data]) => ({
      counter,
      count: data.count,
      gross: data.gross,
      commission: data.commission,
      net: data.net,
      pctOfTotal: totalNetAll > 0 ? (data.net / totalNetAll) * 100 : 0
    }));
  }, [filteredSales]);

  // Top Performing Counter
  const topCounter = useMemo(() => {
    if (counterPerformance.length === 0) return null;
    const sorted = [...counterPerformance].sort((a, b) => b.net - a.net);
    return sorted[0];
  }, [counterPerformance]);

  // Daily Breakdown for DXA Counter (or top counter)
  const dxaDailyBreakdown = useMemo(() => {
    const targetCounter = topCounter?.counter || 'DXA Sale Counter';
    const dxaSales = filteredSales.filter((s) => {
      let cName = s.sale_counter;
      if (cName === 'Quad Buggy Rental Counter') cName = 'DXA Sale Counter';
      return cName === targetCounter;
    });

    const dateMap: Record<string, { count: number; gross: number; net: number }> = {};
    dxaSales.forEach((s) => {
      if (!dateMap[s.sale_date]) {
        dateMap[s.sale_date] = { count: 0, gross: 0, net: 0 };
      }
      dateMap[s.sale_date].count += 1;
      dateMap[s.sale_date].gross += s.gross_amount;
      dateMap[s.sale_date].net += s.net_amount;
    });

    return Object.entries(dateMap).map(([date, data]) => ({
      date,
      count: data.count,
      gross: data.gross,
      net: data.net
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, topCounter]);

  // Print & PDF
  const handlePrint = () => {
    window.print();
  };

  const handlePDF = () => {
    if (activeTab === 'cashflow') {
      exportCashFlowPdf(
        appliedFromDate,
        appliedToDate,
        totalSalesNet,
        totalOwnerCapital,
        totalPhysicalCashIn,
        totalExpenses,
        netCashPosition,
        expensesByCategory,
        expensesBySource
      );
    } else if (activeTab === 'sales') {
      exportSalesPdf(
        appliedFromDate,
        appliedToDate,
        filteredSales,
        totalSalesGross,
        totalSalesCommission,
        totalSalesNet,
        salesByPaymentMethod
      );
    } else if (activeTab === 'expenses') {
      exportExpensesPdf(
        appliedFromDate,
        appliedToDate,
        filteredExpenses,
        totalExpenses,
        expensesByCategory,
        expensesBySource
      );
    } else if (activeTab === 'counters') {
      exportCounterSalesPdf(
        appliedFromDate,
        appliedToDate,
        counterPerformance,
        topCounter
      );
    } else {
      window.print();
    }
  };

  // Excel Exports
  const handleExportExcel = () => {
    if (activeTab === 'cashflow') {
      exportCashFlowReportToExcel(
        appliedFromDate,
        appliedToDate,
        totalSalesNet,
        totalOwnerCapital,
        totalPhysicalCashIn,
        totalExpenses,
        netCashPosition,
        filteredSales,
        filteredCapital,
        filteredExpenses
      );
    } else if (activeTab === 'sales') {
      exportSalesReportToExcel(appliedFromDate, appliedToDate, filteredSales);
    } else if (activeTab === 'expenses') {
      exportExpensesReportToExcel(appliedFromDate, appliedToDate, filteredExpenses);
    } else if (activeTab === 'counters') {
      exportCounterSalesReportToExcel(appliedFromDate, appliedToDate, counterPerformance);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#2D3142] via-stone-900 to-[#2D3142] text-white p-5 rounded-2xl border border-stone-700 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#FF6B35] text-white px-2.5 py-0.5 rounded-full shadow-xs">
              STEP 3: REPORTING MODULE
            </span>
            <span className="text-xs text-amber-200 font-medium">Desert Xtreme Adventure</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#FF6B35]" />
            <span>Financial & Operational Audits</span>
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Audit consolidated cash flows, date-wise sales, source-wise operational expenses, and counter performance in real time.
          </p>
        </div>

        {/* Global Action Controls: [Export to Excel] [Print] [PDF] */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Export full report to Excel workbook"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs font-bold transition-all border border-stone-600 shadow-sm cursor-pointer active:scale-95"
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handlePDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Save as PDF via Print dialog"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs: B2B, B2C, Cash Flow, and Operational Reports */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('b2b-sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'b2b-sales'
              ? 'bg-gradient-to-r from-orange-600 to-[#FF6B35] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-orange-50 border border-stone-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>B2B Sales Report</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            activeTab === 'b2b-sales' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#FF6B35]'
          }`}>
            MAIN
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('b2b-ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'b2b-ledger'
              ? 'bg-gradient-to-r from-[#FF6B35] to-amber-600 text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>B2B Customer Ledger</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            activeTab === 'b2b-ledger' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
          }`}>
            STATEMENT
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('b2c-sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'b2c-sales'
              ? 'bg-stone-900 text-white shadow-md ring-2 ring-emerald-500/50'
              : 'bg-white text-stone-700 hover:bg-emerald-50 border border-stone-200'
          }`}
        >
          <Store className="w-4 h-4 text-emerald-400" />
          <span>B2C Sales Report</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            activeTab === 'b2c-sales' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-900'
          }`}>
            RETAIL
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cashflow'
              ? 'bg-[#FF6B35] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Report 1: Cash Flow</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sales'
              ? 'bg-[#FF6B35] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>All Sales (Date-wise)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-[#FF6B35] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Report 3: Expense Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('counters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'counters'
              ? 'bg-[#FF6B35] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Report 4: Counter-wise Sales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reconciliation'
              ? 'bg-[#2D3142] text-white shadow-md'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Safe Drawer Audit</span>
        </button>
      </div>

      {/* 3. Universal Date Range Selector Bar matching requested ASCII schema:
          ┌─────────────────────────────────────────────────────────────┐
          │ 📊 / 📈 / 💸 / 🛒 Report Title                              │
          │ Date Range: [From] ───── [To] [Generate]                    │
          └─────────────────────────────────────────────────────────────┘
      */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">
                {activeTab === 'b2b-sales' && '🏢'}
                {activeTab === 'b2b-ledger' && '📑'}
                {activeTab === 'b2c-sales' && '🛍️'}
                {activeTab === 'cashflow' && '📊'}
                {activeTab === 'sales' && '📈'}
                {activeTab === 'expenses' && '💸'}
                {activeTab === 'counters' && '🛒'}
                {activeTab === 'reconciliation' && '⚖️'}
              </span>
              <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                {activeTab === 'b2b-sales' && 'B2B Sales & Agency Report'}
                {activeTab === 'b2b-ledger' && 'B2B Customer Ledger & Statement'}
                {activeTab === 'b2c-sales' && 'B2C Retail & Walk-in Sales Report'}
                {activeTab === 'cashflow' && 'Cash Flow Report'}
                {activeTab === 'sales' && 'Total Sales Report'}
                {activeTab === 'expenses' && 'Expense Report'}
                {activeTab === 'counters' && 'Counter-wise Sales Report'}
                {activeTab === 'reconciliation' && 'Safe Drawer Cash Audit'}
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Select date range to filter transactions and compute balances:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Presets */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-[11px] font-semibold text-stone-600">
              <button
                type="button"
                onClick={() => handleQuickPreset('today')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  fromDate === todayStr && toDate === todayStr ? 'bg-white shadow-xs text-stone-900 font-bold' : 'hover:text-stone-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('yesterday')}
                className="px-2 py-1 rounded hover:text-stone-900 cursor-pointer"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('thisWeek')}
                className="px-2 py-1 rounded hover:text-stone-900 cursor-pointer"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('thisMonth')}
                className="px-2 py-1 rounded hover:text-stone-900 cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('all')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  !fromDate && !toDate ? 'bg-white shadow-xs text-stone-900 font-bold' : 'hover:text-stone-900'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Date Range Inputs: [From] ───── [To] [Generate] */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <div className="flex items-center gap-1 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[#FF6B35]">
                <span className="text-[10px] text-stone-400 uppercase font-bold">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-stone-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
                />
              </div>

              <span className="text-stone-400 font-mono">─────</span>

              <div className="flex items-center gap-1 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[#FF6B35]">
                <span className="text-[10px] text-stone-400 uppercase font-bold">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-stone-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                className="px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#E85D04] text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <span>Generate</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Range Information Bar */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-3">
            <div>
              Active Range: <span className="font-bold text-stone-800">{appliedFromDate || 'Beginning'}</span> to{' '}
              <span className="font-bold text-stone-800">{appliedToDate || 'Present'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span>Sales: <strong className="text-stone-800 font-mono">{filteredSales.length}</strong></span>
            <span>Expenses: <strong className="text-stone-800 font-mono">{filteredExpenses.length}</strong></span>
            <span>Owner Capital: <strong className="text-stone-800 font-mono">{filteredCapital.length}</strong></span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          EXECUTIVE FINANCIAL SUMMARY BANNER (CASH, CARD, COMMISSION & NET)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-stone-700/80 my-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3.5 border-b border-stone-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/20 border border-[#FF6B35]/40 text-[#FF6B35] flex items-center justify-center font-bold text-sm shrink-0">
              💰
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <span>FINANCIAL OVERVIEW & RECONCILIATION</span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Cash Sales, Card Sales, Commissions, Net Drawer Cash & Bank Positions ({appliedFromDate || 'Beginning'} ➔ {appliedToDate || 'Present'})
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-2.5 py-1 rounded-lg border border-stone-700 self-start sm:self-auto font-semibold">
            {filteredSales.length} Sales • {filteredExpenses.length} Exp
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Cash Sales */}
          <div className="bg-stone-800/90 border border-stone-700 rounded-xl p-3 shadow-inner">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash Sales</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-300">
              {formatAED(cashSalesGross)} <span className="text-[10px] font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5 truncate">
              +{formatAED(b2bPaymentsCash)} B2B Cash
            </div>
          </div>

          {/* 2. Card Sales */}
          <div className="bg-stone-800/90 border border-stone-700 rounded-xl p-3 shadow-inner">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card Sales</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-blue-300">
              {formatAED(cardSalesGross)} <span className="text-[10px] font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5 truncate">
              Terminal Transactions
            </div>
          </div>

          {/* 3. Total Commissions */}
          <div className="bg-stone-800/90 border border-stone-700 rounded-xl p-3 shadow-inner">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Commissions</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-purple-300">
              {formatAED(commissionsPaidCash)} <span className="text-[10px] font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5 truncate">
              Paid out of Cash
            </div>
          </div>

          {/* 4. Net Cash in Hand */}
          <div className={`border rounded-xl p-3 shadow-inner ${
            netCashPosition >= 0 ? 'bg-emerald-950/60 border-emerald-500/60' : 'bg-rose-950/60 border-rose-500/60'
          }`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1 ${
              netCashPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <Wallet className="w-3.5 h-3.5" />
              <span>Cash in Hand</span>
            </div>
            <div className={`text-base sm:text-lg font-black font-mono ${
              netCashPosition >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {formatAED(netCashPosition)} <span className="text-[10px] font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[10px] text-stone-300 mt-0.5 truncate font-semibold">
              Safe Drawer Balance
            </div>
          </div>

          {/* 5. Net at Bank / Terminal */}
          <div className="bg-stone-800/90 border border-stone-700 rounded-xl p-3 shadow-inner">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>Net at Bank</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-cyan-300">
              {formatAED(netCardBankPosition)} <span className="text-[10px] font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5 truncate">
              Card - Bank Exp
            </div>
          </div>

          {/* 6. Total Operating Net */}
          <div className="bg-amber-950/40 border border-amber-500/60 rounded-xl p-3 shadow-inner">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Operating Net</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-300">
              {formatAED(consolidatedNetOperating)} <span className="text-[10px] font-normal text-stone-400">AED</span>
            </div>
            <div className="text-[10px] text-stone-300 mt-0.5 truncate font-semibold">
              Consolidated Net
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          B2B SALES REPORT (MAIN SALES CHANNEL 1)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'b2b-sales' && (
        <B2BSalesReport 
          sales={filteredSales} 
          b2bPayments={filteredB2BPayments}
          fromDate={appliedFromDate} 
          toDate={appliedToDate} 
          onReceivePayment={onReceiveB2BPayment}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          B2B CUSTOMER LEDGER & STATEMENT OF ACCOUNT
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'b2b-ledger' && (
        <B2BCustomerLedger 
          sales={filteredSales} 
          b2bPayments={filteredB2BPayments}
          fromDate={appliedFromDate} 
          toDate={appliedToDate} 
          onReceivePayment={onReceiveB2BPayment}
          onRefresh={onRefreshData}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          B2C SALES REPORT (MAIN SALES CHANNEL 2)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'b2c-sales' && (
        <B2CSalesReport 
          sales={filteredSales} 
          fromDate={appliedFromDate} 
          toDate={appliedToDate} 
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          REPORT 1: CASH FLOW REPORT
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-stone-800 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
                  <span>Statement of Cash Flow (Summary)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Calculated for {appliedFromDate || 'Start'} to {appliedToDate || 'Present'}
                </p>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                netCashPosition >= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                <span>{netCashPosition >= 0 ? 'Surplus / Positive Net Cash ✅' : 'Deficit / Attention Required ⚠️'}</span>
              </div>
            </div>

            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              {/* SECTION 1: PHYSICAL CASH INFLOW (DRAWER & HAND) */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    <span>1. PHYSICAL CASH INFLOW (DRAWER & SAFE):</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                    Cash Handed to Cashier
                  </span>
                </div>
                <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-stone-100">
                      <tr className="hover:bg-emerald-50/20">
                        <td className="px-5 py-3 font-medium text-stone-700">Direct Customer Cash Sales (Gross)</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-stone-900">
                          {formatAED(cashSalesGross)}
                        </td>
                      </tr>
                      <tr className="hover:bg-emerald-50/20">
                        <td className="px-5 py-3 font-medium text-stone-700">B2B Voucher Cash Settlements Received</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-stone-900">
                          {formatAED(b2bPaymentsCash)}
                        </td>
                      </tr>
                      <tr className="hover:bg-emerald-50/20">
                        <td className="px-5 py-3 font-medium text-stone-700">Owner Capital Injections (Cash Float)</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700">
                          {formatAED(totalOwnerCapital)}
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/60 font-black text-xs border-t-2 border-emerald-200">
                        <td className="px-5 py-3 text-emerald-950 uppercase tracking-wider">TOTAL PHYSICAL CASH IN</td>
                        <td className="px-5 py-3 text-right font-mono text-emerald-800 text-sm">
                          {formatAED(totalPhysicalCashIn)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: PHYSICAL CASH OUTFLOW (PAID FROM CASH DRAWER) */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-rose-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    <span>2. PHYSICAL CASH OUTFLOW (DISBURSED FROM CASH IN HAND):</span>
                  </span>
                  <span className="text-[10px] text-rose-700 bg-rose-100 font-bold px-2 py-0.5 rounded">
                    Cash Paid Out
                  </span>
                </div>
                <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-stone-100">
                      <tr className="hover:bg-rose-50/20">
                        <td className="px-5 py-3 font-medium text-stone-700">
                          <div>Guide & Driver Commissions Paid in Cash</div>
                          <div className="text-[10px] text-amber-700 font-normal">
                            *Includes commissions on Card & B2B sales paid out of cash in hand
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-amber-700">
                          {formatAED(commissionsPaidCash)}
                        </td>
                      </tr>
                      <tr className="hover:bg-rose-50/20">
                        <td className="px-5 py-3 font-medium text-stone-700">
                          Daily Drawer & Petty Cash Expenses
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-rose-700">
                          {formatAED(expensesFromCash)}
                        </td>
                      </tr>
                      <tr className="bg-rose-50/60 font-black text-xs border-t-2 border-rose-200">
                        <td className="px-5 py-3 text-rose-950 uppercase tracking-wider">TOTAL PHYSICAL CASH OUT</td>
                        <td className="px-5 py-3 text-right font-mono text-rose-800 text-sm font-black">
                          {formatAED(totalPhysicalCashOut)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: NET PHYSICAL CASH IN HAND */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-stone-800 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>3. NET CASH IN HAND (SAFE DRAWER BALANCE):</span>
                  </span>
                  <span className="text-[10px] text-stone-600 font-mono font-bold">
                    Physical Drawer Position
                  </span>
                </div>
                <div className={`border-2 rounded-xl overflow-hidden shadow-sm ${
                  netCashPosition >= 0 ? 'border-emerald-300 bg-emerald-50/40' : 'border-rose-300 bg-rose-50/40'
                }`}>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="font-black text-sm">
                        <td className="px-5 py-4 text-stone-900">
                          <div>Physical Cash In - Cash Out</div>
                          <div className="text-[10px] font-normal text-stone-500 font-sans mt-0.5">
                            ({formatAED(cashSalesGross)} Cash Sales - {formatAED(commissionsPaidCash)} Commissions Paid - {formatAED(expensesFromCash)} Expenses)
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-base">
                          <span className={netCashPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {formatAED(netCashPosition)} AED {netCashPosition >= 0 ? '✅' : '⚠️'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4: CARD / DIGITAL SETTLEMENTS & CONSOLIDATED TOTAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Card & Digital Settlements (Bank)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Terminal</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Card Sales (Terminal Gross):</span>
                    <span className="font-mono font-bold text-stone-900">+{formatAED(cardSalesGross)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>B2B Bank Settlements:</span>
                    <span className="font-mono font-bold text-stone-900">+{formatAED(b2bPaymentsBank)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Bank / Digital Expenses:</span>
                    <span className="font-mono font-bold text-rose-600">-{formatAED(expensesFromBank)}</span>
                  </div>
                  <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-blue-950">
                    <span>Net Card / Bank Position:</span>
                    <span className="font-mono text-blue-800">{formatAED(netCardBankPosition)} AED</span>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Consolidated Operating Cash Flow</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">All Channels</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Net Physical Cash in Hand:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatAED(netCashPosition)} AED</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Net Card & Bank Terminal:</span>
                    <span className="font-mono font-bold text-blue-700">{formatAED(netCardBankPosition)} AED</span>
                  </div>
                  <div className="border-t border-amber-200 pt-2 flex justify-between font-black text-stone-900">
                    <span>Total Realized Operating Income:</span>
                    <span className="font-mono text-amber-900 text-sm">
                      {formatAED(consolidatedNetOperating)} AED
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar Below Table: [Export to Excel] [Print] [PDF] */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
                <span className="text-[11px] text-stone-500">
                  Formula: Net Cash in Hand = (Cash Sales + B2B Cash + Owner Capital) - (All Commissions Paid in Cash + Cash Expenses)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Export to Excel
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={handlePDF}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          REPORT 2: TOTAL SALES REPORT (Date-wise)
          Exact ASCII specification:
          ┌──────────┬──────────────┬────────┬────────┬────────┬────────┐
          │ Date     │ Counter      │ Method │ Gross  │ Comm.  │ Net    │
          └──────────┴──────────────┴────────┴────────┴────────┴────────┘
          SUMMARY:
          Total Sales (Gross): 1,950 AED
          Total Commission: 80 AED
          Total Sales (Net): 1,870 AED

          Breakdown by Payment Method:
          Cash: 700 AED
          Card: 1,000 AED
          B2B: 250 AED

          [Export to Excel] [Print] [PDF]
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#FF6B35]" />
                  <span>Total Sales Report (Date-wise)</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  {filteredSales.length} transactions in date scope
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-stone-800 bg-white px-3 py-1 rounded-lg border border-stone-200 shadow-2xs">
                Net Sales: {formatAED(totalSalesNet)}
              </span>
            </div>

            {/* Sales Table: Date | Counter | Method | Gross | Comm. | Net */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100 text-stone-700 uppercase text-[10px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Counter</th>
                    <th className="px-4 py-3">Vehicle & Track</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Comm.</th>
                    <th className="px-4 py-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {filteredSales.length > 0 ? (
                    filteredSales.map((s) => {
                      const isOutside = s.ride_location === 'Outside' || (s.vehicle_name && s.vehicle_name.includes('Outside'));
                      const isInside = s.ride_location === 'Inside' || (s.vehicle_name && s.vehicle_name.includes('Inside'));
                      return (
                        <tr key={s.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-2.5 font-mono font-bold text-stone-800 whitespace-nowrap">
                            {formatDisplayDate(s.sale_date)}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-stone-900 whitespace-nowrap">
                            {s.sale_counter}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {s.vehicle_name ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-800">{s.vehicle_name}</span>
                                {(s.ride_location || isOutside || isInside) && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                    isOutside
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                  }`}>
                                    {isOutside ? 'Outside' : 'Inside'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              s.payment_method === 'Cash'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : s.payment_method === 'Card'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {s.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium text-stone-700">
                            {formatAED(s.gross_amount)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-purple-700">
                            {s.commission_amount > 0 ? formatAED(s.commission_amount) : '0'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-black text-emerald-700">
                            {formatAED(s.net_amount)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-stone-400">
                        No sales found for the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SUMMARY & BREAKDOWN SECTION */}
            <div className="p-6 bg-stone-50/60 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SUMMARY: */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-stone-800 mb-2">
                  SUMMARY:
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-stone-100">
                  <span className="text-stone-600 font-medium">Total Sales (Gross):</span>
                  <span className="font-mono font-bold text-stone-900">{formatAED(totalSalesGross)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-stone-100">
                  <span className="text-stone-600 font-medium">Total Commission:</span>
                  <span className="font-mono font-bold text-purple-700">{formatAED(totalSalesCommission)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 font-black text-emerald-800 bg-emerald-50/70 p-2 rounded-lg">
                  <span>Total Sales (Net):</span>
                  <span className="font-mono text-sm">{formatAED(totalSalesNet)}</span>
                </div>
              </div>

              {/* Breakdown by Payment Method: */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-stone-800 mb-2">
                  Breakdown by Payment Method:
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-stone-100">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash:</span>
                  </span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatAED(salesByPaymentMethod['Cash'] || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-stone-100">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Card:</span>
                  </span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatAED(salesByPaymentMethod['Card'] || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>Include / Credit / B2B:</span>
                  </span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatAED(
                      (salesByPaymentMethod['Include'] || 0) +
                      (salesByPaymentMethod['Credit'] || 0) +
                      (salesByPaymentMethod['B2B'] || 0) +
                      (salesByPaymentMethod['Car B2B'] || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Toolbar Below Table: [Export to Excel] [Print] [PDF] */}
            <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400">
                Shows all transactions with gross, agency deductions, and net amounts.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Export to Excel
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={handlePDF}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          REPORT 3: EXPENSE REPORT (Date-wise + Source-wise + Recharts Pie Chart)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* RECHARTS PIE CHART: HIGHEST SPENDING AREAS */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between mb-4 pb-2 border-b border-stone-100 gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-[#FF6B35]" />
                  <span>Expenses by Category (Highest Spending Areas)</span>
                </h3>
                <p className="text-[11px] text-stone-500">Visual distribution of company expenditure across categories</p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                Total Expenses: {formatAED(totalExpenses)} AED
              </span>
            </div>

            {expensePieData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Interactive Recharts Pie Chart */}
                <div className="lg:col-span-7 h-[290px] w-full relative flex items-center justify-center bg-stone-50/50 rounded-xl p-2 border border-stone-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        animationDuration={800}
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${formatAED(Number(value))} AED`, 'Expenditure']}
                        contentStyle={{ backgroundColor: '#1C1917', borderRadius: '12px', borderColor: '#44403C', color: '#FAFAF9', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                        itemStyle={{ color: '#FF6B35', fontWeight: 'bold' }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Ranked Spending breakdown list */}
                <div className="lg:col-span-5 space-y-2 max-h-[290px] overflow-y-auto pr-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center justify-between">
                    <span>Ranked Categories</span>
                    <span>% of Total</span>
                  </div>
                  {expensePieData.map((item, idx) => {
                    const pct = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : '0';
                    const color = PIE_COLORS[idx % PIE_COLORS.length];
                    return (
                      <div key={item.name} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-stone-300 transition-all space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate max-w-[150px]">{item.name}</span>
                          </span>
                          <span className="font-mono font-bold text-stone-900">{formatAED(item.value)} AED</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-stone-500 shrink-0">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-stone-400 text-xs">
                No expense records found for the selected date range to plot chart.
              </div>
            )}
          </div>

          {/* Top Two Summary Tables side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BY CATEGORY: */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-stone-50 px-5 py-3.5 border-b border-stone-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800">
                  BY CATEGORY:
                </h3>
              </div>
              <div className="p-0">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-stone-100">
                    {standardCategories.map((cat) => (
                      <tr key={cat} className="hover:bg-stone-50">
                        <td className="px-5 py-2.5 font-medium text-stone-700">{cat}</td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-stone-900">
                          {formatAED(expensesByCategory[cat] || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-rose-50/60 font-black text-xs border-t-2 border-rose-200">
                      <td className="px-5 py-3 text-rose-950 uppercase tracking-wider">TOTAL EXPENSES</td>
                      <td className="px-5 py-3 text-right font-mono text-rose-700 text-sm">
                        {formatAED(totalExpenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BY CASH SOURCE: */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-stone-50 px-5 py-3.5 border-b border-stone-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800">
                  BY CASH SOURCE:
                </h3>
              </div>
              <div className="p-0">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-stone-100">
                    {standardCashSources.map((src) => (
                      <tr key={src} className="hover:bg-stone-50">
                        <td className="px-5 py-2.5 font-medium text-stone-700">{src}</td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-stone-900">
                          {formatAED(expensesBySource[src] || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-stone-100 font-black text-xs border-t-2 border-stone-300">
                      <td className="px-5 py-3 text-stone-900 uppercase tracking-wider">TOTAL</td>
                      <td className="px-5 py-3 text-right font-mono text-stone-900 text-sm">
                        {formatAED(totalExpenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DETAILED TRANSACTIONS: */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-stone-50 px-5 py-3.5 border-b border-stone-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-800">
                DETAILED TRANSACTIONS:
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100 text-stone-700 uppercase text-[10px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Spent From</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Paid To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-stone-800 whitespace-nowrap">
                          {formatDisplayDate(e.expense_date)}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-stone-900 whitespace-nowrap">
                          {e.expense_category}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            e.expense_source === 'Daily Sales Cash'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-stone-100 text-stone-800 border border-stone-200'
                          }`}>
                            {e.expense_source}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-rose-600">
                          {formatAED(e.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-stone-700 font-medium">
                          {e.paid_to || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-stone-400">
                        No expenses found for the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Toolbar Below Table: [Export to Excel] [Print] [PDF] */}
            <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400">
                Audited against 9 categories and 5 cash disbursement accounts.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Export to Excel
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={handlePDF}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          REPORT 4: COUNTER-WISE SALES (Date-wise)
          Exact ASCII specification:
          ┌────────────────────┬───────────┬─────────────┬────────────┐
          │ Counter            │ Trans.    │ Gross Sales │ Net Sales  │
          ├────────────────────┼───────────┼─────────────┼────────────┤
          │ DXA Sale Counter   │ 45        │ 12,000      │ 11,500     │
          │ Photo Sale         │ 23        │ 4,500       │ 4,500      │
          │ Juice Counter Sale │ 67        │ 3,200       │ 3,200      │
          │ Supermarket Sale   │ 34        │ 8,900       │ 8,900      │
          │ Popcorn            │ 12        │ 1,800       │ 1,700      │
          ├────────────────────┼───────────┼─────────────┼────────────┤
          │ TOTAL              │ 181       │ 30,400      │ 29,800     │
          └────────────────────┴───────────┴─────────────┴────────────┘

          TOP PERFORMING COUNTER: DXA Sale Counter (38% of sales)

          DAILY BREAKDOWN (DXA Counter):
          ┌──────────┬────────────┬────────────┬────────────┐
          │ Date     │ Trans.     │ Gross      │ Net        │
          └──────────┴────────────┴────────────┴────────────┘

          [Export to Excel] [Print] [PDF]
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'counters' && (
        <div className="space-y-6">
          {/* Main Counter Performance Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#FF6B35]" />
                  <span>Counter-wise Sales Report</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Performance across all 5 revenue counters
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-stone-800 bg-white px-3 py-1 rounded-lg border border-stone-200 shadow-2xs">
                Total Net Sales: {formatAED(totalSalesNet)}
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-100 text-stone-700 uppercase text-[10px] font-bold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Counter</th>
                  <th className="px-4 py-3 text-center">Trans.</th>
                  <th className="px-4 py-3 text-right">Gross Sales</th>
                  <th className="px-4 py-3 text-right">Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {counterPerformance.map((c) => (
                  <tr key={c.counter} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-stone-900 flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-stone-400" />
                      <span>{c.counter}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-stone-700">
                      {c.count}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-stone-800 font-medium">
                      {formatAED(c.gross)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700">
                      {formatAED(c.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-100/90 border-t-2 border-stone-300 font-black">
                <tr>
                  <td className="px-4 py-3 uppercase text-stone-900">TOTAL</td>
                  <td className="px-4 py-3 text-center font-mono text-stone-900 text-sm">
                    {counterPerformance.reduce((sum, c) => sum + c.count, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-stone-900 text-sm">
                    {formatAED(counterPerformance.reduce((sum, c) => sum + c.gross, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-800 text-sm">
                    {formatAED(counterPerformance.reduce((sum, c) => sum + c.net, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* TOP PERFORMING COUNTER BADGE */}
          {topCounter && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                    TOP PERFORMING COUNTER:
                  </div>
                  <div className="text-sm font-bold text-stone-900">
                    {topCounter.counter} <span className="text-amber-700 font-mono">({topCounter.pctOfTotal.toFixed(0)}% of sales)</span>
                  </div>
                </div>
              </div>
              <div className="font-mono font-black text-stone-800 text-sm">
                {formatAED(topCounter.net)} Net
              </div>
            </div>
          )}

          {/* DAILY BREAKDOWN (DXA Counter) */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                DAILY BREAKDOWN ({topCounter?.counter || 'DXA Counter'}):
              </h3>
              <span className="text-[11px] text-stone-500">
                Daily historical trajectory
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-100 text-stone-700 uppercase text-[10px] font-bold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Trans.</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {dxaDailyBreakdown.length > 0 ? (
                  dxaDailyBreakdown.map((row) => (
                    <tr key={row.date} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-stone-800">
                        {formatDisplayDate(row.date)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-semibold text-stone-700">
                        {row.count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-stone-800">
                        {formatAED(row.gross)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                        {formatAED(row.net)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-stone-400">
                      No daily records found for this counter in the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Action Toolbar Below Table: [Export to Excel] [Print] [PDF] */}
            <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400">
                Counter audit analytics and daily distributions.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Export to Excel
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={handlePDF}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: SAFE DRAWER RECONCILIATION SHEET
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-3 gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Safe Drawer Physical Cash Reconciliation
              </h3>
              <p className="text-xs text-stone-500">
                Formula: Opening Float (500 AED) + Cash Sales - Drawer Expenses + Owner Capital
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenReconciliation}
              className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors shadow-2xs"
            >
              Open Interactive Calculator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs">
              <div className="font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>Cash Inflows (Physical Cash Only)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Base Safe Float:</span>
                <span className="font-mono font-bold text-stone-800">500.00 AED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Cash Sales (Customer Payments):</span>
                <span className="font-mono font-bold text-emerald-700">+{formatAED(cashFlow.cashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Owner Capital (Drawer Deposits):</span>
                <span className="font-mono font-bold text-emerald-700">+{formatAED(cashFlow.totalOwnerCapital)}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-bold">
                <span>Total Cash Available:</span>
                <span className="font-mono text-emerald-800">
                  {formatAED(500 + cashFlow.cashSales + cashFlow.totalOwnerCapital)}
                </span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs">
              <div className="font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Cash Outflows & Expected Cash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Disbursed from Safe Drawer:</span>
                <span className="font-mono font-bold text-rose-600">-{formatAED(cashFlow.expensesFromCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Bank / Card Payments (Non-Drawer):</span>
                <span className="font-mono text-stone-500">
                  {formatAED(cashFlow.expensesFromOther)}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-black text-sm bg-emerald-100/60 p-2 rounded-lg text-emerald-950">
                <span>Target Drawer Cash:</span>
                <span className="font-mono">{formatAED(cashFlow.estimatedCashInDrawer)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
