import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Users, 
  Award, 
  DollarSign, 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Percent,
  PlusCircle,
  Clock,
  ArrowDownLeft,
  Scale
} from 'lucide-react';
import { SaleRecord, B2BPaymentRecord } from '../../types';
import { formatAED } from '../../lib/utils';
import { exportB2BSalesReportToExcel } from '../../lib/excelExport';
import { exportB2BSalesPdf } from '../../lib/pdfExport';

interface B2BSalesReportProps {
  sales: SaleRecord[];
  b2bPayments?: B2BPaymentRecord[];
  fromDate: string;
  toDate: string;
  onReceivePayment?: (partnerName?: string) => void;
}

const KNOWN_B2B_PARTNERS = [
  'Tripa tour',
  'DFT',
  'Dream Journey',
  'Sand Journey',
  'Desert Tiger'
];

export const B2BSalesReport: React.FC<B2BSalesReportProps> = ({
  sales,
  b2bPayments = [],
  fromDate,
  toDate,
  onReceivePayment
}) => {
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('ALL');
  const [selectedGuideFilter, setSelectedGuideFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Identify all B2B sales
  const b2bSales = useMemo(() => {
    return sales.filter(s => {
      if (s.sale_type === 'B2B') return true;
      if (s.payment_method === 'B2B' || s.payment_method === 'Car B2B') return true;
      if (s.customer_name && KNOWN_B2B_PARTNERS.some(p => p.toLowerCase() === s.customer_name?.toLowerCase())) return true;
      return false;
    });
  }, [sales]);

  // Extract all unique partners present in B2B sales or payments
  const allPartners = useMemo(() => {
    const set = new Set<string>(KNOWN_B2B_PARTNERS);
    b2bSales.forEach(s => {
      if (s.customer_name && s.customer_name.trim()) {
        set.add(s.customer_name.trim());
      }
    });
    b2bPayments.forEach(p => {
      if (p.customer_name && p.customer_name.trim()) {
        set.add(p.customer_name.trim());
      }
    });
    return Array.from(set);
  }, [b2bSales, b2bPayments]);

  // Extract all guides present in B2B sales
  const allGuides = useMemo(() => {
    const set = new Set<string>(['Sajid', 'Shahid']);
    b2bSales.forEach(s => {
      if (s.guide_name && s.guide_name.trim()) {
        set.add(s.guide_name.trim());
      }
    });
    return Array.from(set);
  }, [b2bSales]);

  // Apply Partner, Guide, and Search filters
  const filteredB2BSales = useMemo(() => {
    return b2bSales.filter(s => {
      if (selectedPartnerFilter !== 'ALL') {
        const pName = (s.customer_name || '').toLowerCase();
        if (pName !== selectedPartnerFilter.toLowerCase()) return false;
      }
      if (selectedGuideFilter !== 'ALL') {
        const gName = (s.guide_name || '').toLowerCase();
        if (gName !== selectedGuideFilter.toLowerCase()) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const ref = (s.reference_no || '').toLowerCase();
        const cust = (s.customer_name || '').toLowerCase();
        const guide = (s.guide_name || '').toLowerCase();
        const counter = (s.sale_counter || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();
        if (!ref.includes(q) && !cust.includes(q) && !guide.includes(q) && !counter.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [b2bSales, selectedPartnerFilter, selectedGuideFilter, searchTerm]);

  // Metrics
  const totalGross = useMemo(() => filteredB2BSales.reduce((sum, s) => sum + s.gross_amount, 0), [filteredB2BSales]);
  const totalCommission = useMemo(() => filteredB2BSales.reduce((sum, s) => sum + s.commission_amount, 0), [filteredB2BSales]);
  const totalNet = useMemo(() => filteredB2BSales.reduce((sum, s) => sum + s.net_amount, 0), [filteredB2BSales]);
  const totalVouchers = filteredB2BSales.length;

  const totalPaymentsReceived = useMemo(() => {
    return b2bPayments
      .filter(p => selectedPartnerFilter === 'ALL' || p.customer_name?.toLowerCase().trim() === selectedPartnerFilter.toLowerCase().trim())
      .reduce((sum, p) => sum + p.amount, 0);
  }, [b2bPayments, selectedPartnerFilter]);

  const totalOutstandingDue = useMemo(() => {
    return Math.max(0, Math.round((totalNet - totalPaymentsReceived) * 100) / 100);
  }, [totalNet, totalPaymentsReceived]);

  // Partner Summary Table Data (with Receipts & Outstanding Due)
  const partnerSummary = useMemo(() => {
    const map: Record<string, { count: number; gross: number; commission: number; net: number; received: number }> = {};
    allPartners.forEach(p => {
      map[p] = { count: 0, gross: 0, commission: 0, net: 0, received: 0 };
    });

    b2bSales.forEach(s => {
      const pName = s.customer_name?.trim() || 'Other B2B Agency';
      if (!map[pName]) {
        map[pName] = { count: 0, gross: 0, commission: 0, net: 0, received: 0 };
      }
      map[pName].count += 1;
      map[pName].gross += s.gross_amount;
      map[pName].commission += s.commission_amount;
      map[pName].net += s.net_amount;
    });

    b2bPayments.forEach(p => {
      const pName = p.customer_name?.trim() || 'Other B2B Agency';
      if (!map[pName]) {
        map[pName] = { count: 0, gross: 0, commission: 0, net: 0, received: 0 };
      }
      map[pName].received += p.amount;
    });

    const allNet = Object.values(map).reduce((sum, p) => sum + p.net, 0);

    return Object.entries(map)
      .map(([partner, data]) => {
        const outstanding = Math.max(0, Math.round((data.net - data.received) * 100) / 100);
        return {
          partner,
          count: data.count,
          gross: data.gross,
          commission: data.commission,
          net: data.net,
          received: data.received,
          outstanding,
          pctOfTotal: allNet > 0 ? (data.net / allNet) * 100 : 0
        };
      })
      .filter(p => p.count > 0 || p.received > 0 || KNOWN_B2B_PARTNERS.includes(p.partner))
      .sort((a, b) => b.net - a.net);
  }, [b2bSales, b2bPayments, allPartners]);

  // Guide Commission Summary Data
  const guideCommissionSummary = useMemo(() => {
    const map: Record<string, { count: number; gross: number; commission: number }> = {};
    b2bSales.forEach(s => {
      if (s.guide_name && s.commission_amount > 0) {
        const gName = s.guide_name.trim();
        if (!map[gName]) {
          map[gName] = { count: 0, gross: 0, commission: 0 };
        }
        map[gName].count += 1;
        map[gName].gross += s.gross_amount;
        map[gName].commission += s.commission_amount;
      }
    });

    return Object.entries(map).map(([guide, data]) => ({
      guide,
      count: data.count,
      gross: data.gross,
      commission: data.commission
    })).sort((a, b) => b.commission - a.commission);
  }, [b2bSales]);

  const handleExcelExport = () => {
    exportB2BSalesReportToExcel(fromDate, toDate, filteredB2BSales, partnerSummary);
  };

  const handlePdfExport = () => {
    exportB2BSalesPdf(fromDate, toDate, filteredB2BSales, partnerSummary);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-gradient-to-r from-orange-600 via-[#FF6B35] to-amber-600 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              B2B AGENCY OPERATIONS & CREDIT
            </span>
            <span className="text-xs text-amber-100 font-medium">Tour Operator & Partner Statement</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Building className="w-6 h-6" />
            <span>B2B Sales, Commissions & Collections</span>
          </h3>
          <p className="text-xs text-orange-100 mt-1 max-w-2xl">
            Track credit sales vouchers, guide commission deductions, received customer settlements, and live receivable balances.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onReceivePayment && (
            <button
              type="button"
              id="report-receive-b2b-btn"
              onClick={() => onReceivePayment(selectedPartnerFilter !== 'ALL' ? selectedPartnerFilter : undefined)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-400"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Receive B2B Amount</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-stone-900 hover:bg-stone-50 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export B2B Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>B2B PDF Report</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-xs font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Total B2B Gross</span>
            <DollarSign className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black text-stone-900 font-mono">{formatAED(totalGross)}</div>
          <div className="text-[10px] text-stone-400 font-medium mt-1">Total value before commissions</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Guide Commission</span>
            <Percent className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">{formatAED(totalCommission)}</div>
          <div className="text-[10px] text-stone-400 font-medium mt-1">Guide commission deductions</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Net Invoiced</span>
            <Award className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-black text-stone-900 font-mono">{formatAED(totalNet)}</div>
          <div className="text-[10px] text-stone-500 font-medium mt-1">Total credit charges billed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-bold uppercase">Payments Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">{formatAED(totalPaymentsReceived)}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">Settlements collected</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-orange-400 shadow-xs bg-orange-50/20">
          <div className="flex items-center justify-between text-orange-800 mb-1">
            <span className="text-[11px] font-black uppercase">Outstanding Balance</span>
            <Scale className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <div className={`text-xl font-black font-mono ${totalOutstandingDue > 0 ? 'text-[#FF6B35]' : 'text-emerald-600'}`}>
            {formatAED(totalOutstandingDue)}
          </div>
          <div className="text-[10px] text-orange-700 font-medium mt-1">Net pending receivables</div>
        </div>
      </div>

      {/* Partner Performance Summary Table & Guide Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Partner-Wise Performance Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FF6B35]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                Partner Ledger Summary & Receivable Balances
              </h4>
            </div>
            <span className="text-[11px] font-bold text-stone-500">
              {partnerSummary.length} Partners
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3">Tour Operator / Partner</th>
                  <th className="p-3 text-center">Vouchers</th>
                  <th className="p-3 text-right">Gross (AED)</th>
                  <th className="p-3 text-right">Net Invoiced</th>
                  <th className="p-3 text-right">Received</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium">
                {partnerSummary.map((p) => {
                  const isTop = p.net > 0 && p.pctOfTotal >= 20;
                  return (
                    <tr 
                      key={p.partner} 
                      className={`hover:bg-orange-50/50 transition-colors ${
                        selectedPartnerFilter.toLowerCase() === p.partner.toLowerCase() ? 'bg-orange-100/60 font-bold' : ''
                      }`}
                    >
                      <td 
                        className="p-3 flex items-center gap-2 cursor-pointer"
                        onClick={() => setSelectedPartnerFilter(selectedPartnerFilter.toLowerCase() === p.partner.toLowerCase() ? 'ALL' : p.partner)}
                        title="Click to filter detailed register below"
                      >
                        <span className={`w-2 h-2 rounded-full ${isTop ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                        <span className="font-bold text-stone-900">{p.partner}</span>
                        {KNOWN_B2B_PARTNERS.includes(p.partner) && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                            Core
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono">{p.count}</td>
                      <td className="p-3 text-right font-mono text-stone-700">{formatAED(p.gross)}</td>
                      <td className="p-3 text-right font-mono font-bold text-stone-900">{formatAED(p.net)}</td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">{formatAED(p.received)}</td>
                      <td className={`p-3 text-right font-mono font-black ${p.outstanding > 0 ? 'text-[#FF6B35]' : 'text-emerald-600'}`}>
                        {formatAED(p.outstanding)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {onReceivePayment && (
                          <button
                            type="button"
                            onClick={() => onReceivePayment(p.partner)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                            <span>Receive</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Guide Commission Summary Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                Guide Commissions on B2B
              </h4>
            </div>
            <span className="text-[11px] font-bold text-stone-500">
              {guideCommissionSummary.length} Guides
            </span>
          </div>

          <div className="divide-y divide-stone-200">
            {guideCommissionSummary.length > 0 ? (
              guideCommissionSummary.map((g) => (
                <div key={g.guide} className="p-3.5 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>{g.guide}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {g.count} tours guided • Gross: {formatAED(g.gross)}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-black text-rose-600">
                      {formatAED(g.commission)}
                    </div>
                    <div className="text-[9px] text-stone-400 font-medium">Commission Earned</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-stone-400">
                No guide commissions recorded in B2B sales.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Detailed Register */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Detailed B2B Voucher Register ({filteredB2BSales.length})
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search voucher, partner, guide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-1 focus:ring-[#FF6B35] focus:outline-none"
              />
            </div>

            {/* Partner Dropdown Filter */}
            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-1 focus:ring-[#FF6B35] focus:outline-none"
            >
              <option value="ALL">All Partners ({allPartners.length})</option>
              {allPartners.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Guide Dropdown Filter */}
            <select
              value={selectedGuideFilter}
              onChange={(e) => setSelectedGuideFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-1 focus:ring-[#FF6B35] focus:outline-none"
            >
              <option value="ALL">All Guides ({allGuides.length})</option>
              {allGuides.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Ref / Voucher #</th>
                <th className="p-3">Partner / Operator</th>
                <th className="p-3">Counter / Activity</th>
                <th className="p-3">Assigned Guide</th>
                <th className="p-3 text-right">Gross (AED)</th>
                <th className="p-3 text-right">Commission</th>
                <th className="p-3 text-right">Net (AED)</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium">
              {filteredB2BSales.length > 0 ? (
                filteredB2BSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{sale.sale_date}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{sale.sale_time}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-stone-800 whitespace-nowrap">
                      {sale.reference_no || `DXA-${sale.id}`}
                    </td>
                    <td className="p-3 font-bold text-stone-900 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-orange-500" />
                        <span>{sale.customer_name || 'B2B Partner'}</span>
                      </span>
                    </td>
                    <td className="p-3 text-stone-700 whitespace-nowrap">
                      {sale.sale_counter}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {sale.guide_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                          {sale.guide_name}
                        </span>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
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
                    No B2B sales records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredB2BSales.length > 0 && (
              <tfoot className="bg-stone-50 font-black border-t-2 border-stone-300 text-stone-900">
                <tr>
                  <td colSpan={5} className="p-3 uppercase">
                    Total Filtered ({filteredB2BSales.length} vouchers)
                  </td>
                  <td className="p-3 text-right font-mono">{formatAED(totalGross)}</td>
                  <td className="p-3 text-right font-mono text-rose-600">{formatAED(totalCommission)}</td>
                  <td className="p-3 text-right font-mono text-[#FF6B35]">{formatAED(totalNet)}</td>
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
