import React, { useState, useMemo } from 'react';
import { 
  Store, 
  CreditCard, 
  Banknote, 
  DollarSign, 
  Download, 
  Printer, 
  FileText, 
  Search, 
  Percent, 
  TrendingUp, 
  ShoppingBag,
  Layers
} from 'lucide-react';
import { SaleRecord } from '../../types';
import { formatAED } from '../../lib/utils';
import { exportB2CSalesReportToExcel } from '../../lib/excelExport';
import { exportB2CSalesPdf } from '../../lib/pdfExport';

interface B2CSalesReportProps {
  sales: SaleRecord[];
  fromDate: string;
  toDate: string;
}

const KNOWN_B2B_PARTNERS = [
  'tripa tour',
  'dft',
  'dream journey',
  'sand journey',
  'desert tiger'
];

export const B2CSalesReport: React.FC<B2CSalesReportProps> = ({
  sales,
  fromDate,
  toDate
}) => {
  const [selectedCounterFilter, setSelectedCounterFilter] = useState<string>('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Filter only B2C Sales (Walk-ins, Retail, Cash/Card Counter sales)
  const b2cSales = useMemo(() => {
    return sales.filter(s => {
      if (s.sale_type === 'B2C') return true;
      if (s.sale_type === 'B2B') return false;
      if (s.payment_method === 'B2B' || s.payment_method === 'Car B2B') return false;
      if (s.customer_name && KNOWN_B2B_PARTNERS.includes(s.customer_name.trim().toLowerCase())) return false;
      return true;
    });
  }, [sales]);

  // Extract unique counters from B2C sales
  const allCounters = useMemo(() => {
    const set = new Set<string>([
      'DXA Sale Counter',
      'Photo Sale',
      'Juice Counter Sale',
      'Supermarket Sale',
      'Popcorn'
    ]);
    b2cSales.forEach(s => {
      if (s.sale_counter) set.add(s.sale_counter.trim());
    });
    return Array.from(set);
  }, [b2cSales]);

  // Apply filters
  const filteredB2CSales = useMemo(() => {
    return b2cSales.filter(s => {
      if (selectedCounterFilter !== 'ALL' && s.sale_counter !== selectedCounterFilter) return false;
      if (selectedPaymentFilter !== 'ALL' && s.payment_method !== selectedPaymentFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const ref = (s.reference_no || '').toLowerCase();
        const cust = (s.customer_name || '').toLowerCase();
        const counter = (s.sale_counter || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();
        if (!ref.includes(q) && !cust.includes(q) && !counter.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [b2cSales, selectedCounterFilter, selectedPaymentFilter, searchTerm]);

  // Financial Metrics
  const totalGross = useMemo(() => filteredB2CSales.reduce((sum, s) => sum + s.gross_amount, 0), [filteredB2CSales]);
  const totalCommission = useMemo(() => filteredB2CSales.reduce((sum, s) => sum + s.commission_amount, 0), [filteredB2CSales]);
  const totalNet = useMemo(() => filteredB2CSales.reduce((sum, s) => sum + s.net_amount, 0), [filteredB2CSales]);
  const totalTransactions = filteredB2CSales.length;

  const cashSalesTotal = useMemo(() => {
    return filteredB2CSales.filter(s => s.payment_method === 'Cash').reduce((sum, s) => sum + s.net_amount, 0);
  }, [filteredB2CSales]);

  const cardSalesTotal = useMemo(() => {
    return filteredB2CSales.filter(s => s.payment_method === 'Card').reduce((sum, s) => sum + s.net_amount, 0);
  }, [filteredB2CSales]);

  // Counter Breakdown
  const counterSummary = useMemo(() => {
    const map: Record<string, { count: number; gross: number; commission: number; net: number }> = {};
    allCounters.forEach(c => {
      map[c] = { count: 0, gross: 0, commission: 0, net: 0 };
    });

    b2cSales.forEach(s => {
      const cName = s.sale_counter || 'Other Counter';
      if (!map[cName]) {
        map[cName] = { count: 0, gross: 0, commission: 0, net: 0 };
      }
      map[cName].count += 1;
      map[cName].gross += s.gross_amount;
      map[cName].commission += s.commission_amount;
      map[cName].net += s.net_amount;
    });

    const allNet = Object.values(map).reduce((sum, c) => sum + c.net, 0);

    return Object.entries(map).map(([counter, data]) => ({
      counter,
      count: data.count,
      gross: data.gross,
      commission: data.commission,
      net: data.net,
      pctOfTotal: allNet > 0 ? (data.net / allNet) * 100 : 0
    })).sort((a, b) => b.net - a.net);
  }, [b2cSales, allCounters]);

  const handleExcelExport = () => {
    exportB2CSalesReportToExcel(fromDate, toDate, filteredB2CSales, counterSummary);
  };

  const handlePdfExport = () => {
    exportB2CSalesPdf(fromDate, toDate, filteredB2CSales, counterSummary);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-slate-800 to-stone-900 text-white p-5 rounded-2xl border border-stone-700 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
              B2C RETAIL OPERATIONS
            </span>
            <span className="text-xs text-stone-300 font-medium">Walk-In & Direct Guest Sales</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400" />
            <span>B2C Direct & Counter Sales Report</span>
          </h3>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Audit walk-in guests across DXA Quad Buggy Counter, Photo Sales, Juice Bar, Camp Supermarket, and Popcorn stands.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export B2C Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>B2C PDF Report</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Total B2C Gross</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-stone-900 font-mono">{formatAED(totalGross)}</div>
          <div className="text-[10px] text-stone-400 font-medium mt-1">Direct guest bookings</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Cash Collected</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">{formatAED(cashSalesTotal)}</div>
          <div className="text-[10px] text-stone-400 font-medium mt-1">Physical cash drawer</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Card Terminal</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-600 font-mono">{formatAED(cardSalesTotal)}</div>
          <div className="text-[10px] text-stone-400 font-medium mt-1">POS machine card receipts</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Commissions Paid</span>
            <Percent className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">{formatAED(totalCommission)}</div>
          <div className="text-[10px] text-stone-400 font-medium mt-1">Counter & guide shares</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-black uppercase">Net B2C Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">{formatAED(totalNet)}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">Net revenue retained</div>
        </div>
      </div>

      {/* Counter Breakdown Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF6B35]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
              B2C Retail Counter Breakdown
            </h4>
          </div>
          <span className="text-[11px] font-bold text-stone-500">
            {counterSummary.length} Retail Counters
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Counter Name</th>
                <th className="p-3 text-center">Transactions</th>
                <th className="p-3 text-right">Gross Sales (AED)</th>
                <th className="p-3 text-right">Commissions</th>
                <th className="p-3 text-right">Net Income (AED)</th>
                <th className="p-3 text-right">% of B2C Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium">
              {counterSummary.map((c) => (
                <tr 
                  key={c.counter}
                  className={`hover:bg-emerald-50/40 transition-colors cursor-pointer ${
                    selectedCounterFilter === c.counter ? 'bg-emerald-100/60 font-bold' : ''
                  }`}
                  onClick={() => setSelectedCounterFilter(selectedCounterFilter === c.counter ? 'ALL' : c.counter)}
                  title="Click to filter detailed register below"
                >
                  <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                    <span>{c.counter}</span>
                  </td>
                  <td className="p-3 text-center font-mono">{c.count}</td>
                  <td className="p-3 text-right font-mono text-stone-700">{formatAED(c.gross)}</td>
                  <td className="p-3 text-right font-mono text-rose-600">
                    {c.commission > 0 ? formatAED(c.commission) : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-emerald-800">{formatAED(c.net)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{c.pctOfTotal.toFixed(1)}%</span>
                      <div className="w-12 bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${Math.min(100, c.pctOfTotal)}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-stone-50 font-black border-t-2 border-stone-300 text-stone-900">
              <tr>
                <td className="p-3 uppercase">Total B2C Retail</td>
                <td className="p-3 text-center font-mono">{b2cSales.length}</td>
                <td className="p-3 text-right font-mono">{formatAED(b2cSales.reduce((s, x) => s + x.gross_amount, 0))}</td>
                <td className="p-3 text-right font-mono text-rose-600">{formatAED(b2cSales.reduce((s, x) => s + x.commission_amount, 0))}</td>
                <td className="p-3 text-right font-mono text-emerald-700">{formatAED(b2cSales.reduce((s, x) => s + x.net_amount, 0))}</td>
                <td className="p-3 text-right font-mono">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Detailed B2C Sales Register */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-700" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Itemized B2C Retail Sales Register
            </h4>
            <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
              {filteredB2CSales.length} records
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ref, guest, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-[#FF6B35] w-48 shadow-2xs"
              />
            </div>

            <select
              value={selectedCounterFilter}
              onChange={(e) => setSelectedCounterFilter(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#FF6B35] shadow-2xs"
            >
              <option value="ALL">All Retail Counters</option>
              {allCounters.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedPaymentFilter}
              onChange={(e) => setSelectedPaymentFilter(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#FF6B35] shadow-2xs"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="Cash">Cash Only</option>
              <option value="Card">Card Terminal Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Voucher / Ref #</th>
                <th className="p-3">Counter</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Guest / Customer</th>
                <th className="p-3 text-right">Gross (AED)</th>
                <th className="p-3 text-right">Commission</th>
                <th className="p-3 text-right">Net (AED)</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium">
              {filteredB2CSales.length > 0 ? (
                filteredB2CSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{sale.sale_date}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{sale.sale_time}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-stone-800 whitespace-nowrap">
                      {sale.reference_no || `DXA-${sale.id}`}
                    </td>
                    <td className="p-3 text-stone-700 whitespace-nowrap font-semibold">
                      {sale.sale_counter}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        sale.payment_method === 'Cash'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {sale.payment_method === 'Cash' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        <span>{sale.payment_method}</span>
                      </span>
                    </td>
                    <td className="p-3 font-bold text-stone-800 whitespace-nowrap">
                      {sale.customer_name || 'Walk-in Guest'}
                    </td>
                    <td className="p-3 text-right font-mono text-stone-800 font-bold">
                      {formatAED(sale.gross_amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-600 font-bold">
                      {sale.commission_amount > 0 ? formatAED(sale.commission_amount) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-stone-900">
                      {formatAED(sale.net_amount)}
                    </td>
                    <td className="p-3 text-stone-500 max-w-xs truncate">
                      {sale.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">
                    No B2C sales records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredB2CSales.length > 0 && (
              <tfoot className="bg-stone-50 font-black border-t-2 border-stone-300 text-stone-900">
                <tr>
                  <td colSpan={5} className="p-3 uppercase">
                    Total Filtered ({filteredB2CSales.length} retail sales)
                  </td>
                  <td className="p-3 text-right font-mono">{formatAED(totalGross)}</td>
                  <td className="p-3 text-right font-mono text-rose-600">{formatAED(totalCommission)}</td>
                  <td className="p-3 text-right font-mono text-emerald-700">{formatAED(totalNet)}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
