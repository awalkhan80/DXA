import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Store, 
  CreditCard, 
  Tag, 
  Wallet, 
  ShieldAlert, 
  ShieldCheck,
  Database,
  Download,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Building,
  UserCheck,
  User,
  Trash2
} from 'lucide-react';
import { PaymentMethod, SaleCounter, ExpenseCategory, CashSource, B2BCustomer, TourGuide } from '../types';

interface CounterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'counters' | 'b2b' | 'guides' | 'payments' | 'categories' | 'sources' | 'backup' | 'branding';
  counters: SaleCounter[];
  paymentMethods: PaymentMethod[];
  expenseCategories: ExpenseCategory[];
  cashSources: CashSource[];
  b2bCustomers?: B2BCustomer[];
  tourGuides?: TourGuide[];
  onAddCounter: (name: string) => void;
  onToggleCounter: (id: number) => void;
  onAddPaymentMethod: (name: string) => void;
  onTogglePaymentMethod: (id: number) => void;
  onAddExpenseCategory: (name: string) => void;
  onToggleExpenseCategory: (id: number) => void;
  onAddCashSource: (name: string) => void;
  onToggleCashSource: (id: number) => void;
  onAddB2BCustomer?: (name: string) => void;
  onToggleB2BCustomer?: (id: number) => void;
  onDeleteB2BCustomer?: (id: number) => void;
  onAddTourGuide?: (name: string) => void;
  onToggleTourGuide?: (id: number) => void;
  onDeleteTourGuide?: (id: number) => void;
  onBackupDatabase?: () => void;
  onRestoreDatabase?: (fileContent: string) => void;
  onZeroAllData?: () => void;
  currentLogo?: string | null;
  onSaveLogo?: (url: string | null) => void;
}

export const CounterManagerModal: React.FC<CounterManagerModalProps> = ({
  isOpen,
  onClose,
  counters,
  paymentMethods,
  expenseCategories,
  cashSources,
  b2bCustomers = [],
  tourGuides = [],
  onAddCounter,
  onToggleCounter,
  onAddPaymentMethod,
  onTogglePaymentMethod,
  onAddExpenseCategory,
  onToggleExpenseCategory,
  onAddCashSource,
  onToggleCashSource,
  onAddB2BCustomer,
  onToggleB2BCustomer,
  onDeleteB2BCustomer,
  onAddTourGuide,
  onToggleTourGuide,
  onDeleteTourGuide,
  onBackupDatabase,
  onRestoreDatabase,
  onZeroAllData,
  currentLogo,
  onSaveLogo,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'counters' | 'b2b' | 'guides' | 'payments' | 'categories' | 'sources' | 'backup' | 'branding'>(initialTab || 'counters');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const [newCounterName, setNewCounterName] = useState('');
  const [newB2BName, setNewB2BName] = useState('');
  const [newGuideName, setNewGuideName] = useState('');
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [logoInput, setLogoInput] = useState(currentLogo || '');
  const [logoSavedSuccess, setLogoSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      onAddCounter(newCounterName);
      setNewCounterName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add counter');
    }
  };

  const handleAddB2BSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (onAddB2BCustomer) {
        onAddB2BCustomer(newB2BName);
        setNewB2BName('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add B2B customer');
    }
  };

  const handleAddGuideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (onAddTourGuide) {
        onAddTourGuide(newGuideName);
        setNewGuideName('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add tour guide');
    }
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      onAddPaymentMethod(newPaymentName);
      setNewPaymentName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      onAddExpenseCategory(newCategoryName);
      setNewCategoryName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add expense category');
    }
  };

  const handleAddSourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      onAddCashSource(newSourceName);
      setNewSourceName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add cash source');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#2D3142] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#F7931E]" />
            <div>
              <h3 className="text-sm font-bold text-white">Master Data & System Settings</h3>
              <p className="text-[10px] text-stone-400">
                Counters, B2B Tour Agencies, Payment Methods, Categories & Backup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-3 pt-3 overflow-x-auto gap-1">
          <button
            onClick={() => {
              setActiveTab('counters');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'counters'
                ? 'border-[#FF6B35] text-[#FF6B35]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Sale Counters ({counters.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('b2b');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'b2b'
                ? 'border-[#FF6B35] text-[#FF6B35]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>B2B Customers ({b2bCustomers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('guides');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'guides'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Tour Guides ({tourGuides.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('payments');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-[#00B4D8] text-[#00B4D8]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Methods ({paymentMethods.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('categories');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Expense Categories ({expenseCategories.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sources');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'sources'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Cash Sources ({cashSources.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('backup');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('branding');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'branding'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Logo & Brand</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {/* 1. COUNTERS TAB */}
          {activeTab === 'counters' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCounterSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new counter name (e.g. VIP Lounge Sale)..."
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  required
                  className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B35]"
                />
                <button
                  type="submit"
                  className="bg-[#FF6B35] hover:bg-[#e05a28] text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Counter</span>
                </button>
              </form>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Counter Name</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {counters.map((counter) => (
                      <tr key={counter.id} className="hover:bg-stone-50">
                        <td className="px-3 py-2 text-stone-400 font-mono">#{counter.id}</td>
                        <td className="px-3 py-2 font-semibold text-stone-800">{counter.counter_name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              counter.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {counter.is_active === 1 ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onToggleCounter(counter.id)}
                            className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                          >
                            {counter.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. B2B CUSTOMERS TAB */}
          {activeTab === 'b2b' && (
            <div className="space-y-4">
              <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3 flex items-start gap-2.5">
                <Building className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
                <div className="text-xs text-stone-700">
                  <span className="font-bold text-stone-900">B2B Tour Operator Partners</span>: 
                  Manage client accounts like <span className="font-semibold">Tripa tour, DFT, Dream Journey, Sand Journey, Desert Tiger</span> for quick selection in POS sales & vouchers.
                </div>
              </div>

              <form onSubmit={handleAddB2BSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new B2B customer / agency name (e.g. Arabian Adventures)..."
                  value={newB2BName}
                  onChange={(e) => setNewB2BName(e.target.value)}
                  required
                  className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B35]"
                />
                <button
                  type="submit"
                  className="bg-[#FF6B35] hover:bg-[#e05a28] text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add B2B Partner</span>
                </button>
              </form>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">B2B Customer / Agency Name</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {b2bCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-stone-50">
                        <td className="px-3 py-2 text-stone-400 font-mono">#{cust.id}</td>
                        <td className="px-3 py-2 font-bold text-stone-800 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-[#FF6B35]" />
                          <span>{cust.customer_name}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              cust.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {cust.is_active === 1 ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right space-x-2">
                          {onToggleB2BCustomer && (
                            <button
                              type="button"
                              onClick={() => onToggleB2BCustomer(cust.id)}
                              className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                            >
                              {cust.is_active === 1 ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          {onDeleteB2BCustomer && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete B2B customer "${cust.customer_name}"?`)) {
                                  onDeleteB2BCustomer(cust.id);
                                }
                              }}
                              className="text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                              title="Delete"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TOUR GUIDES TAB */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <User className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-xs text-stone-700">
                  <span className="font-bold text-stone-900">Tour Guides & Commission Beneficiaries</span>: 
                  Manage guides like <span className="font-semibold">1. Sajid, 2. Shahid</span> who receive commissions during counter sales and B2B bookings.
                </div>
              </div>

              <form onSubmit={handleAddGuideSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter guide name (e.g. Sajid, Shahid, Tariq)..."
                  value={newGuideName}
                  onChange={(e) => setNewGuideName(e.target.value)}
                  required
                  className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Guide</span>
                </button>
              </form>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Tour Guide Name</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {tourGuides.map((guide, idx) => (
                      <tr key={guide.id} className="hover:bg-stone-50">
                        <td className="px-3 py-2 text-stone-400 font-mono">#{guide.id}</td>
                        <td className="px-3 py-2 font-bold text-stone-800 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                          <span>{idx + 1}. {guide.guide_name}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              guide.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {guide.is_active === 1 ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right space-x-2">
                          {onToggleTourGuide && (
                            <button
                              type="button"
                              onClick={() => onToggleTourGuide(guide.id)}
                              className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                            >
                              {guide.is_active === 1 ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          {onDeleteTourGuide && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete guide "${guide.guide_name}"?`)) {
                                  onDeleteTourGuide(guide.id);
                                }
                              }}
                              className="text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                              title="Delete"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PAYMENT METHODS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <form onSubmit={handleAddPaymentSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new payment method (e.g. Bank Transfer)..."
                  value={newPaymentName}
                  onChange={(e) => setNewPaymentName(e.target.value)}
                  required
                  className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8]"
                />
                <button
                  type="submit"
                  className="bg-[#00B4D8] hover:bg-[#009bbd] text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Method</span>
                </button>
              </form>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Payment Method</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paymentMethods.map((pm) => (
                      <tr key={pm.id} className="hover:bg-stone-50">
                        <td className="px-3 py-2 text-stone-400 font-mono">#{pm.id}</td>
                        <td className="px-3 py-2 font-semibold text-stone-800">{pm.method_name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              pm.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {pm.is_active === 1 ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onTogglePaymentMethod(pm.id)}
                            className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                          >
                            {pm.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. EXPENSE CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new category (e.g. Uniforms & Safety Gear)..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </form>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Expense Category</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {expenseCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-stone-50">
                        <td className="px-3 py-2 text-stone-400 font-mono">#{cat.id}</td>
                        <td className="px-3 py-2 font-semibold text-stone-800">{cat.category_name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              cat.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {cat.is_active === 1 ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onToggleExpenseCategory(cat.id)}
                            className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                          >
                            {cat.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CASH SOURCES TAB */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSourceSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new cash source (e.g. Mashreq Bank Account)..."
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  required
                  className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Source</span>
                </button>
              </form>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Cash Source Name</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {cashSources.map((src) => (
                      <tr key={src.id} className="hover:bg-stone-50">
                        <td className="px-3 py-2 text-stone-400 font-mono">#{src.id}</td>
                        <td className="px-3 py-2 font-semibold text-stone-800">{src.source_name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              src.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {src.is_active === 1 ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onToggleCashSource(src.id)}
                            className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                          >
                            {src.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                      System Database Backup & Restore
                    </h4>
                    <p className="text-xs text-indigo-700/90 mt-0.5">
                      Export a safe point-in-time snapshot or restore from a previously exported database backup file (.db / .sql).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Backup Box */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white flex flex-col justify-between hover:border-indigo-200 transition-colors shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900">Backup Database</h5>
                        <p className="text-[10px] text-stone-500">Saves copy to Desktop or downloads</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
                      Creates a complete file named <span className="font-mono bg-stone-100 px-1 py-0.5 rounded text-[10px] text-stone-800">backup_YYYY-MM-DD_HHMMSS.db</span> including all Sales, Expenses, Counters, B2B Clients, and Categories.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onBackupDatabase) {
                        onBackupDatabase();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup Database</span>
                  </button>
                </div>

                {/* Restore Box */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white flex flex-col justify-between hover:border-amber-200 transition-colors shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900">Restore Database</h5>
                        <p className="text-[10px] text-stone-500">Restore from .db or .json</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
                      Replaces current database with selected backup file. Will prompt for confirmation before proceeding.
                    </p>
                  </div>

                  <input
                    ref={restoreFileInputRef}
                    type="file"
                    accept=".db,.json,.sql"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const confirmed = window.confirm('This will overwrite current data. Continue?');
                      if (!confirmed) {
                        e.target.value = '';
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content && onRestoreDatabase) {
                          try {
                            onRestoreDatabase(content);
                          } catch (err: any) {
                            setError(err.message || 'Failed to restore database.');
                          }
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => restoreFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore Database</span>
                  </button>
                </div>
              </div>

              {/* Zero All Dummy Data / Fresh Start Box */}
              <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                      Zero / Clear All Transactions
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                      Fresh Start
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/90 leading-relaxed max-w-xl">
                    Clear all sales, expenses, owner capital injections, and B2B voucher history to zero (0). Counters, guides, and categories remain saved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to zero all sales, expenses, and cash transactions? This will reset all transaction numbers to 0.')) {
                      if (onZeroAllData) onZeroAllData();
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  Zero All Data
                </button>
              </div>

              {/* Windows Desktop App Info */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-[11px] text-stone-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <span>💻</span>
                  <span>Desktop Application Local Storage Path:</span>
                </div>
                <div className="font-mono text-[10px] bg-white border border-stone-200 p-2 rounded text-stone-700 select-all overflow-x-auto">
                  %APPDATA%\desert-xtreme-pos\database.db
                </div>
                <p className="text-[10px] text-stone-500">
                  When running Desert Xtreme POS (.exe), local storage maintains all transactions in the user AppData directory automatically.
                </p>
              </div>
            </div>
          )}

          {/* 7. BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                <div className="flex items-start gap-3">
                  <ImageIcon className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Desert Xtreme Adventure Brand Logo
                    </h4>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      Configure your official Desert Xtreme logo. You can paste an image URL or upload an image file.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Logo Image URL / Web Link:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://... or paste your Desert Xtreme logo link here"
                      value={logoInput}
                      onChange={(e) => {
                        setLogoInput(e.target.value);
                        setLogoSavedSuccess(false);
                      }}
                      className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (onSaveLogo) {
                          onSaveLogo(logoInput.trim() || null);
                          setLogoSavedSuccess(true);
                          setTimeout(() => setLogoSavedSuccess(false), 3000);
                        }
                      }}
                      className="px-4 py-2 bg-[#2D3142] hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Save Logo
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-stone-400">or upload file:</span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-stone-500" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const result = evt.target?.result as string;
                          if (result) {
                            setLogoInput(result);
                            if (onSaveLogo) {
                              onSaveLogo(result);
                              setLogoSavedSuccess(true);
                              setTimeout(() => setLogoSavedSuccess(false), 3000);
                            }
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>

                  {logoInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoInput('');
                        if (onSaveLogo) onSaveLogo(null);
                        setLogoSavedSuccess(false);
                      }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove / Reset
                    </button>
                  )}
                </div>

                {logoSavedSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Logo updated and saved successfully!</span>
                  </div>
                )}

                {/* Logo Live Preview */}
                <div className="mt-4 border border-stone-200 rounded-xl p-4 bg-stone-50/50">
                  <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wide mb-2">
                    Live Preview:
                  </div>
                  <div className="flex items-center gap-4 bg-white border border-stone-200 p-3 rounded-lg">
                    {logoInput ? (
                      <img
                        src={logoInput}
                        alt="Desert Xtreme Logo"
                        className="h-12 max-w-[180px] object-contain rounded"
                        referrerPolicy="no-referrer"
                        onError={() => setError('Could not load image from provided URL.')}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-linear-to-br from-[#FF6B35] to-[#F7931E] rounded-lg flex items-center justify-center text-white text-xl font-black shadow-xs">
                        DX
                      </div>
                    )}
                    <div>
                      <div className="font-black text-sm text-stone-900 tracking-tight">
                        DESERT XTREME ADVENTURE
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                        POS & CASH FLOW SYSTEM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-[#2D3142] text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
