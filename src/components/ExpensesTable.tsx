import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Tag, 
  Wallet, 
  AlertCircle,
  TrendingDown,
  Building2,
  Calendar,
  Hash,
  ArrowDownRight
} from 'lucide-react';
import { ExpenseCategory, CashSource, ExpenseRecord } from '../types';
import { formatAED } from '../lib/utils';

interface ExpensesTableProps {
  expenses: ExpenseRecord[];
  categories: ExpenseCategory[];
  cashSources: CashSource[];
  dateFilter: string;
  onDateFilterChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedSource: string;
  onSourceChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onEditExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: number) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  onNewExpenseClick: () => void;
  onOpenCapitalModal: () => void;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  categories,
  cashSources,
  dateFilter,
  onDateFilterChange,
  selectedCategory,
  onCategoryChange,
  selectedSource,
  onSourceChange,
  searchQuery,
  onSearchChange,
  onEditExpense,
  onDeleteExpense,
  onExportExcel,
  onExportCsv,
  onRefresh,
  onNewExpenseClick,
  onOpenCapitalModal
}) => {
  // Calculations for current filtered list
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
  const cashDrawerAmount = expenses
    .filter((e) => e.expense_source === 'Daily Sales Cash')
    .reduce((sum, item) => sum + item.amount, 0);
  const pettyCashAmount = expenses
    .filter((e) => e.expense_source === 'Petty Cash Box')
    .reduce((sum, item) => sum + item.amount, 0);
  const otherSourcesAmount = totalAmount - cashDrawerAmount - pettyCashAmount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200/90 overflow-hidden">
      {/* Table Top Controls & Filters */}
      <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Title & Live Counts */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#2D3142] flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Expense Outflows Ledger</span>
              </h3>
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                {expenses.length} Records
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Real-time query from local SQLite <code className="text-stone-700 font-mono">expenses</code> table
            </p>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={onNewExpenseClick}
              className="flex items-center gap-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Record New Expense (F2)"
            >
              <span>+ Record Expense</span>
            </button>

            <button
              onClick={onOpenCapitalModal}
              className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Record Owner Capital Inflow"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Owner Capital</span>
            </button>

            <button
              onClick={onRefresh}
              className="flex items-center gap-1 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Refresh from SQLite Database (F5)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Refresh (F5)</span>
            </button>

            <div className="flex items-center gap-1.5 pl-2 border-l border-stone-300">
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                title="Export Today's Expenses to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={onExportCsv}
                className="flex items-center gap-1 text-[11px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-stone-200/80">
          {/* 1. Date Range Filter */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="w-full bg-transparent focus:outline-hidden font-medium text-stone-700 cursor-pointer"
            >
              <option value="today">Today's Expenses</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="all">All Dates</option>
            </select>
          </div>

          {/* 2. Category Filter */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs">
            <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full bg-transparent focus:outline-hidden font-medium text-stone-700 cursor-pointer"
            >
              <option value="ALL">All Expense Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Cash Source Filter */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs">
            <Wallet className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <select
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="w-full bg-transparent focus:outline-hidden font-medium text-stone-700 cursor-pointer"
            >
              <option value="ALL">All Cash Sources</option>
              {cashSources.map((s) => (
                <option key={s.id} value={s.source_name}>
                  {s.source_name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search vendor, receipt, note..."
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-stone-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-12 text-center">#ID</th>
              <th className="py-3 px-3 w-28">Date & Time</th>
              <th className="py-3 px-3">Expense Category</th>
              <th className="py-3 px-3">Cash Source</th>
              <th className="py-3 px-3">Paid To (Vendor)</th>
              <th className="py-3 px-3">Ref No</th>
              <th className="py-3 px-3 min-w-[200px]">Description</th>
              <th className="py-3 px-3 text-right">Amount (AED)</th>
              <th className="py-3 px-3 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/80 font-normal">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-stone-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <TrendingDown className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="font-semibold text-stone-600">No expense records found</p>
                    <p className="text-[11px] text-stone-400">
                      No expenses match the current filter criteria or none have been entered yet.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              expenses.map((expense) => {
                const isDailyDrawer = expense.expense_source === 'Daily Sales Cash';
                const isPetty = expense.expense_source === 'Petty Cash Box';

                return (
                  <tr key={expense.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-stone-400 text-[11px]">
                      #{expense.id}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-stone-800">{expense.expense_date}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{expense.expense_time}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                        {expense.expense_category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {isDailyDrawer ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title="Deducted from cashier cash drawer">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span>Daily Sales Cash</span>
                        </span>
                      ) : isPetty ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-900 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>Petty Cash Box</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700">
                          {expense.expense_source}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-stone-800">
                        {expense.paid_to || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                      {expense.reference_no || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 max-w-xs truncate" title={expense.description || ''}>
                      {expense.description || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 text-sm">
                      -{formatAED(expense.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditExpense(expense)}
                          className="p-1 rounded text-stone-500 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors cursor-pointer"
                          title="Edit expense record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete expense record #${expense.id} (${formatAED(expense.amount)} for ${expense.expense_category})?`)) {
                              onDeleteExpense(expense.id);
                            }
                          }}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete record from SQLite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer Bar */}
      <div className="bg-stone-100 px-4 py-3 sm:px-6 border-t border-stone-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap text-stone-600">
          <div>
            <span>Filtered Expenses: </span>
            <strong className="text-stone-900 font-mono">{expenses.length}</strong>
          </div>
          <div>
            <span>Drawer Cash Outflows: </span>
            <strong className="text-amber-800 font-mono">-{formatAED(cashDrawerAmount)}</strong>
          </div>
          {pettyCashAmount > 0 && (
            <div>
              <span>Petty Cash: </span>
              <strong className="text-blue-800 font-mono">-{formatAED(pettyCashAmount)}</strong>
            </div>
          )}
          {otherSourcesAmount > 0 && (
            <div>
              <span>Bank/Card: </span>
              <strong className="text-stone-700 font-mono">-{formatAED(otherSourcesAmount)}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Total Expense Outflow:</span>
          <span className="text-base font-black font-mono text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
            -{formatAED(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
