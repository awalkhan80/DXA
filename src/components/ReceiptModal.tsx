import React, { useState } from 'react';
import { Printer, X, Check, Copy } from 'lucide-react';
import { SaleRecord } from '../types';
import { formatAED } from '../lib/utils';
import { DesertXtremeLogo } from './DesertXtremeLogo';

interface ReceiptModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
  customLogo?: string | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, customLogo }) => {
  const [copied, setCopied] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
========================================
       DESERT XTREME ADVENTURE
       Step 1: Income Receipt
========================================
Receipt #: ${sale.reference_no || `#${sale.id}`}
Date:      ${sale.sale_date} ${sale.sale_time}
Counter:   ${sale.sale_counter}
Payment:   ${sale.payment_method}
Customer:  ${sale.customer_name || 'Walk-in'}
Activity:  ${sale.notes || 'Safari Activity'}
----------------------------------------
Gross Amount:       ${formatAED(sale.gross_amount)}
Commission / Agent: ${formatAED(sale.commission_amount)}
----------------------------------------
NET AMOUNT PAID:    ${formatAED(sale.net_amount)}
========================================
Thank you for adventuring with DXA!
Transaction ID: ${sale.id}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="bg-[#141724] text-white px-4 py-3 flex items-center justify-between text-xs border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse"></span>
            <span className="font-bold text-amber-300">
              Sales Receipt Preview • Ticket #{sale.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Paper Design */}
        <div className="p-6 bg-[#FAF7F2] flex justify-center">
          <div className="w-full bg-white p-6 rounded-xl border border-stone-200 shadow-sm font-mono text-xs text-stone-800 space-y-3.5">
            {/* Header */}
            <div className="text-center pb-3.5 border-b border-dashed border-stone-300">
              <div className="flex justify-center mb-2">
                <DesertXtremeLogo customLogo={customLogo} size="md" />
              </div>
              <h3 className="font-black text-sm tracking-tight text-[#FF6B35] uppercase">
                DESERT XTREME ADVENTURE
              </h3>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Dune Buggy • Quad Bike • Safari Oasis Dubai
              </p>
              <div className="inline-block mt-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 px-2.5 py-0.5 rounded-full text-[10px] text-[#FF6B35] font-black">
                OFFICIAL SALE RECEIPT
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-1.5 text-[11px] text-stone-600">
              <div className="flex justify-between">
                <span>Receipt / Ref:</span>
                <span className="font-bold text-stone-900">{sale.reference_no || `#DXA-${sale.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="font-medium text-stone-800">{sale.sale_date} {sale.sale_time}</span>
              </div>
              <div className="flex justify-between">
                <span>Counter:</span>
                <span className="font-bold text-[#FF6B35]">{sale.sale_counter}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold text-stone-800">{sale.payment_method}</span>
              </div>
              {sale.customer_name && (
                <div className="flex justify-between">
                  <span>Customer / Tour:</span>
                  <span className="font-medium text-stone-800 truncate max-w-[170px]">{sale.customer_name}</span>
                </div>
              )}
              {sale.notes && (
                <div className="flex justify-between text-stone-500">
                  <span>Activity / Notes:</span>
                  <span className="truncate max-w-[170px]">{sale.notes}</span>
                </div>
              )}
            </div>

            {/* Financials Table */}
            <div className="pt-2 border-t border-dashed border-stone-300 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Gross Amount:</span>
                <span className="font-bold">{formatAED(sale.gross_amount)} AED</span>
              </div>
              {sale.commission_amount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Commission / B2B:</span>
                  <span>-{formatAED(sale.commission_amount)} AED</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-stone-900 text-sm font-black text-stone-900">
                <span>NET AMOUNT:</span>
                <span className="text-[#FF6B35]">{formatAED(sale.net_amount)} AED</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-stone-300 text-[10px] text-stone-400">
              <p>Thank you for adventuring with Desert Xtreme!</p>
              <p className="font-mono text-[9px] mt-0.5">Transaction ID #{sale.id}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 font-bold px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Slip!' : 'Copy Slip'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-stone-600 hover:text-stone-800 font-bold px-3 py-1.5 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:brightness-110 px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
