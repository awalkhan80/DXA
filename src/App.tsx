import React, { useState, useEffect, useRef } from 'react';
import { db } from './db/sqlite';
import { 
  PaymentMethod, 
  SaleCounter, 
  SaleFormData, 
  SaleRecord, 
  ExpenseCategory, 
  CashSource, 
  ExpenseFormData, 
  ExpenseRecord, 
  CapitalInjectionFormData, 
  CapitalInjectionRecord,
  B2BCustomer,
  TourGuide,
  B2BPaymentRecord
} from './types';
import { DesktopTitlebar } from './components/DesktopTitlebar';
import { HeaderBanner } from './components/HeaderBanner';
import { MetricsCards } from './components/MetricsCards';
import { IncomeEntryForm } from './components/IncomeEntryForm';
import { SalesTable } from './components/SalesTable';
import { ExpenseEntryForm } from './components/ExpenseEntryForm';
import { ExpensesTable } from './components/ExpensesTable';
import { CashPositionSummary } from './components/CashPositionSummary';
import { CapitalInjectionModal } from './components/CapitalInjectionModal';
import { B2BPaymentModal } from './components/B2BPaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CounterManagerModal } from './components/CounterManagerModal';
import { SqliteConsoleModal } from './components/SqliteConsoleModal';
import { DailyReconciliationModal } from './components/DailyReconciliationModal';
import { OwnerCapitalInjection } from './components/OwnerCapitalInjection';
import { AppSidebar, NavView } from './components/AppSidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { VehicleManagement } from './components/VehicleManagement';
import { CustomerReporting } from './components/CustomerReporting';
import { CreditHistoryModule } from './components/CreditHistoryModule';
import { PettyCashTransferModule } from './components/PettyCashTransferModule';
import { PendingExpensesModule } from './components/PendingExpensesModule';
import { ReportsModule } from './components/ReportsModule';
import { AppFooter } from './components/AppFooter';
import { exportTodaySalesToExcel, exportTodayExpensesToExcel } from './lib/excelExport';

export default function App() {
  // Navigation & Active Module
  const [currentView, setCurrentView] = useState<NavView>('home-dashboard');
  const [activeModule, setActiveModule] = useState<'sales' | 'expenses' | 'capital' | 'cashflow'>('sales');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // SQLite State
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [capitalInjections, setCapitalInjections] = useState<CapitalInjectionRecord[]>([]);
  const [b2bPayments, setB2bPayments] = useState<B2BPaymentRecord[]>([]);
  const [counters, setCounters] = useState<SaleCounter[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [cashSources, setCashSources] = useState<CashSource[]>([]);
  const [b2bCustomers, setB2bCustomers] = useState<B2BCustomer[]>([]);
  const [tourGuides, setTourGuides] = useState<TourGuide[]>([]);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  // Common Date Filter
  const [dateFilter, setDateFilter] = useState<string>('today');

  // Sales Filters
  const [selectedCounter, setSelectedCounter] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<string>('ALL');
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>('');

  // Expenses Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('');

  // Editing state
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  // Modals & Navigation Sub-tabs
  const [reportsTab, setReportsTab] = useState<'b2b-sales' | 'b2b-ledger' | 'b2c-sales' | 'cashflow' | 'sales' | 'expenses' | 'counters' | 'reconciliation'>('b2b-sales');
  const [masterDataTab, setMasterDataTab] = useState<'counters' | 'b2b' | 'guides' | 'categories' | 'payments' | 'sources' | 'backup' | 'branding'>('counters');
  const [customLogo, setCustomLogo] = useState<string | null>(db.getCustomLogo());
  const [isSqlConsoleOpen, setIsSqlConsoleOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [isB2BPaymentModalOpen, setIsB2BPaymentModalOpen] = useState(false);
  const [b2bPaymentPartner, setB2bPaymentPartner] = useState<string | undefined>(undefined);
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null);

  const saleFormRef = useRef<HTMLDivElement>(null);
  const expenseFormRef = useRef<HTMLDivElement>(null);

  // Subscribe to SQLite database changes
  const reloadData = () => {
    setCounters(db.getCounters());
    setPaymentMethods(db.getPaymentMethods());
    setExpenseCategories(db.getExpenseCategories());
    setCashSources(db.getCashSources());
    setB2bCustomers(db.getB2BCustomers());
    setTourGuides(db.getTourGuides());
    setCustomLogo(db.getCustomLogo());

    // Calculate date bounds based on dateFilter
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let startDate: string | undefined;
    let endDate: string | undefined;

    if (dateFilter === 'today') {
      startDate = todayStr;
      endDate = todayStr;
    } else if (dateFilter === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      startDate = yStr;
      endDate = yStr;
    } else if (dateFilter === 'this_week') {
      const w = new Date();
      const day = w.getDay() || 7;
      w.setDate(w.getDate() - day + 1); // Monday
      startDate = w.toISOString().split('T')[0];
      endDate = todayStr;
    } else if (dateFilter === 'this_month') {
      startDate = `${todayStr.substring(0, 7)}-01`;
      endDate = todayStr;
    }

    // Load filtered Sales
    const filteredSales = db.getSales({
      startDate,
      endDate,
      counter: selectedCounter,
      paymentMethod: selectedPayment,
      search: salesSearchQuery
    });
    setSales(filteredSales);

    // Load filtered Expenses
    const filteredExpenses = db.getExpenses({
      startDate,
      endDate,
      category: selectedCategory,
      source: selectedSource,
      search: expenseSearchQuery
    });
    setExpenses(filteredExpenses);

    // Load Capital Injections
    const capitalList = db.getCapitalInjections({
      startDate,
      endDate
    });
    setCapitalInjections(capitalList);

    // Load B2B Payments
    const paymentsList = db.getB2BPayments({
      startDate,
      endDate
    });
    setB2bPayments(paymentsList);
  };

  const handleOpenB2BPayment = (partnerName?: string) => {
    setB2bPaymentPartner(partnerName);
    setIsB2BPaymentModalOpen(true);
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = db.subscribe(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, [dateFilter, selectedCounter, selectedPayment, salesSearchQuery, selectedCategory, selectedSource, expenseSearchQuery]);

  // Global Keyboard Shortcuts (F2: New Sale POS, Alt+E: Expense, Alt+C: Capital, Alt+R: Safe Audit, Alt+B: Backup, Alt+F: Reports, F5: Refresh, Esc: Cancel/Close)
  const handleRefreshWithToast = () => {
    reloadData();
    setRefreshToast('SQLite database tables refreshed');
    setTimeout(() => setRefreshToast(null), 2500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Fast New Sale POS Entry
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentView('sales-new');
        setActiveModule('sales');
        setEditingSale(null);
        setTimeout(() => saleFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      // Alt+E: Record Expense
      else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setCurrentView('expenses-add');
        setActiveModule('expenses');
        setEditingExpense(null);
        setTimeout(() => expenseFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      // Alt+C: Capital Injection
      else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsCapitalModalOpen(true);
      }
      // Alt+R: Safe Reconciliation / Audit
      else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setIsReconciliationOpen(true);
      }
      // Alt+B: Backup Database
      else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleBackupDatabase();
      }
      // Alt+F: Financial Reports
      else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setCurrentView('reports-cashflow');
        setActiveModule('cashflow');
        setReportsTab('cashflow');
      }
      // F5: Refresh recent data
      else if (e.key === 'F5') {
        e.preventDefault();
        handleRefreshWithToast();
      }
      // Esc: Close modals or Cancel Edit
      else if (e.key === 'Escape') {
        if (isSqlConsoleOpen || isMasterDataOpen || isReconciliationOpen || isCapitalModalOpen || receiptSale) {
          setIsSqlConsoleOpen(false);
          setIsMasterDataOpen(false);
          setIsReconciliationOpen(false);
          setIsCapitalModalOpen(false);
          setReceiptSale(null);
        } else if (editingSale) {
          setEditingSale(null);
        } else if (editingExpense) {
          setEditingExpense(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSqlConsoleOpen, isMasterDataOpen, isReconciliationOpen, isCapitalModalOpen, receiptSale, editingSale, editingExpense, activeModule]);

  // Compute Metrics for current filter
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let metricsStartDate: string | undefined;
  let metricsEndDate: string | undefined;

  if (dateFilter === 'today') {
    metricsStartDate = todayStr;
    metricsEndDate = todayStr;
  } else if (dateFilter === 'yesterday') {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    metricsStartDate = y.toISOString().split('T')[0];
    metricsEndDate = metricsStartDate;
  } else if (dateFilter === 'this_week') {
    const w = new Date();
    const day = w.getDay() || 7;
    w.setDate(w.getDate() - day + 1);
    metricsStartDate = w.toISOString().split('T')[0];
    metricsEndDate = todayStr;
  } else if (dateFilter === 'this_month') {
    metricsStartDate = `${todayStr.substring(0, 7)}-01`;
    metricsEndDate = todayStr;
  }

  const salesMetrics = db.getMetrics({
    startDate: metricsStartDate,
    endDate: metricsEndDate,
    counter: selectedCounter !== 'ALL' ? selectedCounter : undefined,
    paymentMethod: selectedPayment !== 'ALL' ? selectedPayment : undefined
  });

  const expenseMetrics = db.getExpenseMetrics({
    startDate: metricsStartDate,
    endDate: metricsEndDate
  });

  const cashFlow = db.getCashFlowSummary({
    startDate: metricsStartDate,
    endDate: metricsEndDate
  });

  const dateFilterLabels: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This Week',
    this_month: 'This Month',
    all: 'All Time'
  };

  // Sales Handlers
  const handleSaveSale = (formData: SaleFormData) => {
    if (editingSale) {
      db.updateSale(editingSale.id, formData);
      setEditingSale(null);
    } else {
      db.addSale(formData);
    }
  };

  const handleEditSale = (sale: SaleRecord) => {
    setCurrentView('sales-income');
    setActiveModule('sales');
    setEditingSale(sale);
    saleFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteSale = (id: number) => {
    db.deleteSale(id);
  };

  // Expenses Handlers
  const handleSaveExpense = (formData: ExpenseFormData) => {
    if (editingExpense) {
      db.updateExpense(editingExpense.id, formData);
      setEditingExpense(null);
    } else {
      db.addExpense(formData);
    }
  };

  const handleEditExpense = (expense: ExpenseRecord) => {
    setCurrentView('expenses-add');
    setActiveModule('expenses');
    setEditingExpense(expense);
    expenseFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteExpense = (id: number) => {
    db.deleteExpense(id);
  };

  // Capital Injections Handlers
  const handleAddCapital = (formData: CapitalInjectionFormData) => {
    db.addCapitalInjection(formData);
  };

  const handleDeleteCapital = (id: number) => {
    db.deleteCapitalInjection(id);
  };

  // Exports Handlers
  const handleExportCsv = () => {
    if (activeModule === 'expenses') {
      const csvContent = db.exportExpensesCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DXA_Expenses_Outflows_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const csvContent = db.exportCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DXA_Sales_Income_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportSql = () => {
    const sqlContent = db.exportSQLDump();
    const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dxa_complete_sqlite_dump_${new Date().toISOString().split('T')[0]}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupDatabase = () => {
    const backup = db.exportDatabaseBackup();
    const blob = new Blob([backup.content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', backup.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setRefreshToast(`Database backup saved: ${backup.filename}`);
    setTimeout(() => setRefreshToast(null), 4000);
  };

  const handleRestoreDatabase = (rawContent: string) => {
    try {
      const result = db.restoreDatabase(rawContent);
      reloadData();
      setRefreshToast(result.message);
      setTimeout(() => setRefreshToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to restore database.');
    }
  };

  const handleSaveLogo = (url: string | null) => {
    db.setCustomLogo(url);
    setCustomLogo(url);
    setRefreshToast(url ? 'Desert Xtreme logo updated successfully!' : 'Logo reset to default.');
    setTimeout(() => setRefreshToast(null), 3500);
  };

  const handleExportExcelSales = () => {
    exportTodaySalesToExcel(sales, todayStr);
    setRefreshToast(`Exported Sales to Excel (Sales_${todayStr}.xlsx)`);
    setTimeout(() => setRefreshToast(null), 3500);
  };

  const handleExportExcelExpenses = () => {
    exportTodayExpensesToExcel(expenses, todayStr);
    setRefreshToast(`Exported Expenses to Excel (Expenses_${todayStr}.xlsx)`);
    setTimeout(() => setRefreshToast(null), 3500);
  };

  const todayExpenses = db.getExpenses({ startDate: todayStr, endDate: todayStr });

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#2D3142] flex flex-col selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      {/* 1. Desktop Window Frame Titlebar (Electron / Windows .exe style) */}
      <DesktopTitlebar
        onOpenSqlConsole={() => setIsSqlConsoleOpen(true)}
        onOpenMasterData={() => setIsMasterDataOpen(true)}
        onOpenReconciliation={() => setIsReconciliationOpen(true)}
        onBackup={handleBackupDatabase}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Body with Sidebar and Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <AppSidebar
          currentView={currentView}
          onSelectView={(view: NavView) => {
            setCurrentView(view);
            if (view === 'home-dashboard') {
              setActiveModule('cashflow');
            } else if (view === 'sales-income' || view === 'sales-history') {
              setActiveModule('sales');
              if (view === 'sales-history') {
                setTimeout(() => {
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }, 100);
              }
            } else if (view === 'sales-new') {
              setActiveModule('sales');
              setEditingSale(null);
              setTimeout(() => {
                saleFormRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else if (view === 'expenses-add') {
              setActiveModule('expenses');
              setEditingExpense(null);
              setTimeout(() => {
                expenseFormRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else if (view === 'expenses-capital') {
              setActiveModule('capital');
            } else if (view === 'expenses-history') {
              setActiveModule('expenses');
              setTimeout(() => {
                window.scrollTo({ top: 450, behavior: 'smooth' });
              }, 100);
            } else if (view === 'reports' || view === 'reports-cashflow') {
              setActiveModule('cashflow');
              setReportsTab('cashflow');
            } else if (view === 'reports-sales' || view === 'reports-datewise') {
              setActiveModule('cashflow');
              setReportsTab('sales');
            } else if (view === 'reports-expenses') {
              setActiveModule('cashflow');
              setReportsTab('expenses');
            } else if (view === 'reports-counters') {
              setActiveModule('cashflow');
              setReportsTab('counters');
            }
          }}
          isMobileOpen={isSidebarOpen}
          onToggleMobile={() => setIsSidebarOpen((prev) => !prev)}
          salesMetrics={salesMetrics}
          expenseMetrics={expenseMetrics}
          cashFlow={cashFlow}
          onOpenSqlConsole={() => setIsSqlConsoleOpen(true)}
          onOpenMasterData={(tab) => {
            if (tab) setMasterDataTab(tab);
            setIsMasterDataOpen(true);
          }}
          onOpenReconciliation={() => setIsReconciliationOpen(true)}
          onBackupDatabase={handleBackupDatabase}
          customLogo={customLogo}
        />

        {/* Workspace Content Column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* 2. Brand Header Banner with Desert Gradient & Module Switcher */}
          <HeaderBanner
            activeModule={activeModule}
            currentView={currentView}
            customLogo={customLogo}
            onSelectModule={(mod) => {
              setActiveModule(mod);
              if (mod === 'sales') setCurrentView('sales-income');
              else if (mod === 'expenses') setCurrentView('expenses-add');
              else if (mod === 'capital') setCurrentView('expenses-capital');
              else if (mod === 'cashflow') setCurrentView('home-dashboard');
            }}
            metrics={salesMetrics}
            expenseMetrics={expenseMetrics}
            cashFlow={cashFlow}
            onNewSaleClick={() => {
              setCurrentView('sales-new');
              setActiveModule('sales');
              setEditingSale(null);
              setTimeout(() => saleFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }}
            onNewExpenseClick={() => {
              setCurrentView('expenses-add');
              setActiveModule('expenses');
              setEditingExpense(null);
              setTimeout(() => expenseFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }}
            onOpenCapitalModal={() => {
              setIsCapitalModalOpen(true);
            }}
            onOpenReconciliation={() => setIsReconciliationOpen(true)}
            onReceiveB2BPayment={() => handleOpenB2BPayment()}
            onBackupDatabase={handleBackupDatabase}
            onOpenMasterData={(tab) => {
              if (tab) setMasterDataTab(tab);
              setIsMasterDataOpen(true);
            }}
            onOpenSqlConsole={() => setIsSqlConsoleOpen(true)}
            onExportCsv={handleExportCsv}
            onExportSql={handleExportSql}
            onNavigate={(view) => {
              setCurrentView(view);
              if (view === 'home-dashboard') setActiveModule('cashflow');
              else if (view === 'sales-new' || view === 'sales-income' || view === 'sales-history') setActiveModule('sales');
              else if (view === 'expenses-add' || view === 'expenses-history') setActiveModule('expenses');
              else if (view === 'expenses-capital') setActiveModule('capital');
              else if (view === 'reports-b2b-sales') {
                setActiveModule('sales');
                setReportsTab('b2b-sales');
              } else if (view === 'reports-b2b-ledger') {
                setActiveModule('sales');
                setReportsTab('b2b-ledger');
              } else if (view === 'reports-b2c-sales') {
                setActiveModule('sales');
                setReportsTab('b2c-sales');
              } else if (view === 'reports-cashflow' || view === 'reports') {
                setActiveModule('cashflow');
                setReportsTab('cashflow');
              } else if (view === 'reports-sales') {
                setActiveModule('sales');
                setReportsTab('sales');
              } else if (view === 'reports-expenses') {
                setActiveModule('expenses');
                setReportsTab('expenses');
              } else if (view === 'reports-counters') {
                setActiveModule('sales');
                setReportsTab('counters');
              }
            }}
          />

          {/* 3. Main Workspace Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* VIEW 1: HOME -> DASHBOARD */}
            {currentView === 'home-dashboard' && (
              <div className="space-y-6">
                <DashboardOverview
                  salesMetrics={salesMetrics}
                  expenseMetrics={expenseMetrics}
                  cashFlow={cashFlow}
                  recentSales={sales}
                  recentExpenses={expenses}
                  recentCapital={capitalInjections}
                  onNavigate={(view) => {
                    setCurrentView(view);
                    if (view === 'sales-income' || view === 'sales-new' || view === 'sales-history') {
                      setActiveModule('sales');
                      if (view === 'sales-new') {
                        setEditingSale(null);
                        setTimeout(() => saleFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                      }
                    } else if (view === 'expenses-add') {
                      setActiveModule('expenses');
                      setEditingExpense(null);
                      setTimeout(() => expenseFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                    } else if (view === 'expenses-capital') {
                      setActiveModule('capital');
                    } else if (view === 'reports') {
                      setActiveModule('cashflow');
                      setReportsTab('cashflow');
                    }
                  }}
                  onOpenReconciliation={() => setIsReconciliationOpen(true)}
                  onOpenCapitalModal={() => {
                    setCurrentView('expenses-capital');
                    setActiveModule('capital');
                  }}
                />
              </div>
            )}

            {/* VIEW 2A: SALES -> FAST NEW SALE ENTRY (POS CASHIER MODE) */}
            {['sales-income', 'sales-new'].includes(currentView) && (
              <div className="space-y-5">
                <div ref={saleFormRef}>
                  <IncomeEntryForm
                    counters={counters}
                    paymentMethods={paymentMethods}
                    b2bCustomers={b2bCustomers}
                    tourGuides={tourGuides}
                    editingRecord={editingSale}
                    onSave={handleSaveSale}
                    onCancelEdit={() => setEditingSale(null)}
                    onAddCounter={(name) => db.addCounter(name)}
                    onAddPaymentMethod={(name) => db.addPaymentMethod(name)}
                    onAddB2BCustomer={(name) => db.addB2BCustomer(name)}
                    onAddTourGuide={(name) => db.addTourGuide(name)}
                  />
                </div>

                {/* Today's Sales Live Ledger (Immediate Verification & Receipt Printing) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-2">
                      <span>Today's Transactions</span>
                      <span className="bg-[#FF6B35]/15 text-[#FF6B35] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {sales.filter((s) => s.sale_date === todayStr).length} Tickets
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentView('sales-history')}
                      className="text-xs font-bold text-[#FF6B35] hover:underline cursor-pointer"
                    >
                      View All Sales History &rarr;
                    </button>
                  </div>
                  <SalesTable
                    sales={sales}
                    counters={counters}
                    paymentMethods={paymentMethods}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    selectedCounter={selectedCounter}
                    setSelectedCounter={setSelectedCounter}
                    selectedPayment={selectedPayment}
                    setSelectedPayment={setSelectedPayment}
                    searchQuery={salesSearchQuery}
                    setSearchQuery={setSalesSearchQuery}
                    onEdit={handleEditSale}
                    onDelete={handleDeleteSale}
                    onPrintReceipt={(sale) => setReceiptSale(sale)}
                    onExportCsv={handleExportCsv}
                    onExportSql={handleExportSql}
                    onExportExcel={handleExportExcelSales}
                    onRefresh={handleRefreshWithToast}
                  />
                </div>
              </div>
            )}

            {/* VIEW 2B: SALES -> FULL SALES REGISTER */}
            {currentView === 'sales-history' && (
              <div className="space-y-4">
                <SalesTable
                  sales={sales}
                  counters={counters}
                  paymentMethods={paymentMethods}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  selectedCounter={selectedCounter}
                  setSelectedCounter={setSelectedCounter}
                  selectedPayment={selectedPayment}
                  setSelectedPayment={setSelectedPayment}
                  searchQuery={salesSearchQuery}
                  setSearchQuery={setSalesSearchQuery}
                  onEdit={handleEditSale}
                  onDelete={handleDeleteSale}
                  onPrintReceipt={(sale) => setReceiptSale(sale)}
                  onExportCsv={handleExportCsv}
                  onExportSql={handleExportSql}
                  onExportExcel={handleExportExcelSales}
                  onRefresh={handleRefreshWithToast}
                />
              </div>
            )}

            {/* VIEW 3A: EXPENSES -> RECORD EXPENSE VOUCHER */}
            {currentView === 'expenses-add' && (
              <div className="space-y-5">
                <div ref={expenseFormRef}>
                  <ExpenseEntryForm
                    categories={expenseCategories}
                    cashSources={cashSources}
                    todayExpenses={todayExpenses}
                    allExpenses={expenses}
                    onSaveExpense={handleSaveExpense}
                    onUpdateExpense={(id, data) => db.updateExpense(id, data)}
                    onAddExpenseCategory={(name) => db.addExpenseCategory(name)}
                    onAddCashSource={(name) => db.addCashSource(name)}
                    editingExpense={editingExpense}
                    onCancelEdit={() => setEditingExpense(null)}
                    onEditExpense={handleEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onOpenCapitalModal={() => {
                      setCurrentView('expenses-capital');
                      setActiveModule('capital');
                    }}
                  />
                </div>

                {/* Today's Expenses Quick Review */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-2">
                      <span>Today's Expense Outflows</span>
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {todayExpenses.length} Records
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentView('expenses-history')}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      View Full Expense Register &rarr;
                    </button>
                  </div>
                  <ExpensesTable
                    expenses={expenses}
                    categories={expenseCategories}
                    cashSources={cashSources}
                    dateFilter={dateFilter}
                    onDateFilterChange={setDateFilter}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedSource={selectedSource}
                    onSourceChange={setSelectedSource}
                    searchQuery={expenseSearchQuery}
                    onSearchChange={setExpenseSearchQuery}
                    onEditExpense={handleEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onExportExcel={handleExportExcelExpenses}
                    onExportCsv={handleExportCsv}
                    onRefresh={handleRefreshWithToast}
                    onNewExpenseClick={() => {
                      setEditingExpense(null);
                      expenseFormRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onOpenCapitalModal={() => {
                      setCurrentView('expenses-capital');
                      setActiveModule('capital');
                    }}
                  />
                </div>
              </div>
            )}

            {/* VIEW 3B: EXPENSES -> FULL EXPENSES REGISTER */}
            {currentView === 'expenses-history' && (
              <div className="space-y-4">
                <ExpensesTable
                  expenses={expenses}
                  categories={expenseCategories}
                  cashSources={cashSources}
                  dateFilter={dateFilter}
                  onDateFilterChange={setDateFilter}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedSource={selectedSource}
                  onSourceChange={setSelectedSource}
                  searchQuery={expenseSearchQuery}
                  onSearchChange={setExpenseSearchQuery}
                  onEditExpense={handleEditExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onExportExcel={handleExportExcelExpenses}
                  onExportCsv={handleExportCsv}
                  onRefresh={handleRefreshWithToast}
                  onNewExpenseClick={() => {
                    setEditingExpense(null);
                    setCurrentView('expenses-add');
                  }}
                  onOpenCapitalModal={() => {
                    setCurrentView('expenses-capital');
                    setActiveModule('capital');
                  }}
                />
              </div>
            )}

            {/* VIEW 4: EXPENSES -> ADD OWNER CAPITAL (STEP 2) */}
            {currentView === 'expenses-capital' && (
              <div className="space-y-6">
                <CashPositionSummary
                  cashFlow={cashFlow}
                  dateFilterLabel={dateFilterLabels[dateFilter] || 'Today'}
                  onOpenCapitalModal={() => {}}
                />
                <OwnerCapitalInjection
                  capitalInjections={capitalInjections}
                  onAddCapital={handleAddCapital}
                  onDeleteCapital={handleDeleteCapital}
                />
              </div>
            )}

            {/* VIEW: VEHICLE FLEET MANAGEMENT */}
            {currentView === 'vehicles-fleet' && (
              <VehicleManagement />
            )}

            {/* VIEW: CUSTOMER REPORTING & DIRECTORY */}
            {currentView === 'customers-report' && (
              <CustomerReporting />
            )}

            {/* VIEW: ACCOUNTS RECEIVABLE (B2B CREDIT) */}
            {currentView === 'credit-history' && (
              <CreditHistoryModule initialTab="accounts-receivable" />
            )}

            {/* VIEW: PETTY CASH SYSTEM */}
            {currentView === 'petty-cash' && (
              <PettyCashTransferModule />
            )}

            {/* VIEW: ACCOUNTS PAYABLE (EXPENSE CREDIT HISTORY) */}
            {currentView === 'pending-expenses' && (
              <CreditHistoryModule initialTab="accounts-payable" />
            )}

            {/* VIEW 5: STEP 3 REPORTING MODULE */}
            {['reports', 'reports-b2b-sales', 'reports-b2b-ledger', 'reports-b2c-sales', 'reports-cashflow', 'reports-sales', 'reports-expenses', 'reports-counters', 'reports-datewise'].includes(currentView) && (
              <div className="space-y-6">
                <ReportsModule
                  sales={sales}
                  expenses={expenses}
                  capitalInjections={capitalInjections}
                  b2bPayments={b2bPayments}
                  salesMetrics={salesMetrics}
                  expenseMetrics={expenseMetrics}
                  cashFlow={cashFlow}
                  onOpenReconciliation={() => setIsReconciliationOpen(true)}
                  onReceiveB2BPayment={handleOpenB2BPayment}
                  onRefreshData={reloadData}
                  initialTab={reportsTab}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Live Toast Notification */}
      {refreshToast && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#2D3142] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-stone-600 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-ping"></span>
          <span>{refreshToast}</span>
        </div>
      )}

      {/* 4. Desktop Status Footer */}
      <AppFooter
        onOpenMasterData={() => setIsMasterDataOpen(true)}
        onOpenCapitalModal={() => setIsCapitalModalOpen(true)}
        onOpenReconciliation={() => setIsReconciliationOpen(true)}
        onOpenSqlConsole={() => setIsSqlConsoleOpen(true)}
        capitalInjectionsCount={capitalInjections.length}
      />

      {/* Modals */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          onClose={() => setReceiptSale(null)}
          customLogo={customLogo}
        />
      )}

      <B2BPaymentModal
        isOpen={isB2BPaymentModalOpen}
        onClose={() => {
          setIsB2BPaymentModalOpen(false);
          setB2bPaymentPartner(undefined);
        }}
        onPaymentSaved={() => {
          reloadData();
          setRefreshToast('B2B Payment Receipt recorded successfully');
          setTimeout(() => setRefreshToast(null), 3000);
        }}
        initialCustomerName={b2bPaymentPartner}
        customers={b2bCustomers}
      />

      <CapitalInjectionModal
        isOpen={isCapitalModalOpen}
        onClose={() => setIsCapitalModalOpen(false)}
        capitalInjections={capitalInjections}
        onAddCapital={handleAddCapital}
        onDeleteCapital={handleDeleteCapital}
      />

      <CounterManagerModal
        isOpen={isMasterDataOpen}
        onClose={() => setIsMasterDataOpen(false)}
        initialTab={masterDataTab}
        counters={counters}
        paymentMethods={paymentMethods}
        expenseCategories={expenseCategories}
        cashSources={cashSources}
        b2bCustomers={b2bCustomers}
        tourGuides={tourGuides}
        onAddCounter={(name) => db.addCounter(name)}
        onToggleCounter={(id) => db.toggleCounter(id)}
        onAddPaymentMethod={(name) => db.addPaymentMethod(name)}
        onTogglePaymentMethod={(id) => db.togglePaymentMethod(id)}
        onAddExpenseCategory={(name) => db.addExpenseCategory(name)}
        onToggleExpenseCategory={(id) => db.toggleExpenseCategory(id)}
        onAddCashSource={(name) => db.addCashSource(name)}
        onToggleCashSource={(id) => db.toggleCashSource(id)}
        onAddB2BCustomer={(name) => db.addB2BCustomer(name)}
        onToggleB2BCustomer={(id) => db.toggleB2BCustomer(id)}
        onDeleteB2BCustomer={(id) => db.deleteB2BCustomer(id)}
        onAddTourGuide={(name) => db.addTourGuide(name)}
        onToggleTourGuide={(id) => db.toggleTourGuide(id)}
        onDeleteTourGuide={(id) => db.deleteTourGuide(id)}
        onBackupDatabase={handleBackupDatabase}
        onRestoreDatabase={handleRestoreDatabase}
        onZeroAllData={() => {
          db.zeroAllData();
          reloadData();
          setRefreshToast('All dummy sales, expenses, and cash transactions reset to 0.');
          setTimeout(() => setRefreshToast(null), 4000);
        }}
        currentLogo={customLogo}
        onSaveLogo={handleSaveLogo}
      />

      <SqliteConsoleModal
        isOpen={isSqlConsoleOpen}
        onClose={() => setIsSqlConsoleOpen(false)}
        onExportSql={handleExportSql}
        onResetDb={() => {
          db.resetDatabase();
          reloadData();
        }}
      />

      <DailyReconciliationModal
        isOpen={isReconciliationOpen}
        onClose={() => setIsReconciliationOpen(false)}
        metrics={salesMetrics}
        cashFlow={cashFlow}
        dateFilterLabel={dateFilterLabels[dateFilter] || 'Today'}
      />
    </div>
  );
}
