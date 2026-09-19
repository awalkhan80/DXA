import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, Building, CreditCard, DollarSign, Calendar, Eye, AlertCircle } from 'lucide-react';
import { Customer, SaleRecord } from '../types';
import { db } from '../db/sqlite';
import { formatAED } from '../lib/utils';

export const CustomerReporting: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<SaleRecord[]>([]);

  const reloadCustomers = () => {
    setCustomers(db.getCustomers());
  };

  useEffect(() => {
    reloadCustomers();
  }, []);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    const sales = db.getSales({ search: c.customer_name });
    setCustomerSales(sales);
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Users className="w-6 h-6 text-[#FF6B35]" />
            <h2 className="text-xl font-black uppercase tracking-wide">Customer Reporting & History System</h2>
          </div>
          <p className="text-xs text-stone-300">
            Automated customer profile tracking, total spend aggregation, credit balances, and transaction histories.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 font-medium focus:outline-hidden focus:border-[#FF6B35]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 font-bold text-stone-800"
        >
          <option value="ALL">All Customer Types</option>
          <option value="B2C">B2C Retail / Guest</option>
          <option value="B2B">B2B Partner / Agency</option>
          <option value="Credit">Credit Customer</option>
        </select>
      </div>

      {/* Main Grid: Customer Directory & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Directory Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-stone-100 border-b border-stone-200 font-black text-xs text-stone-700 uppercase tracking-wider flex items-center justify-between">
            <span>Customer Master Directory ({filtered.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase text-stone-500 tracking-wider">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 text-right">Total Spent</th>
                  <th className="p-3 text-right">Credit Balance</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs text-stone-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No customer profiles matched your query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-orange-50/50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-orange-50 font-bold' : ''
                        }`}
                        onClick={() => handleSelectCustomer(c)}
                      >
                        <td className="p-3 font-bold text-stone-900">{c.customer_name}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              c.customer_type === 'B2B'
                                ? 'bg-orange-100 text-orange-800'
                                : c.customer_type === 'Credit'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {c.customer_type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-stone-600">{c.phone || c.email || '-'}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          {formatAED(c.total_spent || 0)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">
                          {c.credit_balance && c.credit_balance > 0 ? formatAED(c.credit_balance) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Customer Profile & History */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          {!selectedCustomer ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-xs text-center space-y-2">
              <Users className="w-8 h-8 text-stone-300" />
              <p>Select any customer from the table to view complete sales history & ledger.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-stone-200 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                    {selectedCustomer.customer_type} Customer
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ID #{selectedCustomer.id}
                  </span>
                </div>
                <h3 className="text-lg font-black text-stone-900 mt-1">{selectedCustomer.customer_name}</h3>
                {selectedCustomer.phone && (
                  <p className="text-xs font-mono text-stone-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>{selectedCustomer.phone}</span>
                  </p>
                )}
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[10px] font-black uppercase text-emerald-800">Total Lifetime Spend</div>
                  <div className="text-base font-black text-emerald-700 font-mono mt-1">
                    {formatAED(selectedCustomer.total_spent || 0)}
                  </div>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="text-[10px] font-black uppercase text-rose-800">Credit Balance Due</div>
                  <div className="text-base font-black text-rose-700 font-mono mt-1">
                    {formatAED(selectedCustomer.credit_balance || 0)}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                  Transaction History ({customerSales.length})
                </h4>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {customerSales.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">No specific transaction logs found for this name.</p>
                  ) : (
                    customerSales.map((s) => (
                      <div key={s.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-stone-900">{s.sale_counter}</span>
                          <span className="font-mono text-emerald-700 font-black">{formatAED(s.gross_amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                          <span>{s.sale_date} {s.sale_time.substring(0, 5)}</span>
                          <span className="bg-stone-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-stone-800">
                            {s.payment_method}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
