import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit2,
  Printer,
  ChevronDown,
  ArrowUpDown,
  Tag,
  CreditCard,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  RefreshCw,
  Clock,
  Coins
} from 'lucide-react';
import { PaymentMethod, SaleCounter, SaleRecord } from '../types';
import { formatAED, formatTime12Hour } from '../lib/utils';

interface SalesTableProps {
  sales: SaleRecord[];
  counters: SaleCounter[];
  paymentMethods: PaymentMethod[];
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  selectedCounter: string;
  setSelectedCounter: (counter: string) => void;
  selectedPayment: string;
  setSelectedPayment: (payment: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onEdit: (sale: SaleRecord) => void;
  onDelete: (id: number) => void;
  onPrintReceipt: (sale: SaleRecord) => void;
  onExportCsv: () => void;
  onExportSql: () => void;
  onExportExcel: () => void;
  onRefresh: () => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  counters,
  paymentMethods,
  dateFilter,
  setDateFilter,
  selectedCounter,
  setSelectedCounter,
  selectedPayment,
  setSelectedPayment,
  searchQuery,
  setSearchQuery,
  onEdit,
  onDelete,
  onPrintReceipt,
  onExportCsv,
  onExportSql,
  onExportExcel,
  onRefresh
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Counter badge colors
  const getCounterBadgeClass = (counter: string) => {
    switch (counter) {
      case 'DXA Sale Counter':
      case 'DXA Counter':
        return 'bg-orange-100 text-[#FF6B35] border-orange-200';
      case 'Photo Sale':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Juice Counter Sale':
      case 'Juice':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Supermarket Sale':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Popcorn':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getPaymentBadgeClass = (method: string) => {
    switch (method) {
      case 'Cash':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Card':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'B2B':
      case 'Car B2B':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-300';
    }
  };

  const totalTableGross = sales.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalTableCommission = sales.reduce((sum, s) => sum + s.commission_amount, 0);
  const totalTableNet = sales.reduce((sum, s) => sum + s.net_amount, 0);

  const filterLabels: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This Week',
    this_month: 'This Month',
    all: 'All Time'
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-stone-200/90 overflow-hidden">
      {/* Wireframe Header Section: Recent Sales (Today): */}
      <div className="px-5 py-4 bg-gradient-to-r from-stone-50 via-white to-stone-50 border-b border-stone-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#2D3142] flex items-center gap-2">
            <span>Recent Sales ({filterLabels[dateFilter] || 'Today'}):</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B35] font-mono">
              {sales.length} transactions
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time sales transaction ledger
          </p>
        </div>

        {/* Date Filter Selector and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Today's Sales to Excel Button */}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer active:scale-98"
            title="Download formatted Excel spreadsheet (Sales_YYYY-MM-DD.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Today&apos;s Sales to Excel</span>
          </button>

          {/* Live Refresh Button (F5) */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 transition-colors cursor-pointer"
            title="Refresh recent sales list from SQLite (F5)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Refresh (F5)</span>
          </button>

          {/* Date Filter Selector */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pl-2 border-l border-stone-200">
            <span className="text-stone-400 text-[11px] font-bold uppercase mr-1">Period:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all', label: 'All Time' }
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  dateFilter === d.id
                    ? 'bg-[#2D3142] text-white shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-bar: Search & Counter/Payment Filters */}
      <div className="px-5 py-3 bg-stone-50/70 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search reference #, customer, notes, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Counter Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-600 font-semibold">Counter:</span>
            <select
              value={selectedCounter}
              onChange={(e) => setSelectedCounter(e.target.value)}
              className="bg-white border border-stone-300 rounded-md px-2 py-1 text-xs text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            >
              <option value="ALL">All Counters</option>
              {counters.map((c) => (
                <option key={c.id} value={c.counter_name}>
                  {c.counter_name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-600 font-semibold">Method:</span>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="bg-white border border-stone-300 rounded-md px-2 py-1 text-xs text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            >
              <option value="ALL">All Methods</option>
              {paymentMethods.map((p) => (
                <option key={p.id} value={p.method_name}>
                  {p.method_name}
                </option>
              ))}
            </select>
          </div>

          {/* Export tools */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              title="Export Today's Sales to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1 text-[11px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              title="Download CSV"
            >
              <FileSpreadsheet className="w-3 h-3 text-stone-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={onExportSql}
              className="flex items-center gap-1 text-[11px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              title="Download System Data Backup"
            >
              <Download className="w-3 h-3 text-[#FF6B35]" />
              <span>Backup DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wireframe Table: Time | Counter | Method | Amount | Commission | Net */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-100 text-stone-800 uppercase font-black text-[11px] tracking-wider border-b border-stone-200">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Counter</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right font-black text-emerald-700">Net</th>
              <th className="px-4 py-3">Ref / Notes</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Calendar className="w-8 h-8 text-stone-300" />
                    <p className="font-semibold text-stone-600">No sales recorded for this period</p>
                    <p className="text-[11px] text-stone-400">
                      Use the Sales Entry form above to record transactions.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-[#FFF8F0]/60 transition-colors group"
                >
                  {/* Time (Formatted e.g. 10:30AM) */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-stone-900">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatTime12Hour(sale.sale_time)}</span>
                    </div>
                    {dateFilter !== 'today' && (
                      <span className="text-[10px] text-stone-400 font-sans block">
                        {sale.sale_date}
                      </span>
                    )}
                  </td>

                  {/* Counter */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${getCounterBadgeClass(
                        sale.sale_counter
                      )}`}
                    >
                      {sale.sale_counter}
                    </span>
                  </td>

                  {/* Method */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getPaymentBadgeClass(
                        sale.payment_method
                      )}`}
                    >
                      {sale.payment_method}
                    </span>
                  </td>

                  {/* Amount (Gross AED) */}
                  <td className="px-4 py-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap text-sm">
                    {formatAED(sale.gross_amount)}
                  </td>

                  {/* Commission */}
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#F7931E] whitespace-nowrap">
                    {sale.commission_amount > 0 ? (
                      formatAED(sale.commission_amount)
                    ) : (
                      <span className="text-stone-400 font-normal">0</span>
                    )}
                  </td>

                  {/* Net */}
                  <td className="px-4 py-3 text-right font-mono font-black text-[#06D6A0] whitespace-nowrap text-sm">
                    {formatAED(sale.net_amount)}
                  </td>

                  {/* Ref / Notes */}
                  <td className="px-4 py-3 max-w-xs text-[11px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      {sale.reference_no && (
                        <span className="font-mono font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                          {sale.reference_no}
                        </span>
                      )}
                      {sale.customer_name && (
                        <span className="font-medium text-stone-800">
                          {sale.customer_name}
                        </span>
                      )}
                    </div>
                    {sale.notes && (
                      <div className="text-stone-400 truncate mt-0.5" title={sale.notes}>
                        {sale.notes}
                      </div>
                    )}
                    {!sale.reference_no && !sale.customer_name && !sale.notes && (
                      <span className="text-stone-300 italic">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Print Receipt */}
                      <button
                        onClick={() => onPrintReceipt(sale)}
                        className="p-1.5 rounded-md text-stone-500 hover:text-[#00B4D8] hover:bg-sky-50 transition-colors"
                        title="Print / View Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(sale)}
                        className="p-1.5 rounded-md text-stone-500 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      {deleteConfirmId === sale.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded border border-rose-200">
                          <button
                            onClick={() => {
                              onDelete(sale.id);
                              setDeleteConfirmId(null);
                            }}
                            className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold hover:bg-rose-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[10px] text-stone-600 px-1 py-0.5 rounded hover:bg-stone-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(sale.id)}
                          className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete from SQLite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Totals Summary Footer */}
          {sales.length > 0 && (
            <tfoot className="bg-stone-50/90 font-bold border-t-2 border-stone-300 text-stone-900">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wide font-black">
                  Total ({sales.length} records):
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-stone-900 text-sm">
                  {formatAED(totalTableGross)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[#F7931E]">
                  {formatAED(totalTableCommission)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-[#06D6A0] text-sm">
                  {formatAED(totalTableNet)}
                </td>
                <td colSpan={2} className="px-4 py-3 text-stone-400 text-[11px] font-normal italic">
                  Net Realized = Gross - Commission
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
