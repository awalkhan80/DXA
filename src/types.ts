export interface SaleRecord {
  id: number;
  sale_date: string;
  sale_time: string;
  sale_counter: string;
  payment_method: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  reference_no: string | null;
  customer_name: string | null;
  guide_name?: string | null;
  sale_type?: 'B2B' | 'B2C';
  notes: string | null;
  created_at: string;
}

export interface SaleCounter {
  id: number;
  counter_name: string;
  is_active: number;
}

export interface PaymentMethod {
  id: number;
  method_name: string;
  is_active: number;
}

export interface B2BCustomer {
  id: number;
  customer_name: string;
  is_active: number;
}

export interface TourGuide {
  id: number;
  guide_name: string;
  is_active: number;
}

// B2B Customer Payment Received / Settlement Record (Credit Recovery)
export interface B2BPaymentRecord {
  id: number;
  payment_date: string;
  payment_time: string;
  customer_name: string;
  amount: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Card' | string;
  reference_no: string | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface B2BPaymentFormData {
  payment_date: string;
  payment_time: string;
  customer_name: string;
  amount: string | number;
  payment_method: string;
  reference_no: string;
  received_by?: string;
  notes: string;
}

export interface SaleFormData {
  sale_date: string;
  sale_time: string;
  sale_counter: string;
  payment_method: string;
  gross_amount: string | number;
  commission_amount: string | number;
  net_amount: number;
  reference_no: string;
  customer_name: string;
  guide_name?: string;
  sale_type?: 'B2B' | 'B2C';
  notes: string;
}

// STEP 2: EXPENSE MODULE + OWNER CAPITAL
export interface ExpenseRecord {
  id: number;
  expense_date: string;
  expense_time: string;
  expense_category: string;
  expense_source: string; // Where cash was spent from
  amount: number;
  paid_to: string | null;
  description: string | null;
  reference_no: string | null;
  created_at: string;
}

export interface ExpenseFormData {
  expense_date: string;
  expense_time: string;
  expense_category: string;
  expense_source: string;
  amount: string | number;
  paid_to: string;
  description: string;
  reference_no: string;
}

export interface CapitalInjectionRecord {
  id: number;
  injection_date: string;
  injection_time: string;
  amount: number;
  source: string; // Default 'Owner Capital'
  purpose: string | null;
  notes: string | null;
  created_at: string;
}

export interface CapitalInjectionFormData {
  injection_date: string;
  injection_time: string;
  amount: string | number;
  source: string;
  purpose: string;
  notes: string;
}

export interface ExpenseCategory {
  id: number;
  category_name: string;
  is_active: number;
}

export interface CashSource {
  id: number;
  source_name: string;
  is_active: number;
}

export interface ExpenseMetrics {
  totalExpense: number;
  expenseCount: number;
  cashExpenses: number; // Spent specifically from 'Daily Sales Cash' or 'Petty Cash Box'
  categoryBreakdown: Record<string, { count: number; total: number }>;
  sourceBreakdown: Record<string, { count: number; total: number }>;
}

export interface CashFlowSummary {
  cashSales: number;
  cardSales: number;
  b2bSales: number;
  b2bPaymentsReceived: number;
  b2bPaymentsCash: number;
  totalGrossSales: number;
  commissionsPaidCash: number;
  netSalesIncome: number;
  totalOwnerCapital: number;
  expensesFromCash: number;
  expensesFromOther: number;
  totalExpenses: number;
  estimatedCashInDrawer: number; // (Cash Sales + b2bPaymentsCash + Owner Capital) - commissionsPaidCash - expensesFromCash
}

export interface SummaryMetrics {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  transactionCount: number;
  counterBreakdown: Record<string, { count: number; gross: number; net: number }>;
  paymentBreakdown: Record<string, { count: number; gross: number; net: number }>;
}

