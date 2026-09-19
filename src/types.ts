export type NavView = 
  | 'home-dashboard' 
  | 'sales-history' 
  | 'sales-new' 
  | 'expenses-history' 
  | 'expenses-add' 
  | 'reports-cashflow' 
  | 'b2b-settlements' 
  | 'customer-reports' 
  | 'credit-history' 
  | 'petty-cash' 
  | 'pending-expenses' 
  | 'vehicles';

export interface Vehicle {
  id: number;
  vehicle_id: string;
  vehicle_name: string;
  vehicle_category: 'Quad Bikes' | 'Polaris Vehicles' | 'Can-Am Vehicles' | 'Other Vehicles' | string;
  status: 'Available' | 'Rented' | 'In Use' | 'Maintenance' | 'Inactive';
  notes?: string | null;
  created_at: string;
}

export interface Customer {
  id: number;
  customer_name: string;
  customer_type?: 'B2C' | 'B2B' | 'Credit' | string;
  phone?: string | null;
  contact_number?: string | null;
  email?: string | null;
  company_name?: string | null;
  total_spent?: number;
  credit_balance?: number;
  notes?: string | null;
  created_at: string;
}

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
  contact_number?: string | null;
  guide_name?: string | null;
  sale_type?: 'B2B' | 'B2C';
  notes: string | null;
  duration?: string | null; // e.g., '30 Minutes', '1 Hour', '2 Hours', '3 Hours'
  vehicle_id?: string | null;
  vehicle_name?: string | null;
  vehicle_category?: string | null;
  ride_location?: string | null; // 'Inside' or 'Outside'
  is_credit?: boolean | number;
  bank_charge_percentage?: number;
  bank_charge_amount?: number;
  net_received_amount?: number;
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
  contact_number?: string;
  guide_name?: string;
  sale_type?: 'B2B' | 'B2C';
  notes: string;
  duration?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  vehicle_category?: string;
  ride_location?: string;
  is_credit?: boolean;
  bank_charge_percentage?: string | number;
  bank_charge_amount?: string | number;
  net_received_amount?: number;
}

// EXPENSE MODULE + OWNER CAPITAL
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

export interface PettyCashTransfer {
  id: number;
  transfer_type?: 'Transfer' | 'Return' | string;
  transfer_from_counter?: string;
  transfer_to_counter?: string;
  transferred_to?: string;
  amount: number;
  transfer_date: string;
  transfer_time: string;
  return_date?: string;
  reason?: string;
  notes?: string | null;
  created_by?: string;
  used_amount?: number;
  returned_amount?: number;
  remaining_balance?: number;
  status?: 'Completed' | 'Pending' | 'Returned' | 'Transferred' | 'Fully Returned' | 'Partially Returned' | string;
  created_at: string;
}

export interface CreditHistoryRecord {
  id: number;
  sale_id?: number;
  customer_name: string;
  company_name?: string | null;
  invoice_number?: string | null;
  reference_no?: string | null;
  credit_amount?: number;
  total_amount: number;
  credit_date?: string;
  invoice_date?: string;
  due_date?: string;
  paid_amount: number;
  remaining_amount: number;
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Outstanding' | 'Partial' | string;
  last_payment_date?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface PendingExpenseRecord {
  id: number;
  expense_title?: string;
  vendor_name?: string | null;
  supplier_name?: string | null;
  expense_category: string;
  description?: string | null;
  amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  created_date?: string;
  due_date?: string;
  status: 'Pending Payment' | 'Paid' | 'Pending' | 'Partial' | 'Partially Paid' | 'Unpaid' | string;
  notes?: string | null;
  created_at: string;
}

export interface ExpensePaymentRecord {
  id: number;
  pending_expense_id: number;
  payment_date: string;
  payment_method: string;
  paid_amount: number;
  reference_no?: string;
  notes?: string | null;
  created_at: string;
}

export interface CashFlowSummary {
  cashSales: number;
  cardSales: number;
  creditSales: number;
  b2bSales: number;
  b2bPaymentsReceived: number;
  b2bPaymentsCash: number;
  totalGrossSales: number;
  commissionsPaidCash: number;
  bankCharges: number;
  totalBankCharges?: number;
  netSalesIncome: number;
  totalOwnerCapital: number;
  expensesFromCash: number;
  expensesFromOther: number;
  totalExpenses: number;
  totalPendingCredit?: number;
  pendingCreditAmount?: number;
  totalPendingExpenses?: number;
  pendingExpensesAmount?: number;
  estimatedCashInDrawer: number; // (Cash Sales + b2bPaymentsCash + Owner Capital) - commissionsPaidCash - expensesFromCash
}

export interface SummaryMetrics {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  totalCard: number;
  totalCash: number;
  totalCredit: number;
  totalBankCharges: number;
  transactionCount: number;
  counterBreakdown: Record<string, { count: number; gross: number; net: number }>;
  paymentBreakdown: Record<string, { count: number; gross: number; net: number }>;
}


