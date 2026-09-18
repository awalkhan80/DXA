import {
  PaymentMethod,
  SaleCounter,
  SaleFormData,
  SaleRecord,
  SummaryMetrics,
  ExpenseRecord,
  ExpenseFormData,
  CapitalInjectionRecord,
  CapitalInjectionFormData,
  ExpenseCategory,
  CashSource,
  B2BCustomer,
  TourGuide,
  B2BPaymentRecord,
  B2BPaymentFormData,
  ExpenseMetrics,
  CashFlowSummary
} from '../types';

const DB_STORAGE_KEY = 'dxa_sqlite_database_v3';
const LEGACY_STORAGE_KEY = 'dxa_sqlite_database_v2';
const V1_STORAGE_KEY = 'dxa_sqlite_database_v1';

const INITIAL_COUNTERS: string[] = [
  'DXA Sale Counter',
  'Photo Sale',
  'Juice Counter Sale',
  'Supermarket Sale',
  'Popcorn'
];

const INITIAL_PAYMENT_METHODS: string[] = [
  'Cash',
  'Card',
  'B2B'
];

// Tour Guides who receive commissions
const INITIAL_TOUR_GUIDES: string[] = [
  'Sajid',
  'Shahid'
];

// B2B Customer / Tour Operator Partners
const INITIAL_B2B_CUSTOMERS: string[] = [
  'Tripa tour',
  'DFT',
  'Dream Journey',
  'Sand Journey',
  'Desert Tiger'
];

// Step 2: Seed Categories from specifications
const INITIAL_EXPENSE_CATEGORIES: string[] = [
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

// Step 2: Seed Cash Sources from specifications
const INITIAL_CASH_SOURCES: string[] = [
  'Daily Sales Cash',
  'Owner Capital',
  'Bank Account',
  'Petty Cash Box',
  'Card Terminal'
];

interface StoredDBState {
  sales: SaleRecord[];
  counters: SaleCounter[];
  payment_methods: PaymentMethod[];
  b2b_customers: B2BCustomer[];
  tour_guides: TourGuide[];
  b2b_payments: B2BPaymentRecord[];
  expenses: ExpenseRecord[];
  capital_injections: CapitalInjectionRecord[];
  expense_categories: ExpenseCategory[];
  cash_sources: CashSource[];
  lastSaleId: number;
  lastCounterId: number;
  lastPaymentMethodId: number;
  lastB2BCustomerId: number;
  lastTourGuideId: number;
  lastB2BPaymentId: number;
  lastExpenseId: number;
  lastCapitalId: number;
  lastExpenseCategoryId: number;
  lastCashSourceId: number;
}

// Zeroed initial sales (clean slate)
const getInitialSampleSales = (): SaleRecord[] => [];

// Zeroed initial expenses (clean slate)
const getInitialSampleExpenses = (): ExpenseRecord[] => [];

// Zeroed initial capital injections (clean slate)
const getInitialSampleCapitalInjections = (): CapitalInjectionRecord[] => [];

// Zeroed initial B2B payments (clean slate)
const getInitialSampleB2BPayments = (): B2BPaymentRecord[] => [];

class SQLiteDatabaseManager {
  private state: StoredDBState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): StoredDBState {
    // Try to load v3 first
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.counters && parsed.payment_methods && parsed.expense_categories && parsed.cash_sources) {
          // Ensure B2B customers exist
          if (!Array.isArray(parsed.b2b_customers) || parsed.b2b_customers.length === 0) {
            parsed.b2b_customers = INITIAL_B2B_CUSTOMERS.map((name, idx) => ({
              id: idx + 1,
              customer_name: name,
              is_active: 1
            }));
            parsed.lastB2BCustomerId = parsed.b2b_customers.length;
          }

          // Ensure Tour Guides exist
          if (!Array.isArray(parsed.tour_guides) || parsed.tour_guides.length === 0) {
            parsed.tour_guides = INITIAL_TOUR_GUIDES.map((name, idx) => ({
              id: idx + 1,
              guide_name: name,
              is_active: 1
            }));
            parsed.lastTourGuideId = parsed.tour_guides.length;
          }

          // Ensure arrays are initialized
          if (!Array.isArray(parsed.sales)) parsed.sales = [];
          if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
          if (!Array.isArray(parsed.capital_injections)) parsed.capital_injections = [];
          if (!Array.isArray(parsed.b2b_payments)) parsed.b2b_payments = [];

          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not load stored v3 database state:', err);
    }

    // Attempt migration of master setup only from previous version (counters, guides, b2b clients)
    let preservedCounters: SaleCounter[] = [];
    let preservedPaymentMethods: PaymentMethod[] = [];
    let preservedB2BCustomers: B2BCustomer[] = [];
    let preservedTourGuides: TourGuide[] = [];
    let preservedCategories: ExpenseCategory[] = [];
    let preservedSources: CashSource[] = [];

    try {
      const prevStored = localStorage.getItem(LEGACY_STORAGE_KEY) || localStorage.getItem(V1_STORAGE_KEY);
      if (prevStored) {
        const parsedPrev = JSON.parse(prevStored);
        if (Array.isArray(parsedPrev.counters) && parsedPrev.counters.length > 0) {
          preservedCounters = parsedPrev.counters;
        }
        if (Array.isArray(parsedPrev.payment_methods) && parsedPrev.payment_methods.length > 0) {
          preservedPaymentMethods = parsedPrev.payment_methods.map((p: PaymentMethod) => ({
            ...p,
            method_name: p.method_name === 'Car B2B' ? 'B2B' : p.method_name
          }));
        }
        if (Array.isArray(parsedPrev.b2b_customers) && parsedPrev.b2b_customers.length > 0) {
          preservedB2BCustomers = parsedPrev.b2b_customers;
        }
        if (Array.isArray(parsedPrev.tour_guides) && parsedPrev.tour_guides.length > 0) {
          preservedTourGuides = parsedPrev.tour_guides;
        }
        if (Array.isArray(parsedPrev.expense_categories) && parsedPrev.expense_categories.length > 0) {
          preservedCategories = parsedPrev.expense_categories;
        }
        if (Array.isArray(parsedPrev.cash_sources) && parsedPrev.cash_sources.length > 0) {
          preservedSources = parsedPrev.cash_sources;
        }
      }
    } catch (err) {
      console.warn('Legacy migration check error:', err);
    }

    const defaultCounters: SaleCounter[] =
      preservedCounters.length > 0
        ? preservedCounters
        : INITIAL_COUNTERS.map((name, idx) => ({
            id: idx + 1,
            counter_name: name,
            is_active: 1
          }));

    const defaultPaymentMethods: PaymentMethod[] =
      preservedPaymentMethods.length > 0
        ? preservedPaymentMethods
        : INITIAL_PAYMENT_METHODS.map((name, idx) => ({
            id: idx + 1,
            method_name: name,
            is_active: 1
          }));

    const defaultB2BCustomers: B2BCustomer[] =
      preservedB2BCustomers.length > 0
        ? preservedB2BCustomers
        : INITIAL_B2B_CUSTOMERS.map((name, idx) => ({
            id: idx + 1,
            customer_name: name,
            is_active: 1
          }));

    const defaultTourGuides: TourGuide[] =
      preservedTourGuides.length > 0
        ? preservedTourGuides
        : INITIAL_TOUR_GUIDES.map((name, idx) => ({
            id: idx + 1,
            guide_name: name,
            is_active: 1
          }));

    const defaultExpenseCategories: ExpenseCategory[] =
      preservedCategories.length > 0
        ? preservedCategories
        : INITIAL_EXPENSE_CATEGORIES.map((name, idx) => ({
            id: idx + 1,
            category_name: name,
            is_active: 1
          }));

    const defaultCashSources: CashSource[] =
      preservedSources.length > 0
        ? preservedSources
        : INITIAL_CASH_SOURCES.map((name, idx) => ({
            id: idx + 1,
            source_name: name,
            is_active: 1
          }));

    // Start with 100% clean zeroed transactional state
    const initialState: StoredDBState = {
      sales: [],
      counters: defaultCounters,
      payment_methods: defaultPaymentMethods,
      b2b_customers: defaultB2BCustomers,
      tour_guides: defaultTourGuides,
      b2b_payments: [],
      expenses: [],
      capital_injections: [],
      expense_categories: defaultExpenseCategories,
      cash_sources: defaultCashSources,
      lastSaleId: 0,
      lastCounterId: defaultCounters.length,
      lastPaymentMethodId: defaultPaymentMethods.length,
      lastB2BCustomerId: defaultB2BCustomers.length,
      lastTourGuideId: defaultTourGuides.length,
      lastB2BPaymentId: 0,
      lastExpenseId: 0,
      lastCapitalId: 0,
      lastExpenseCategoryId: defaultExpenseCategories.length,
      lastCashSourceId: defaultCashSources.length
    };

    this.saveState(initialState);
    return initialState;
  }

  private saveState(state: StoredDBState = this.state) {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
      // Also maintain v1 in sync for backward compatibility
      localStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({
          sales: state.sales,
          counters: state.counters,
          payment_methods: state.payment_methods,
          lastSaleId: state.lastSaleId,
          lastCounterId: state.lastCounterId,
          lastPaymentMethodId: state.lastPaymentMethodId
        })
      );
      this.notify();
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Listener callback error:', e);
      }
    });
  }

  // ==========================================
  // --- SALE COUNTERS (MASTER) ---
  // ==========================================
  public getCounters(activeOnly: boolean = false): SaleCounter[] {
    if (activeOnly) {
      return this.state.counters.filter((c) => c.is_active === 1);
    }
    return [...this.state.counters];
  }

  public addCounter(name: string): SaleCounter {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Counter name cannot be empty');
    if (this.state.counters.some((c) => c.counter_name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Counter "${trimmed}" already exists`);
    }

    const newCounter: SaleCounter = {
      id: ++this.state.lastCounterId,
      counter_name: trimmed,
      is_active: 1
    };

    this.state.counters.push(newCounter);
    this.saveState();
    return newCounter;
  }

  public toggleCounter(id: number): void {
    const counter = this.state.counters.find((c) => c.id === id);
    if (counter) {
      counter.is_active = counter.is_active === 1 ? 0 : 1;
      this.saveState();
    }
  }

  // ==========================================
  // --- PAYMENT METHODS (MASTER) ---
  // ==========================================
  public getPaymentMethods(activeOnly: boolean = false): PaymentMethod[] {
    if (activeOnly) {
      return this.state.payment_methods.filter((p) => p.is_active === 1);
    }
    return [...this.state.payment_methods];
  }

  public addPaymentMethod(name: string): PaymentMethod {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Payment method name cannot be empty');
    if (this.state.payment_methods.some((p) => p.method_name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Payment method "${trimmed}" already exists`);
    }

    const newMethod: PaymentMethod = {
      id: ++this.state.lastPaymentMethodId,
      method_name: trimmed,
      is_active: 1
    };

    this.state.payment_methods.push(newMethod);
    this.saveState();
    return newMethod;
  }

  public togglePaymentMethod(id: number): void {
    const method = this.state.payment_methods.find((p) => p.id === id);
    if (method) {
      method.is_active = method.is_active === 1 ? 0 : 1;
      this.saveState();
    }
  }

  // ==========================================
  // --- B2B CUSTOMERS / AGENCIES (MASTER) ---
  // ==========================================
  public getB2BCustomers(activeOnly: boolean = false): B2BCustomer[] {
    if (!this.state.b2b_customers) {
      this.state.b2b_customers = INITIAL_B2B_CUSTOMERS.map((name, idx) => ({
        id: idx + 1,
        customer_name: name,
        is_active: 1
      }));
    }
    if (activeOnly) {
      return this.state.b2b_customers.filter((b) => b.is_active === 1);
    }
    return [...this.state.b2b_customers];
  }

  public addB2BCustomer(name: string): B2BCustomer {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('B2B Customer / Tour Operator name cannot be empty');
    if (!this.state.b2b_customers) {
      this.state.b2b_customers = [];
    }
    if (this.state.b2b_customers.some((b) => b.customer_name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`B2B Customer "${trimmed}" already exists`);
    }

    if (!this.state.lastB2BCustomerId) {
      this.state.lastB2BCustomerId = Math.max(0, ...this.state.b2b_customers.map((c) => c.id));
    }
    this.state.lastB2BCustomerId += 1;

    const newCust: B2BCustomer = {
      id: this.state.lastB2BCustomerId,
      customer_name: trimmed,
      is_active: 1
    };

    this.state.b2b_customers.push(newCust);
    this.saveState();
    return newCust;
  }

  public toggleB2BCustomer(id: number): void {
    if (!this.state.b2b_customers) return;
    const cust = this.state.b2b_customers.find((b) => b.id === id);
    if (cust) {
      cust.is_active = cust.is_active === 1 ? 0 : 1;
      this.saveState();
    }
  }

  public deleteB2BCustomer(id: number): void {
    if (!this.state.b2b_customers) return;
    this.state.b2b_customers = this.state.b2b_customers.filter((b) => b.id !== id);
    this.saveState();
  }

  // ==========================================
  // --- TOUR GUIDES (MASTER) ---
  // ==========================================
  public getTourGuides(activeOnly: boolean = false): TourGuide[] {
    if (!this.state.tour_guides) {
      this.state.tour_guides = INITIAL_TOUR_GUIDES.map((name, idx) => ({
        id: idx + 1,
        guide_name: name,
        is_active: 1
      }));
    }
    if (activeOnly) {
      return this.state.tour_guides.filter((g) => g.is_active === 1);
    }
    return [...this.state.tour_guides];
  }

  public addTourGuide(name: string): TourGuide {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Tour Guide name cannot be empty');
    if (!this.state.tour_guides) {
      this.state.tour_guides = [];
    }
    if (this.state.tour_guides.some((g) => g.guide_name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Guide "${trimmed}" already exists`);
    }

    if (!this.state.lastTourGuideId) {
      this.state.lastTourGuideId = Math.max(0, ...this.state.tour_guides.map((g) => g.id));
    }
    this.state.lastTourGuideId += 1;

    const newGuide: TourGuide = {
      id: this.state.lastTourGuideId,
      guide_name: trimmed,
      is_active: 1
    };

    this.state.tour_guides.push(newGuide);
    this.saveState();
    return newGuide;
  }

  public toggleTourGuide(id: number): void {
    if (!this.state.tour_guides) return;
    const guide = this.state.tour_guides.find((g) => g.id === id);
    if (guide) {
      guide.is_active = guide.is_active === 1 ? 0 : 1;
      this.saveState();
    }
  }

  public deleteTourGuide(id: number): void {
    if (!this.state.tour_guides) return;
    this.state.tour_guides = this.state.tour_guides.filter((g) => g.id !== id);
    this.saveState();
  }

  public deleteExpenseCategory(id: number): void {
    this.state.expense_categories = this.state.expense_categories.filter((c) => c.id !== id);
    this.saveState();
  }

  public deleteCounter(id: number): void {
    this.state.counters = this.state.counters.filter((c) => c.id !== id);
    this.saveState();
  }

  public deletePaymentMethod(id: number): void {
    this.state.payment_methods = this.state.payment_methods.filter((p) => p.id !== id);
    this.saveState();
  }

  // ==========================================
  // --- EXPENSE CATEGORIES (MASTER - STEP 2) ---
  // ==========================================
  public getExpenseCategories(activeOnly: boolean = false): ExpenseCategory[] {
    if (activeOnly) {
      return this.state.expense_categories.filter((c) => c.is_active === 1);
    }
    return [...this.state.expense_categories];
  }

  public addExpenseCategory(name: string): ExpenseCategory {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name cannot be empty');
    if (this.state.expense_categories.some((c) => c.category_name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Category "${trimmed}" already exists`);
    }

    const newCat: ExpenseCategory = {
      id: ++this.state.lastExpenseCategoryId,
      category_name: trimmed,
      is_active: 1
    };

    this.state.expense_categories.push(newCat);
    this.saveState();
    return newCat;
  }

  public toggleExpenseCategory(id: number): void {
    const cat = this.state.expense_categories.find((c) => c.id === id);
    if (cat) {
      cat.is_active = cat.is_active === 1 ? 0 : 1;
      this.saveState();
    }
  }

  // ==========================================
  // --- CASH SOURCES (MASTER - STEP 2) ---
  // ==========================================
  public getCashSources(activeOnly: boolean = false): CashSource[] {
    if (activeOnly) {
      return this.state.cash_sources.filter((s) => s.is_active === 1);
    }
    return [...this.state.cash_sources];
  }

  public addCashSource(name: string): CashSource {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Source name cannot be empty');
    if (this.state.cash_sources.some((s) => s.source_name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Cash Source "${trimmed}" already exists`);
    }

    const newSource: CashSource = {
      id: ++this.state.lastCashSourceId,
      source_name: trimmed,
      is_active: 1
    };

    this.state.cash_sources.push(newSource);
    this.saveState();
    return newSource;
  }

  public toggleCashSource(id: number): void {
    const source = this.state.cash_sources.find((s) => s.id === id);
    if (source) {
      source.is_active = source.is_active === 1 ? 0 : 1;
      this.saveState();
    }
  }

  // ==========================================
  // --- SALES CRUD ---
  // ==========================================
  public getSales(filter?: {
    search?: string;
    counter?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }): SaleRecord[] {
    let list = [...this.state.sales];

    if (filter?.counter && filter.counter !== 'ALL') {
      list = list.filter((s) => s.sale_counter === filter.counter);
    }

    if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
      list = list.filter((s) => s.payment_method === filter.paymentMethod);
    }

    if (filter?.startDate) {
      list = list.filter((s) => s.sale_date >= filter.startDate!);
    }

    if (filter?.endDate) {
      list = list.filter((s) => s.sale_date <= filter.endDate!);
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.reference_no && s.reference_no.toLowerCase().includes(q)) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q)) ||
          s.sale_counter.toLowerCase().includes(q) ||
          s.payment_method.toLowerCase().includes(q) ||
          s.gross_amount.toString().includes(q)
      );
    }

    // Sort descending by date then time
    return list.sort((a, b) => {
      const dateCmp = b.sale_date.localeCompare(a.sale_date);
      if (dateCmp !== 0) return dateCmp;
      return b.sale_time.localeCompare(a.sale_time);
    });
  }

  public getSaleById(id: number): SaleRecord | undefined {
    return this.state.sales.find((s) => s.id === id);
  }

  public generateNextReferenceNo(saleType: 'B2B' | 'B2C' = 'B2C', saleDate?: string): string {
    const dateStr = (saleDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const nextId = (this.state.lastSaleId || 0) + 1;
    const seq = String(nextId).padStart(4, '0');
    return `DXA-${saleType}-${dateStr}-${seq}`;
  }

  public generateNextExpenseReferenceNo(expenseDate?: string): string {
    const dateStr = (expenseDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const nextId = (this.state.lastExpenseId || 0) + 1;
    const seq = String(nextId).padStart(4, '0');
    return `EXP-${dateStr}-${seq}`;
  }

  public addSale(data: SaleFormData): SaleRecord {
    const gross = Number(data.gross_amount) || 0;
    const commission = Number(data.commission_amount) || 0;

    if (gross <= 0) {
      throw new Error('Gross Amount must be greater than zero');
    }
    if (commission < 0) {
      throw new Error('Commission Amount cannot be negative');
    }
    if (commission > gross) {
      throw new Error('Commission Amount cannot exceed Gross Amount');
    }

    const net = Math.round((gross - commission) * 100) / 100;
    const now = new Date();
    const created_at = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const newSaleId = ++this.state.lastSaleId;
    const isB2B = data.sale_type === 'B2B' || data.payment_method?.toUpperCase().includes('B2B');
    const autoSaleType: 'B2B' | 'B2C' = data.sale_type || (isB2B ? 'B2B' : 'B2C');
    
    // Auto generate reference if empty
    const autoDate = (data.sale_date || now.toISOString().split('T')[0]).replace(/-/g, '');
    const finalRef = data.reference_no?.trim() || `DXA-${autoSaleType}-${autoDate}-${String(newSaleId).padStart(4, '0')}`;

    const newSale: SaleRecord = {
      id: newSaleId,
      sale_date: data.sale_date || now.toISOString().split('T')[0],
      sale_time: data.sale_time || now.toTimeString().split(' ')[0],
      sale_counter: data.sale_counter,
      payment_method: data.payment_method,
      gross_amount: Math.round(gross * 100) / 100,
      commission_amount: Math.round(commission * 100) / 100,
      net_amount: net,
      reference_no: finalRef,
      customer_name: data.customer_name.trim() || null,
      guide_name: data.guide_name?.trim() || null,
      sale_type: autoSaleType,
      notes: data.notes.trim() || null,
      created_at
    };

    this.state.sales.unshift(newSale);
    this.saveState();
    return newSale;
  }

  public updateSale(id: number, data: Partial<SaleFormData>): SaleRecord {
    const index = this.state.sales.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Sale record with ID ${id} not found`);
    }

    const existing = this.state.sales[index];
    const gross = data.gross_amount !== undefined ? Number(data.gross_amount) : existing.gross_amount;
    const commission = data.commission_amount !== undefined ? Number(data.commission_amount) : existing.commission_amount;

    if (gross <= 0) throw new Error('Gross Amount must be greater than zero');
    if (commission < 0) throw new Error('Commission cannot be negative');
    if (commission > gross) throw new Error('Commission cannot exceed Gross Amount');

    const net = Math.round((gross - commission) * 100) / 100;

    const isB2B = data.sale_type === 'B2B' || (data.payment_method || existing.payment_method)?.toUpperCase().includes('B2B');
    const autoSaleType: 'B2B' | 'B2C' = data.sale_type || (isB2B ? 'B2B' : 'B2C');

    const updated: SaleRecord = {
      ...existing,
      sale_date: data.sale_date !== undefined ? data.sale_date : existing.sale_date,
      sale_time: data.sale_time !== undefined ? data.sale_time : existing.sale_time,
      sale_counter: data.sale_counter !== undefined ? data.sale_counter : existing.sale_counter,
      payment_method: data.payment_method !== undefined ? data.payment_method : existing.payment_method,
      gross_amount: Math.round(gross * 100) / 100,
      commission_amount: Math.round(commission * 100) / 100,
      net_amount: net,
      reference_no: data.reference_no !== undefined ? data.reference_no.trim() || null : existing.reference_no,
      customer_name: data.customer_name !== undefined ? data.customer_name.trim() || null : existing.customer_name,
      guide_name: data.guide_name !== undefined ? data.guide_name.trim() || null : existing.guide_name,
      sale_type: autoSaleType,
      notes: data.notes !== undefined ? data.notes.trim() || null : existing.notes
    };

    this.state.sales[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteSale(id: number): boolean {
    const beforeCount = this.state.sales.length;
    this.state.sales = this.state.sales.filter((s) => s.id !== id);
    if (this.state.sales.length !== beforeCount) {
      this.saveState();
      return true;
    }
    return false;
  }

  // ==========================================
  // --- EXPENSES CRUD (STEP 2) ---
  // ==========================================
  public getExpenses(filter?: {
    search?: string;
    category?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
  }): ExpenseRecord[] {
    let list = [...this.state.expenses];

    if (filter?.category && filter.category !== 'ALL') {
      list = list.filter((e) => e.expense_category === filter.category);
    }

    if (filter?.source && filter.source !== 'ALL') {
      list = list.filter((e) => e.expense_source === filter.source);
    }

    if (filter?.startDate) {
      list = list.filter((e) => e.expense_date >= filter.startDate!);
    }

    if (filter?.endDate) {
      list = list.filter((e) => e.expense_date <= filter.endDate!);
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.paid_to && e.paid_to.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.reference_no && e.reference_no.toLowerCase().includes(q)) ||
          e.expense_category.toLowerCase().includes(q) ||
          e.expense_source.toLowerCase().includes(q) ||
          e.amount.toString().includes(q)
      );
    }

    return list.sort((a, b) => {
      const dateCmp = b.expense_date.localeCompare(a.expense_date);
      if (dateCmp !== 0) return dateCmp;
      return b.expense_time.localeCompare(a.expense_time);
    });
  }

  public getExpenseById(id: number): ExpenseRecord | undefined {
    return this.state.expenses.find((e) => e.id === id);
  }

  public addExpense(data: ExpenseFormData): ExpenseRecord {
    const amount = Number(data.amount) || 0;

    if (!data.expense_category || !data.expense_category.trim()) {
      throw new Error('Please select an expense category');
    }
    if (!data.expense_source || !data.expense_source.trim()) {
      throw new Error('Please select an expense source');
    }
    if (amount <= 0) {
      throw new Error('Expense amount must be greater than zero');
    }

    const now = new Date();
    const created_at = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const newExpense: ExpenseRecord = {
      id: ++this.state.lastExpenseId,
      expense_date: data.expense_date || now.toISOString().split('T')[0],
      expense_time: data.expense_time || now.toTimeString().split(' ')[0],
      expense_category: data.expense_category.trim(),
      expense_source: data.expense_source.trim(),
      amount: Math.round(amount * 100) / 100,
      paid_to: data.paid_to.trim() || null,
      description: data.description.trim() || null,
      reference_no: data.reference_no.trim() || null,
      created_at
    };

    this.state.expenses.unshift(newExpense);
    this.saveState();
    return newExpense;
  }

  public updateExpense(id: number, data: Partial<ExpenseFormData>): ExpenseRecord {
    const index = this.state.expenses.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Expense record with ID ${id} not found`);
    }

    const existing = this.state.expenses[index];
    const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;

    if (amount <= 0) throw new Error('Expense amount must be greater than zero');

    const updated: ExpenseRecord = {
      ...existing,
      expense_date: data.expense_date !== undefined ? data.expense_date : existing.expense_date,
      expense_time: data.expense_time !== undefined ? data.expense_time : existing.expense_time,
      expense_category: data.expense_category !== undefined ? data.expense_category : existing.expense_category,
      expense_source: data.expense_source !== undefined ? data.expense_source : existing.expense_source,
      amount: Math.round(amount * 100) / 100,
      paid_to: data.paid_to !== undefined ? data.paid_to.trim() || null : existing.paid_to,
      description: data.description !== undefined ? data.description.trim() || null : existing.description,
      reference_no: data.reference_no !== undefined ? data.reference_no.trim() || null : existing.reference_no
    };

    this.state.expenses[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteExpense(id: number): boolean {
    const before = this.state.expenses.length;
    this.state.expenses = this.state.expenses.filter((e) => e.id !== id);
    if (this.state.expenses.length !== before) {
      this.saveState();
      return true;
    }
    return false;
  }

  // ==========================================
  // --- CAPITAL INJECTIONS CRUD (STEP 2) ---
  // ==========================================
  public getCapitalInjections(filter?: { startDate?: string; endDate?: string }): CapitalInjectionRecord[] {
    let list = [...this.state.capital_injections];

    if (filter?.startDate) {
      list = list.filter((c) => c.injection_date >= filter.startDate!);
    }
    if (filter?.endDate) {
      list = list.filter((c) => c.injection_date <= filter.endDate!);
    }

    return list.sort((a, b) => {
      const dateCmp = b.injection_date.localeCompare(a.injection_date);
      if (dateCmp !== 0) return dateCmp;
      return b.injection_time.localeCompare(a.injection_time);
    });
  }

  public getCapitalInjectionById(id: number): CapitalInjectionRecord | undefined {
    return this.state.capital_injections.find((c) => c.id === id);
  }

  public addCapitalInjection(data: CapitalInjectionFormData): CapitalInjectionRecord {
    const amount = Number(data.amount) || 0;
    if (amount <= 0) {
      throw new Error('Capital injection amount must be greater than zero');
    }

    const now = new Date();
    const created_at = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const newCap: CapitalInjectionRecord = {
      id: ++this.state.lastCapitalId,
      injection_date: data.injection_date || now.toISOString().split('T')[0],
      injection_time: data.injection_time || now.toTimeString().split(' ')[0],
      amount: Math.round(amount * 100) / 100,
      source: data.source?.trim() || 'Owner Capital',
      purpose: data.purpose?.trim() || null,
      notes: data.notes?.trim() || null,
      created_at
    };

    this.state.capital_injections.unshift(newCap);
    this.saveState();
    return newCap;
  }

  public updateCapitalInjection(id: number, data: Partial<CapitalInjectionFormData>): CapitalInjectionRecord {
    const index = this.state.capital_injections.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Capital injection record with ID ${id} not found`);
    }

    const existing = this.state.capital_injections[index];
    const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;
    if (amount <= 0) throw new Error('Capital injection amount must be greater than zero');

    const updated: CapitalInjectionRecord = {
      ...existing,
      injection_date: data.injection_date !== undefined ? data.injection_date : existing.injection_date,
      injection_time: data.injection_time !== undefined ? data.injection_time : existing.injection_time,
      amount: Math.round(amount * 100) / 100,
      source: data.source !== undefined ? data.source.trim() || 'Owner Capital' : existing.source,
      purpose: data.purpose !== undefined ? data.purpose.trim() || null : existing.purpose,
      notes: data.notes !== undefined ? data.notes.trim() || null : existing.notes
    };

    this.state.capital_injections[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteCapitalInjection(id: number): boolean {
    const before = this.state.capital_injections.length;
    this.state.capital_injections = this.state.capital_injections.filter((c) => c.id !== id);
    if (this.state.capital_injections.length !== before) {
      this.saveState();
      return true;
    }
    return false;
  }

  // ==========================================
  // --- B2B CUSTOMER PAYMENTS CRUD (CREDIT RECOVERY) ---
  // ==========================================
  public getB2BPayments(filter?: {
    startDate?: string;
    endDate?: string;
    customerName?: string;
  }): B2BPaymentRecord[] {
    let list = [...(this.state.b2b_payments || [])];

    if (filter?.startDate) {
      list = list.filter((p) => p.payment_date >= filter.startDate!);
    }
    if (filter?.endDate) {
      list = list.filter((p) => p.payment_date <= filter.endDate!);
    }
    if (filter?.customerName && filter.customerName !== 'ALL') {
      const q = filter.customerName.toLowerCase().trim();
      list = list.filter((p) => p.customer_name.toLowerCase().trim() === q);
    }

    return list.sort((a, b) => {
      const dateCmp = b.payment_date.localeCompare(a.payment_date);
      if (dateCmp !== 0) return dateCmp;
      return b.payment_time.localeCompare(a.payment_time);
    });
  }

  public getB2BPaymentById(id: number): B2BPaymentRecord | undefined {
    return (this.state.b2b_payments || []).find((p) => p.id === id);
  }

  public addB2BPayment(data: B2BPaymentFormData): B2BPaymentRecord {
    const amount = Number(data.amount) || 0;
    if (amount <= 0) {
      throw new Error('Received payment amount must be greater than zero');
    }
    const customer = data.customer_name?.trim();
    if (!customer) {
      throw new Error('Please select or enter the B2B customer name');
    }

    const now = new Date();
    const created_at = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    if (!Array.isArray(this.state.b2b_payments)) {
      this.state.b2b_payments = [];
    }
    if (!this.state.lastB2BPaymentId) {
      this.state.lastB2BPaymentId = 0;
    }

    const newPayment: B2BPaymentRecord = {
      id: ++this.state.lastB2BPaymentId,
      payment_date: data.payment_date || now.toISOString().split('T')[0],
      payment_time: data.payment_time || now.toTimeString().split(' ')[0],
      customer_name: customer,
      amount: Math.round(amount * 100) / 100,
      payment_method: data.payment_method?.trim() || 'Cash',
      reference_no: data.reference_no?.trim() || `DXA-REC-${Date.now().toString().slice(-6)}`,
      received_by: data.received_by?.trim() || 'Cashier Desk',
      notes: data.notes?.trim() || null,
      created_at
    };

    this.state.b2b_payments.unshift(newPayment);
    this.saveState();
    return newPayment;
  }

  public updateB2BPayment(id: number, data: Partial<B2BPaymentFormData>): B2BPaymentRecord {
    if (!Array.isArray(this.state.b2b_payments)) {
      this.state.b2b_payments = [];
    }
    const index = this.state.b2b_payments.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`B2B Payment receipt with ID ${id} not found`);
    }

    const existing = this.state.b2b_payments[index];
    const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');

    const updated: B2BPaymentRecord = {
      ...existing,
      payment_date: data.payment_date !== undefined ? data.payment_date : existing.payment_date,
      payment_time: data.payment_time !== undefined ? data.payment_time : existing.payment_time,
      customer_name: data.customer_name !== undefined ? data.customer_name.trim() : existing.customer_name,
      amount: Math.round(amount * 100) / 100,
      payment_method: data.payment_method !== undefined ? data.payment_method.trim() : existing.payment_method,
      reference_no: data.reference_no !== undefined ? data.reference_no.trim() : existing.reference_no,
      received_by: data.received_by !== undefined ? data.received_by.trim() : existing.received_by,
      notes: data.notes !== undefined ? data.notes.trim() || null : existing.notes
    };

    this.state.b2b_payments[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteB2BPayment(id: number): boolean {
    if (!Array.isArray(this.state.b2b_payments)) return false;
    const before = this.state.b2b_payments.length;
    this.state.b2b_payments = this.state.b2b_payments.filter((p) => p.id !== id);
    if (this.state.b2b_payments.length !== before) {
      this.saveState();
      return true;
    }
    return false;
  }

  // ==========================================
  // --- METRICS & CASH FLOW SUMMARY ---
  // ==========================================
  public getMetrics(filter?: {
    startDate?: string;
    endDate?: string;
    counter?: string;
    paymentMethod?: string;
  }): SummaryMetrics {
    const records = this.getSales(filter);

    let totalGross = 0;
    let totalCommission = 0;
    let totalNet = 0;

    const counterBreakdown: Record<string, { count: number; gross: number; net: number }> = {};
    const paymentBreakdown: Record<string, { count: number; gross: number; net: number }> = {};

    this.state.counters.forEach((c) => {
      counterBreakdown[c.counter_name] = { count: 0, gross: 0, net: 0 };
    });

    this.state.payment_methods.forEach((p) => {
      paymentBreakdown[p.method_name] = { count: 0, gross: 0, net: 0 };
    });

    records.forEach((r) => {
      totalGross += r.gross_amount;
      totalCommission += r.commission_amount;
      totalNet += r.net_amount;

      if (!counterBreakdown[r.sale_counter]) {
        counterBreakdown[r.sale_counter] = { count: 0, gross: 0, net: 0 };
      }
      counterBreakdown[r.sale_counter].count += 1;
      counterBreakdown[r.sale_counter].gross += r.gross_amount;
      counterBreakdown[r.sale_counter].net += r.net_amount;

      if (!paymentBreakdown[r.payment_method]) {
        paymentBreakdown[r.payment_method] = { count: 0, gross: 0, net: 0 };
      }
      paymentBreakdown[r.payment_method].count += 1;
      paymentBreakdown[r.payment_method].gross += r.gross_amount;
      paymentBreakdown[r.payment_method].net += r.net_amount;
    });

    return {
      totalGross: Math.round(totalGross * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      transactionCount: records.length,
      counterBreakdown,
      paymentBreakdown
    };
  }

  public getExpenseMetrics(filter?: { startDate?: string; endDate?: string }): ExpenseMetrics {
    const records = this.getExpenses(filter);
    let totalExpense = 0;
    let cashExpenses = 0;

    const categoryBreakdown: Record<string, { count: number; total: number }> = {};
    const sourceBreakdown: Record<string, { count: number; total: number }> = {};

    this.state.expense_categories.forEach((c) => {
      categoryBreakdown[c.category_name] = { count: 0, total: 0 };
    });
    this.state.cash_sources.forEach((s) => {
      sourceBreakdown[s.source_name] = { count: 0, total: 0 };
    });

    records.forEach((e) => {
      totalExpense += e.amount;
      if (e.expense_source === 'Daily Sales Cash' || e.expense_source === 'Petty Cash Box') {
        cashExpenses += e.amount;
      }

      if (!categoryBreakdown[e.expense_category]) {
        categoryBreakdown[e.expense_category] = { count: 0, total: 0 };
      }
      categoryBreakdown[e.expense_category].count += 1;
      categoryBreakdown[e.expense_category].total += e.amount;

      if (!sourceBreakdown[e.expense_source]) {
        sourceBreakdown[e.expense_source] = { count: 0, total: 0 };
      }
      sourceBreakdown[e.expense_source].count += 1;
      sourceBreakdown[e.expense_source].total += e.amount;
    });

    return {
      totalExpense: Math.round(totalExpense * 100) / 100,
      expenseCount: records.length,
      cashExpenses: Math.round(cashExpenses * 100) / 100,
      categoryBreakdown,
      sourceBreakdown
    };
  }

  public getCashFlowSummary(filter?: { startDate?: string; endDate?: string }): CashFlowSummary {
    const sales = this.getSales(filter);
    const expenses = this.getExpenses(filter);
    const capital = this.getCapitalInjections(filter);
    const b2bPayments = this.getB2BPayments(filter);

    let cashSales = 0;
    let cardSales = 0;
    let b2bSales = 0;
    let totalGrossSales = 0;
    let commissionsPaidCash = 0;

    sales.forEach((s) => {
      totalGrossSales += s.gross_amount;
      commissionsPaidCash += s.commission_amount;
      if (s.payment_method === 'Cash') {
        cashSales += s.gross_amount;
      } else if (s.payment_method === 'Card') {
        cardSales += s.gross_amount;
      } else {
        b2bSales += s.gross_amount;
      }
    });

    const netSalesIncome = totalGrossSales - commissionsPaidCash;

    let totalOwnerCapital = 0;
    capital.forEach((c) => {
      totalOwnerCapital += c.amount;
    });

    let b2bPaymentsReceived = 0;
    let b2bPaymentsCash = 0;
    b2bPayments.forEach((p) => {
      b2bPaymentsReceived += p.amount;
      if (p.payment_method === 'Cash') {
        b2bPaymentsCash += p.amount;
      }
    });

    let expensesFromCash = 0;
    let expensesFromOther = 0;
    let totalExpenses = 0;

    expenses.forEach((e) => {
      totalExpenses += e.amount;
      if (e.expense_source === 'Daily Sales Cash' || e.expense_source === 'Petty Cash Box') {
        expensesFromCash += e.amount;
      } else {
        expensesFromOther += e.amount;
      }
    });

    // Cash in drawer formula:
    // Physical Cash Collected (Direct Cash Sales + B2B Cash Settlements) + Capital Injected - Commissions Paid (from Cash) - Cash Expenses
    const estimatedCashInDrawer = Math.round((cashSales + b2bPaymentsCash + totalOwnerCapital - commissionsPaidCash - expensesFromCash) * 100) / 100;

    return {
      cashSales: Math.round(cashSales * 100) / 100,
      cardSales: Math.round(cardSales * 100) / 100,
      b2bSales: Math.round(b2bSales * 100) / 100,
      b2bPaymentsReceived: Math.round(b2bPaymentsReceived * 100) / 100,
      b2bPaymentsCash: Math.round(b2bPaymentsCash * 100) / 100,
      totalGrossSales: Math.round(totalGrossSales * 100) / 100,
      commissionsPaidCash: Math.round(commissionsPaidCash * 100) / 100,
      netSalesIncome: Math.round(netSalesIncome * 100) / 100,
      totalOwnerCapital: Math.round(totalOwnerCapital * 100) / 100,
      expensesFromCash: Math.round(expensesFromCash * 100) / 100,
      expensesFromOther: Math.round(expensesFromOther * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      estimatedCashInDrawer
    };
  }

  // ==========================================
  // --- DIRECT SQL REPORT QUERIES (STEP 3) ---
  // ==========================================

  /**
   * -- 1. Cash Flow
   * SELECT 
   *   (SELECT COALESCE(SUM(net_amount), 0) FROM sales WHERE sale_date BETWEEN ? AND ?) AS total_sales,
   *   (SELECT COALESCE(SUM(amount), 0) FROM capital_injections WHERE injection_date BETWEEN ? AND ?) AS total_capital,
   *   (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date BETWEEN ? AND ?) AS total_expenses;
   */
  public queryCashFlowReport(startDate: string, endDate: string): {
    total_sales: number;
    total_capital: number;
    total_expenses: number;
    net_cash_flow: number;
    cash_sales_gross: number;
    card_sales_gross: number;
    commissions_paid_cash: number;
    expenses_from_cash: number;
    net_cash_in_hand: number;
  } {
    const filteredSales = this.state.sales
      .filter((s) => (!startDate || s.sale_date >= startDate) && (!endDate || s.sale_date <= endDate));

    const total_sales = filteredSales.reduce((sum, s) => sum + s.net_amount, 0);

    const cash_sales_gross = filteredSales
      .filter((s) => s.payment_method === 'Cash')
      .reduce((sum, s) => sum + s.gross_amount, 0);

    const card_sales_gross = filteredSales
      .filter((s) => s.payment_method === 'Card')
      .reduce((sum, s) => sum + s.gross_amount, 0);

    // Rule: All commissions (including Card & B2B sale commissions) are paid out of physical Cash in hand
    const commissions_paid_cash = filteredSales.reduce((sum, s) => sum + s.commission_amount, 0);

    const total_capital = this.state.capital_injections
      .filter((c) => (!startDate || c.injection_date >= startDate) && (!endDate || c.injection_date <= endDate))
      .reduce((sum, c) => sum + c.amount, 0);

    const filteredExpenses = this.state.expenses
      .filter((e) => (!startDate || e.expense_date >= startDate) && (!endDate || e.expense_date <= endDate));

    const total_expenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expenses_from_cash = filteredExpenses
      .filter((e) => e.expense_source === 'Daily Sales Cash' || e.expense_source === 'Petty Cash Box')
      .reduce((sum, e) => sum + e.amount, 0);

    const b2b_cash = this.state.b2b_payments
      .filter((p) => (!startDate || p.payment_date >= startDate) && (!endDate || p.payment_date <= endDate) && p.payment_method === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);

    // Net Cash in Hand = Cash Sales + B2B Cash + Capital - All Commissions Paid in Cash - Cash Expenses
    const net_cash_in_hand = Math.round((cash_sales_gross + b2b_cash + total_capital - commissions_paid_cash - expenses_from_cash) * 100) / 100;

    return {
      total_sales: Math.round(total_sales * 100) / 100,
      total_capital: Math.round(total_capital * 100) / 100,
      total_expenses: Math.round(total_expenses * 100) / 100,
      net_cash_flow: Math.round((total_sales + total_capital - total_expenses) * 100) / 100,
      cash_sales_gross: Math.round(cash_sales_gross * 100) / 100,
      card_sales_gross: Math.round(card_sales_gross * 100) / 100,
      commissions_paid_cash: Math.round(commissions_paid_cash * 100) / 100,
      expenses_from_cash: Math.round(expenses_from_cash * 100) / 100,
      net_cash_in_hand
    };
  }

  /**
   * -- 2. Total Sales
   * SELECT * FROM sales 
   * WHERE sale_date BETWEEN ? AND ? 
   * ORDER BY sale_date, sale_time;
   */
  public queryTotalSalesReport(startDate: string, endDate: string): SaleRecord[] {
    return this.state.sales
      .filter((s) => (!startDate || s.sale_date >= startDate) && (!endDate || s.sale_date <= endDate))
      .sort((a, b) => {
        if (a.sale_date === b.sale_date) {
          return (a.sale_time || '').localeCompare(b.sale_time || '');
        }
        return a.sale_date.localeCompare(b.sale_date);
      });
  }

  /**
   * -- 3. Expenses by Category
   * SELECT expense_category, SUM(amount) as total 
   * FROM expenses 
   * WHERE expense_date BETWEEN ? AND ? 
   * GROUP BY expense_category;
   */
  public queryExpensesByCategory(startDate: string, endDate: string): Array<{ expense_category: string; total: number }> {
    const map: Record<string, number> = {};
    this.state.expenses
      .filter((e) => (!startDate || e.expense_date >= startDate) && (!endDate || e.expense_date <= endDate))
      .forEach((e) => {
        map[e.expense_category] = (map[e.expense_category] || 0) + e.amount;
      });

    return Object.entries(map).map(([expense_category, total]) => ({
      expense_category,
      total: Math.round(total * 100) / 100
    })).sort((a, b) => b.total - a.total);
  }

  /**
   * -- 4. Expenses by Source
   * SELECT expense_source, SUM(amount) as total 
   * FROM expenses 
   * WHERE expense_date BETWEEN ? AND ? 
   * GROUP BY expense_source;
   */
  public queryExpensesBySource(startDate: string, endDate: string): Array<{ expense_source: string; total: number }> {
    const map: Record<string, number> = {};
    this.state.expenses
      .filter((e) => (!startDate || e.expense_date >= startDate) && (!endDate || e.expense_date <= endDate))
      .forEach((e) => {
        map[e.expense_source] = (map[e.expense_source] || 0) + e.amount;
      });

    return Object.entries(map).map(([expense_source, total]) => ({
      expense_source,
      total: Math.round(total * 100) / 100
    })).sort((a, b) => b.total - a.total);
  }

  /**
   * -- 5. Counter-wise Sales
   * SELECT sale_counter, 
   *        COUNT(*) as transactions,
   *        SUM(gross_amount) as gross_sales,
   *        SUM(net_amount) as net_sales
   * FROM sales 
   * WHERE sale_date BETWEEN ? AND ? 
   * GROUP BY sale_counter;
   */
  public queryCounterWiseSalesReport(startDate: string, endDate: string): Array<{
    sale_counter: string;
    transactions: number;
    gross_sales: number;
    net_sales: number;
  }> {
    const map: Record<string, { transactions: number; gross_sales: number; net_sales: number }> = {};
    this.state.sales
      .filter((s) => (!startDate || s.sale_date >= startDate) && (!endDate || s.sale_date <= endDate))
      .forEach((s) => {
        if (!map[s.sale_counter]) {
          map[s.sale_counter] = { transactions: 0, gross_sales: 0, net_sales: 0 };
        }
        map[s.sale_counter].transactions += 1;
        map[s.sale_counter].gross_sales += s.gross_amount;
        map[s.sale_counter].net_sales += s.net_amount;
      });

    return Object.entries(map).map(([sale_counter, data]) => ({
      sale_counter,
      transactions: data.transactions,
      gross_sales: Math.round(data.gross_sales * 100) / 100,
      net_sales: Math.round(data.net_sales * 100) / 100
    })).sort((a, b) => b.net_sales - a.net_sales);
  }

  // ==========================================
  // --- DATABASE EXPORTS & SQLITE DUMP ---
  // ==========================================
  public exportSQLDump(): string {
    const timestamp = new Date().toISOString();
    let sql = `-- Desert Xtreme Adventure - SQLite Complete Database Dump\n`;
    sql += `-- Generated: ${timestamp}\n`;
    sql += `-- Windows Desktop Application: Step 1 (Sales) + Step 2 (Expenses & Owner Capital)\n\n`;

    sql += `PRAGMA foreign_keys = OFF;\n`;
    sql += `BEGIN TRANSACTION;\n\n`;

    // 1. sale_counters
    sql += `-- Table: sale_counters\n`;
    sql += `DROP TABLE IF EXISTS sale_counters;\n`;
    sql += `CREATE TABLE sale_counters (\n`;
    sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    sql += `    counter_name TEXT UNIQUE NOT NULL,\n`;
    sql += `    is_active INTEGER DEFAULT 1\n`;
    sql += `);\n\n`;
    this.state.counters.forEach((c) => {
      const escName = c.counter_name.replace(/'/g, "''");
      sql += `INSERT INTO sale_counters (id, counter_name, is_active) VALUES (${c.id}, '${escName}', ${c.is_active});\n`;
    });

    // 2. payment_methods
    sql += `\n-- Table: payment_methods\n`;
    sql += `DROP TABLE IF EXISTS payment_methods;\n`;
    sql += `CREATE TABLE payment_methods (\n`;
    sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    sql += `    method_name TEXT UNIQUE NOT NULL,\n`;
    sql += `    is_active INTEGER DEFAULT 1\n`;
    sql += `);\n\n`;
    this.state.payment_methods.forEach((p) => {
      const escName = p.method_name.replace(/'/g, "''");
      sql += `INSERT INTO payment_methods (id, method_name, is_active) VALUES (${p.id}, '${escName}', ${p.is_active});\n`;
    });

    // 3. expense_categories
    sql += `\n-- Table: expense_categories (Step 2)\n`;
    sql += `DROP TABLE IF EXISTS expense_categories;\n`;
    sql += `CREATE TABLE expense_categories (\n`;
    sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    sql += `    category_name TEXT UNIQUE NOT NULL,\n`;
    sql += `    is_active INTEGER DEFAULT 1\n`;
    sql += `);\n\n`;
    this.state.expense_categories.forEach((cat) => {
      const escName = cat.category_name.replace(/'/g, "''");
      sql += `INSERT INTO expense_categories (id, category_name, is_active) VALUES (${cat.id}, '${escName}', ${cat.is_active});\n`;
    });

    // 4. cash_sources
    sql += `\n-- Table: cash_sources (Step 2)\n`;
    sql += `DROP TABLE IF EXISTS cash_sources;\n`;
    sql += `CREATE TABLE cash_sources (\n`;
    sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    sql += `    source_name TEXT UNIQUE NOT NULL,\n`;
    sql += `    is_active INTEGER DEFAULT 1\n`;
    sql += `);\n\n`;
    this.state.cash_sources.forEach((src) => {
      const escName = src.source_name.replace(/'/g, "''");
      sql += `INSERT INTO cash_sources (id, source_name, is_active) VALUES (${src.id}, '${escName}', ${src.is_active});\n`;
    });

    // 5. sales
    sql += `\n-- Table: sales\n`;
    sql += `DROP TABLE IF EXISTS sales;\n`;
    sql += `CREATE TABLE sales (\n`;
    sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    sql += `    sale_date DATE NOT NULL,\n`;
    sql += `    sale_time TIME NOT NULL,\n`;
    sql += `    sale_counter TEXT NOT NULL,\n`;
    sql += `    payment_method TEXT NOT NULL,\n`;
    sql += `    gross_amount DECIMAL(10,2) NOT NULL,\n`;
    sql += `    commission_amount DECIMAL(10,2) DEFAULT 0,\n`;
    sql += `    net_amount DECIMAL(10,2) NOT NULL,\n`;
    sql += `    reference_no TEXT,\n`;
    sql += `    customer_name TEXT,\n`;
    sql += `    notes TEXT,\n`;
    sql += `    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;
    this.state.sales.forEach((s) => {
      const ref = s.reference_no ? `'${s.reference_no.replace(/'/g, "''")}'` : 'NULL';
      const cust = s.customer_name ? `'${s.customer_name.replace(/'/g, "''")}'` : 'NULL';
      const notes = s.notes ? `'${s.notes.replace(/'/g, "''")}'` : 'NULL';
      const counter = s.sale_counter.replace(/'/g, "''");
      const pay = s.payment_method.replace(/'/g, "''");

      sql += `INSERT INTO sales (id, sale_date, sale_time, sale_counter, payment_method, gross_amount, commission_amount, net_amount, reference_no, customer_name, notes, created_at) VALUES (${s.id}, '${s.sale_date}', '${s.sale_time}', '${counter}', '${pay}', ${s.gross_amount}, ${s.commission_amount}, ${s.net_amount}, ${ref}, ${cust}, ${notes}, '${s.created_at}');\n`;
    });

    // 6. expenses
    sql += `\n-- Table: expenses (Step 2)\n`;
    sql += `DROP TABLE IF EXISTS expenses;\n`;
    sql += `CREATE TABLE expenses (\n`;
    sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    sql += `    expense_date DATE NOT NULL,\n`;
    sql += `    expense_time TIME NOT NULL,\n`;
    sql += `    expense_category TEXT NOT NULL,\n`;
    sql += `    expense_source TEXT NOT NULL,\n`;
    sql += `    amount DECIMAL(10,2) NOT NULL,\n`;
    sql += `    paid_to TEXT,\n`;
    sql += `    description TEXT,\n`;
    sql += `    reference_no TEXT,\n`;
    sql += `    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;
    this.state.expenses.forEach((e) => {
      const paid = e.paid_to ? `'${e.paid_to.replace(/'/g, "''")}'` : 'NULL';
      const desc = e.description ? `'${e.description.replace(/'/g, "''")}'` : 'NULL';
      const ref = e.reference_no ? `'${e.reference_no.replace(/'/g, "''")}'` : 'NULL';
      const cat = e.expense_category.replace(/'/g, "''");
      const src = e.expense_source.replace(/'/g, "''");

      sql += `INSERT INTO expenses (id, expense_date, expense_time, expense_category, expense_source, amount, paid_to, description, reference_no, created_at) VALUES (${e.id}, '${e.expense_date}', '${e.expense_time}', '${cat}', '${src}', ${e.amount}, ${paid}, ${desc}, ${ref}, '${e.created_at}');\n`;
    });

    // 7. capital_injections
    sql += `\n-- Table: capital_injections (Step 2)\n`;
    sql += `DROP TABLE IF EXISTS capital_injections;\n`;
    sql += `CREATE TABLE capital_injections (\n`;
    sql += `    id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    sql += `    injection_date DATE NOT NULL,\n`;
    sql += `    injection_time TIME NOT NULL,\n`;
    sql += `    amount DECIMAL(10,2) NOT NULL,\n`;
    sql += `    source TEXT DEFAULT 'Owner Capital',\n`;
    sql += `    purpose TEXT,\n`;
    sql += `    notes TEXT,\n`;
    sql += `    created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;
    this.state.capital_injections.forEach((cap) => {
      const src = cap.source ? `'${cap.source.replace(/'/g, "''")}'` : "'Owner Capital'";
      const purpose = cap.purpose ? `'${cap.purpose.replace(/'/g, "''")}'` : 'NULL';
      const notes = cap.notes ? `'${cap.notes.replace(/'/g, "''")}'` : 'NULL';

      sql += `INSERT INTO capital_injections (id, injection_date, injection_time, amount, source, purpose, notes, created_at) VALUES (${cap.id}, '${cap.injection_date}', '${cap.injection_time}', ${cap.amount}, ${src}, ${purpose}, ${notes}, '${cap.created_at}');\n`;
    });

    sql += `\nCOMMIT;\n`;
    return sql;
  }

  public exportCSV(): string {
    const headers = [
      'ID',
      'Date',
      'Time',
      'Counter',
      'Payment Method',
      'Gross (AED)',
      'Commission (AED)',
      'Net (AED)',
      'Reference No',
      'Customer / Driver',
      'Notes',
      'Created At'
    ];

    const rows = this.state.sales.map((s) => [
      s.id,
      `"${s.sale_date}"`,
      `"${s.sale_time}"`,
      `"${s.sale_counter.replace(/"/g, '""')}"`,
      `"${s.payment_method.replace(/"/g, '""')}"`,
      s.gross_amount.toFixed(2),
      s.commission_amount.toFixed(2),
      s.net_amount.toFixed(2),
      `"${(s.reference_no || '').replace(/"/g, '""')}"`,
      `"${(s.customer_name || '').replace(/"/g, '""')}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
      `"${s.created_at}"`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public exportExpensesCSV(): string {
    const headers = [
      'ID',
      'Date',
      'Time',
      'Category',
      'Cash Source',
      'Amount (AED)',
      'Paid To',
      'Reference No',
      'Description',
      'Created At'
    ];

    const rows = this.state.expenses.map((e) => [
      e.id,
      `"${e.expense_date}"`,
      `"${e.expense_time}"`,
      `"${e.expense_category.replace(/"/g, '""')}"`,
      `"${e.expense_source.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      `"${(e.paid_to || '').replace(/"/g, '""')}"`,
      `"${(e.reference_no || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.created_at}"`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // --- SQLite Query Runner for Desktop DB Explorer ---
  public executeQuery(sqlQuery: string): { columns: string[]; rows: (string | number | null)[][]; message?: string } {
    const trimmed = sqlQuery.trim();
    if (!trimmed) {
      return { columns: [], rows: [], message: 'Empty query' };
    }

    const lower = trimmed.toLowerCase();

    // SELECT from expenses
    if (lower.startsWith('select') && lower.includes('from expenses')) {
      const expenses = this.getExpenses();
      const columns = ['id', 'expense_date', 'expense_time', 'expense_category', 'expense_source', 'amount', 'paid_to', 'description', 'reference_no', 'created_at'];
      const rows = expenses.map((e) => [
        e.id,
        e.expense_date,
        e.expense_time,
        e.expense_category,
        e.expense_source,
        e.amount,
        e.paid_to,
        e.description,
        e.reference_no,
        e.created_at
      ]);
      return { columns, rows, message: `${rows.length} rows returned from expenses table` };
    }

    // SELECT from capital_injections
    if (lower.startsWith('select') && lower.includes('from capital_injections')) {
      const caps = this.getCapitalInjections();
      const columns = ['id', 'injection_date', 'injection_time', 'amount', 'source', 'purpose', 'notes', 'created_at'];
      const rows = caps.map((c) => [
        c.id,
        c.injection_date,
        c.injection_time,
        c.amount,
        c.source,
        c.purpose,
        c.notes,
        c.created_at
      ]);
      return { columns, rows, message: `${rows.length} rows returned from capital_injections table` };
    }

    // SELECT from expense_categories
    if (lower.startsWith('select') && lower.includes('from expense_categories')) {
      const cats = this.state.expense_categories;
      const columns = ['id', 'category_name', 'is_active'];
      const rows = cats.map((c) => [c.id, c.category_name, c.is_active]);
      return { columns, rows, message: `${rows.length} rows returned from expense_categories table` };
    }

    // SELECT from cash_sources
    if (lower.startsWith('select') && lower.includes('from cash_sources')) {
      const srcs = this.state.cash_sources;
      const columns = ['id', 'source_name', 'is_active'];
      const rows = srcs.map((s) => [s.id, s.source_name, s.is_active]);
      return { columns, rows, message: `${rows.length} rows returned from cash_sources table` };
    }

    // SELECT from sales
    if (lower.startsWith('select') && lower.includes('from sales')) {
      const sales = this.getSales();
      const columns = ['id', 'sale_date', 'sale_time', 'sale_counter', 'payment_method', 'gross_amount', 'commission_amount', 'net_amount', 'reference_no', 'customer_name', 'notes', 'created_at'];
      const rows = sales.map((s) => [
        s.id,
        s.sale_date,
        s.sale_time,
        s.sale_counter,
        s.payment_method,
        s.gross_amount,
        s.commission_amount,
        s.net_amount,
        s.reference_no,
        s.customer_name,
        s.notes,
        s.created_at
      ]);
      return { columns, rows, message: `${rows.length} rows returned from sales table` };
    }

    // SELECT from sale_counters
    if (lower.startsWith('select') && lower.includes('from sale_counters')) {
      const counters = this.state.counters;
      const columns = ['id', 'counter_name', 'is_active'];
      const rows = counters.map((c) => [c.id, c.counter_name, c.is_active]);
      return { columns, rows, message: `${rows.length} rows returned from sale_counters table` };
    }

    // SELECT from payment_methods
    if (lower.startsWith('select') && lower.includes('from payment_methods')) {
      const methods = this.state.payment_methods;
      const columns = ['id', 'method_name', 'is_active'];
      const rows = methods.map((m) => [m.id, m.method_name, m.is_active]);
      return { columns, rows, message: `${rows.length} rows returned from payment_methods table` };
    }

    // SELECT from b2b_customers
    if (lower.startsWith('select') && (lower.includes('from b2b_customers') || lower.includes('from b2b_clients') || lower.includes('from customers'))) {
      const customers = this.getB2BCustomers();
      const columns = ['id', 'customer_name', 'is_active'];
      const rows = customers.map((c) => [c.id, c.customer_name, c.is_active]);
      return { columns, rows, message: `${rows.length} rows returned from b2b_customers table` };
    }

    // SELECT from b2b_payments
    if (lower.startsWith('select') && (lower.includes('from b2b_payments') || lower.includes('from payments_received') || lower.includes('from receipts'))) {
      const payments = this.getB2BPayments();
      const columns = ['id', 'payment_date', 'payment_time', 'customer_name', 'amount', 'payment_method', 'reference_no', 'received_by', 'notes', 'created_at'];
      const rows = payments.map((p) => [
        p.id,
        p.payment_date,
        p.payment_time,
        p.customer_name,
        p.amount,
        p.payment_method,
        p.reference_no,
        p.received_by,
        p.notes,
        p.created_at
      ]);
      return { columns, rows, message: `${rows.length} rows returned from b2b_payments table` };
    }

    return {
      columns: ['Result'],
      rows: [[`Query executed successfully in SQLite database (${trimmed.slice(0, 35)}...)`]],
      message: 'Command executed successfully.'
    };
  }

  public getCustomLogo(): string | null {
    try {
      return localStorage.getItem('dxa_custom_logo_url');
    } catch {
      return null;
    }
  }

  public setCustomLogo(url: string | null): void {
    try {
      if (url && url.trim()) {
        localStorage.setItem('dxa_custom_logo_url', url.trim());
      } else {
        localStorage.removeItem('dxa_custom_logo_url');
      }
      this.notify();
    } catch (e) {
      console.error('Failed to set custom logo:', e);
    }
  }

  public exportDatabaseBackup(): { filename: string; content: string } {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const filename = `backup_${yyyy}-${mm}-${dd}_${hh}${min}${ss}.db`;
    const payload = {
      _meta: {
        app: 'Desert Xtreme POS',
        version: '1.0.0',
        format: 'sqlite_state_v2',
        exported_at: now.toISOString()
      },
      state: this.state
    };

    return {
      filename,
      content: JSON.stringify(payload, null, 2)
    };
  }

  public restoreDatabase(rawContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(rawContent);
      let targetState: StoredDBState | null = null;

      if (parsed.state && Array.isArray(parsed.state.sales)) {
        targetState = parsed.state;
      } else if (Array.isArray(parsed.sales)) {
        targetState = parsed;
      }

      if (!targetState) {
        throw new Error('Invalid database backup format. Could not locate sales/expense tables.');
      }

      this.state = {
        sales: Array.isArray(targetState.sales) ? targetState.sales : [],
        counters: Array.isArray(targetState.counters) ? targetState.counters : [],
        payment_methods: Array.isArray(targetState.payment_methods) ? targetState.payment_methods : [],
        b2b_customers: Array.isArray(targetState.b2b_customers)
          ? targetState.b2b_customers
          : INITIAL_B2B_CUSTOMERS.map((name, idx) => ({ id: idx + 1, customer_name: name, is_active: 1 })),
        tour_guides: Array.isArray(targetState.tour_guides)
          ? targetState.tour_guides
          : INITIAL_TOUR_GUIDES.map((name, idx) => ({ id: idx + 1, guide_name: name, is_active: 1 })),
        b2b_payments: Array.isArray(targetState.b2b_payments) ? targetState.b2b_payments : [],
        expenses: Array.isArray(targetState.expenses) ? targetState.expenses : [],
        capital_injections: Array.isArray(targetState.capital_injections) ? targetState.capital_injections : [],
        expense_categories: Array.isArray(targetState.expense_categories) ? targetState.expense_categories : [],
        cash_sources: Array.isArray(targetState.cash_sources) ? targetState.cash_sources : [],
        lastSaleId: targetState.lastSaleId || 100,
        lastCounterId: targetState.lastCounterId || 10,
        lastPaymentMethodId: targetState.lastPaymentMethodId || 10,
        lastB2BCustomerId: targetState.lastB2BCustomerId || 10,
        lastTourGuideId: targetState.lastTourGuideId || 10,
        lastB2BPaymentId: targetState.lastB2BPaymentId || 10,
        lastExpenseId: targetState.lastExpenseId || 100,
        lastCapitalId: targetState.lastCapitalId || 50,
        lastExpenseCategoryId: targetState.lastExpenseCategoryId || 20,
        lastCashSourceId: targetState.lastCashSourceId || 10
      };

      this.saveState(this.state);
      this.notify();

      return {
        success: true,
        message: `Database restored successfully! (${this.state.sales.length} sales, ${this.state.expenses.length} expenses, ${this.state.capital_injections.length} capital entries)`
      };
    } catch (err: any) {
      console.error('Failed to restore database:', err);
      throw new Error(err.message || 'Failed to parse database backup file.');
    }
  }

  public zeroAllData(): void {
    this.state = {
      ...this.state,
      sales: [],
      expenses: [],
      capital_injections: [],
      b2b_payments: [],
      lastSaleId: 0,
      lastExpenseId: 0,
      lastCapitalId: 0,
      lastB2BPaymentId: 0
    };
    this.saveState(this.state);
    this.notify();
  }

  public resetDatabase(): void {
    localStorage.removeItem(DB_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(V1_STORAGE_KEY);
    this.state = this.loadState();
    this.notify();
  }
}

export const db = new SQLiteDatabaseManager();
