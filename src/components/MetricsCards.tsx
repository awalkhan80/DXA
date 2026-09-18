import React from 'react';
import { DollarSign, Percent, TrendingUp, Layers, CreditCard, ShoppingBag } from 'lucide-react';
import { SummaryMetrics } from '../types';
import { formatAED } from '../lib/utils';

interface MetricsCardsProps {
  metrics: SummaryMetrics;
  dateFilterLabel: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, dateFilterLabel }) => {
  const avgTicket = metrics.transactionCount > 0 ? metrics.totalGross / metrics.transactionCount : 0;
  const commissionRate = metrics.totalGross > 0 ? (metrics.totalCommission / metrics.totalGross) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Gross Revenue Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200/80 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF6B35]"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Gross Income ({dateFilterLabel})
          </span>
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#FF6B35]">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-[#2D3142] tracking-tight">
          {formatAED(metrics.totalGross)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <span>{metrics.transactionCount} transactions</span>
          <span>Avg: {formatAED(avgTicket)}</span>
        </div>
      </div>

      {/* Commission Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200/80 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#F7931E]"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Commissions & B2B
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#F7931E]">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-[#F7931E] tracking-tight">
          {formatAED(metrics.totalCommission)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <span>Tour agents & drivers</span>
          <span className="font-semibold text-amber-700">{commissionRate.toFixed(1)}% of gross</span>
        </div>
      </div>

      {/* Net Revenue Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200/80 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#06D6A0]"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Net Realized Income
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[#06D6A0]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-[#06D6A0] tracking-tight">
          {formatAED(metrics.totalNet)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <span className="text-emerald-700 font-medium">After commission deduction</span>
          <span className="text-stone-400 font-mono">gross - comm</span>
        </div>
      </div>

      {/* Payment Channel Overview */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200/80 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#00B4D8]"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Payment Mix (Gross)
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-[#00B4D8]">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cash:
            </span>
            <span className="font-bold text-stone-800">
              {formatAED(metrics.paymentBreakdown['Cash']?.gross || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Card:
            </span>
            <span className="font-bold text-stone-800">
              {formatAED(metrics.paymentBreakdown['Card']?.gross || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> B2B:
            </span>
            <span className="font-bold text-stone-800">
              {formatAED((metrics.paymentBreakdown['B2B']?.gross || 0) + (metrics.paymentBreakdown['Car B2B']?.gross || 0))}
            </span>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-stone-400 text-right pt-1.5 border-t border-stone-100">
          Embedded SQLite Sales Ledger
        </div>
      </div>
    </div>
  );
};
