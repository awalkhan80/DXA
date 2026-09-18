import * as XLSX from 'xlsx';
import { ExpenseRecord, SaleRecord, CapitalInjectionRecord } from '../types';

// Standardized Filename Generator according to user spec: Report_Name_YYYY-MM-DD.xlsx
export function getExcelFilename(reportName: string): string {
  const today = new Date().toISOString().split('T')[0];
  const sanitized = reportName.replace(/\s+/g, '_');
  return `${sanitized}_${today}.xlsx`;
}

// 1. Single Day Quick Exports
export function exportTodaySalesToExcel(sales: SaleRecord[], targetDate?: string): void {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.sale_date === dateStr);
  const dataToExport = todaySales.length > 0 ? todaySales : sales;

  const totalGross = dataToExport.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalComm = dataToExport.reduce((sum, s) => sum + s.commission_amount, 0);
  const totalNet = dataToExport.reduce((sum, s) => sum + s.net_amount, 0);

  const sheetData: any[] = dataToExport.map((s) => ({
    'Date': s.sale_date,
    'Time': s.sale_time,
    'Counter': s.sale_counter,
    'Payment Method': s.payment_method,
    'Customer / Reference': s.customer_name || s.reference_no || '-',
    'Gross (AED)': Number(s.gross_amount.toFixed(2)),
    'Commission (AED)': Number(s.commission_amount.toFixed(2)),
    'Net (AED)': Number(s.net_amount.toFixed(2))
  }));

  // Append formatted Totals row
  sheetData.push({
    'Date': 'TOTAL',
    'Time': `${dataToExport.length} transactions`,
    'Counter': '',
    'Payment Method': '',
    'Customer / Reference': '',
    'Gross (AED)': Number(totalGross.toFixed(2)),
    'Commission (AED)': Number(totalComm.toFixed(2)),
    'Net (AED)': Number(totalNet.toFixed(2))
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Sales");
  XLSX.writeFile(workbook, getExcelFilename('Daily_Sales'));
}

export function exportTodayExpensesToExcel(expenses: ExpenseRecord[], targetDate?: string): void {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];
  const todayExpenses = expenses.filter((e) => e.expense_date === dateStr);
  const dataToExport = todayExpenses.length > 0 ? todayExpenses : expenses;
  const totalExpenses = dataToExport.reduce((sum, e) => sum + e.amount, 0);

  const sheetData: any[] = dataToExport.map((e) => ({
    'Date': e.expense_date,
    'Time': e.expense_time,
    'Category': e.expense_category,
    'Cash Source': e.expense_source,
    'Amount (AED)': Number(e.amount.toFixed(2)),
    'Paid To': e.paid_to || '',
    'Reference No': e.reference_no || '',
    'Description': e.description || ''
  }));

  sheetData.push({
    'Date': 'TOTAL',
    'Time': `${dataToExport.length} records`,
    'Category': '',
    'Cash Source': '',
    'Amount (AED)': Number(totalExpenses.toFixed(2)),
    'Paid To': '',
    'Reference No': '',
    'Description': ''
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Expenses");
  XLSX.writeFile(workbook, getExcelFilename('Daily_Expenses'));
}

// 2. REPORT 1: CASH FLOW EXCEL EXPORT
export function exportCashFlowReportToExcel(
  fromDate: string,
  toDate: string,
  totalSalesNet: number,
  totalOwnerCapital: number,
  totalCashIn: number,
  totalExpenses: number,
  netCashPosition: number,
  salesList: SaleRecord[],
  capitalList: CapitalInjectionRecord[],
  expensesList: ExpenseRecord[]
): void {
  const workbook = XLSX.utils.book_new();

  const cashSalesGross = salesList.filter(s => s.payment_method === 'Cash').reduce((sum, s) => sum + s.gross_amount, 0);
  const cardSalesGross = salesList.filter(s => s.payment_method === 'Card').reduce((sum, s) => sum + s.gross_amount, 0);
  const commissionsPaidCash = salesList.reduce((sum, s) => sum + s.commission_amount, 0);
  const expensesFromCash = expensesList.filter(e => e.expense_source === 'Daily Sales Cash' || e.expense_source === 'Petty Cash Box').reduce((sum, e) => sum + e.amount, 0);

  // Sheet 1: Summary with formatted headers and totals
  const summaryData = [
    ['DESERT XTREME ADVENTURE - STATEMENT OF CASH FLOW'],
    [`Period: ${fromDate || 'All Records'} to ${toDate || 'Present'}`],
    [`Generated On: ${new Date().toLocaleString()}`],
    [],
    ['CATEGORY / SECTION', 'DETAILS', 'AMOUNT (AED)'],
    ['1. PHYSICAL CASH INFLOW', 'Direct Cash Sales (Gross)', Number(cashSalesGross.toFixed(2))],
    ['1. PHYSICAL CASH INFLOW', 'Owner Capital Injections', Number(totalOwnerCapital.toFixed(2))],
    ['1. PHYSICAL CASH INFLOW', 'TOTAL PHYSICAL CASH IN', Number((cashSalesGross + totalOwnerCapital).toFixed(2))],
    [],
    ['2. PHYSICAL CASH OUTFLOW', 'Guide/Driver Commissions (Paid in Cash from Drawer)', Number(commissionsPaidCash.toFixed(2))],
    ['2. PHYSICAL CASH OUTFLOW', 'Cash Drawer & Petty Cash Expenses', Number(expensesFromCash.toFixed(2))],
    ['2. PHYSICAL CASH OUTFLOW', 'TOTAL PHYSICAL CASH OUT', Number((commissionsPaidCash + expensesFromCash).toFixed(2))],
    [],
    ['3. NET CASH IN HAND', 'Physical Safe Drawer Balance (Cash In - Cash Out)', Number(netCashPosition.toFixed(2))],
    [],
    ['4. DIGITAL / BANK SETTLEMENTS', 'Card Sales Terminal Revenue (Gross)', Number(cardSalesGross.toFixed(2))],
    ['5. CONSOLIDATED SUMMARY', 'Total Net Operating Income (All Channels)', Number((totalSalesNet + totalOwnerCapital - totalExpenses).toFixed(2))],
    ['AUDIT STATUS', netCashPosition >= 0 ? 'SURPLUS / POSITIVE CASH FLOW' : 'DEFICIT / REVIEW REQUIRED', '']
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 24 }, { wch: 32 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Cash Flow Summary');

  // Sheet 2: Inflow Details
  const inflowData: any[] = [
    ...salesList.map((s) => ({
      'Transaction Type': 'Customer Sale',
      'Date': s.sale_date,
      'Time': s.sale_time,
      'Counter / Source': s.sale_counter,
      'Payment Method': s.payment_method,
      'Gross Amount': Number(s.gross_amount.toFixed(2)),
      'Commission': Number(s.commission_amount.toFixed(2)),
      'Net Amount (AED)': Number(s.net_amount.toFixed(2))
    })),
    ...capitalList.map((c) => ({
      'Transaction Type': 'Owner Injection',
      'Date': c.injection_date,
      'Time': c.injection_time || '',
      'Counter / Source': 'Equity Deposit',
      'Payment Method': c.purpose || 'Owner Capital',
      'Gross Amount': Number(c.amount.toFixed(2)),
      'Commission': 0,
      'Net Amount (AED)': Number(c.amount.toFixed(2))
    }))
  ];

  if (inflowData.length > 0) {
    inflowData.push({
      'Transaction Type': 'TOTAL INFLOWS',
      'Date': '',
      'Time': `${inflowData.length} records`,
      'Counter / Source': '',
      'Payment Method': '',
      'Gross Amount': '',
      'Commission': '',
      'Net Amount (AED)': Number(totalCashIn.toFixed(2))
    });

    const inflowSheet = XLSX.utils.json_to_sheet(inflowData);
    inflowSheet['!cols'] = [
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 24 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(workbook, inflowSheet, 'Cash Inflows Detail');
  }

  // Sheet 3: Expenses Detail
  if (expensesList.length > 0) {
    const expensesSheetData: any[] = expensesList.map((e) => ({
      'Date': e.expense_date,
      'Time': e.expense_time,
      'Category': e.expense_category,
      'Cash Source': e.expense_source,
      'Amount (AED)': Number(e.amount.toFixed(2)),
      'Paid To': e.paid_to || '',
      'Reference No': e.reference_no || '',
      'Description': e.description || ''
    }));

    expensesSheetData.push({
      'Date': 'TOTAL EXPENSES',
      'Time': `${expensesList.length} expenses`,
      'Category': '',
      'Cash Source': '',
      'Amount (AED)': Number(totalExpenses.toFixed(2)),
      'Paid To': '',
      'Reference No': '',
      'Description': ''
    });

    const expensesSheet = XLSX.utils.json_to_sheet(expensesSheetData);
    expensesSheet['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 24 },
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
      { wch: 16 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses Detail');
  }

  // Standardized filename: Report_Name_YYYY-MM-DD.xlsx
  XLSX.writeFile(workbook, getExcelFilename('CashFlow_Report'));
}

// 3. REPORT 2: TOTAL SALES REPORT EXCEL EXPORT
export function exportSalesReportToExcel(
  fromDate: string,
  toDate: string,
  salesList: SaleRecord[]
): void {
  const workbook = XLSX.utils.book_new();

  const totalGross = salesList.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalComm = salesList.reduce((sum, s) => sum + s.commission_amount, 0);
  const totalNet = salesList.reduce((sum, s) => sum + s.net_amount, 0);

  const rows: any[] = salesList.map((s) => ({
    'Date': s.sale_date,
    'Time': s.sale_time,
    'Counter': s.sale_counter,
    'Payment Method': s.payment_method,
    'Gross Amount (AED)': Number(s.gross_amount.toFixed(2)),
    'Commission (AED)': Number(s.commission_amount.toFixed(2)),
    'Net Amount (AED)': Number(s.net_amount.toFixed(2)),
    'Customer': s.customer_name || '',
    'Ref #': s.reference_no || '',
    'Notes / Details': s.notes || ''
  }));

  // Totals row
  rows.push({
    'Date': 'TOTAL',
    'Time': `${salesList.length} transactions`,
    'Counter': '',
    'Payment Method': '',
    'Gross Amount (AED)': Number(totalGross.toFixed(2)),
    'Commission (AED)': Number(totalComm.toFixed(2)),
    'Net Amount (AED)': Number(totalNet.toFixed(2)),
    'Customer': '',
    'Ref #': '',
    'Notes / Details': ''
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
  XLSX.writeFile(workbook, getExcelFilename('Total_Sales_Report'));
}

// 4. REPORT 3: EXPENSE REPORT EXCEL EXPORT
export function exportExpensesReportToExcel(
  fromDate: string,
  toDate: string,
  expensesList: ExpenseRecord[]
): void {
  const workbook = XLSX.utils.book_new();
  const totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0);

  const rows: any[] = expensesList.map((e) => ({
    'Date': e.expense_date,
    'Time': e.expense_time,
    'Category': e.expense_category,
    'Cash Source': e.expense_source,
    'Amount (AED)': Number(e.amount.toFixed(2)),
    'Paid To': e.paid_to || '',
    'Reference No': e.reference_no || '',
    'Description': e.description || ''
  }));

  rows.push({
    'Date': 'TOTAL EXPENSES',
    'Time': `${expensesList.length} records`,
    'Category': '',
    'Cash Source': '',
    'Amount (AED)': Number(totalExpenses.toFixed(2)),
    'Paid To': '',
    'Reference No': '',
    'Description': ''
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 18 },
    { wch: 32 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses Report');
  XLSX.writeFile(workbook, getExcelFilename('Expenses_Report'));
}

// 5. REPORT 4: COUNTER SALES REPORT EXCEL EXPORT
export function exportCounterSalesReportToExcel(
  fromDate: string,
  toDate: string,
  counterSummary: Array<{
    counter: string;
    count: number;
    gross: number;
    commission: number;
    net: number;
    pctOfTotal: number;
  }>
): void {
  const workbook = XLSX.utils.book_new();

  const totalCount = counterSummary.reduce((sum, c) => sum + c.count, 0);
  const totalGross = counterSummary.reduce((sum, c) => sum + c.gross, 0);
  const totalComm = counterSummary.reduce((sum, c) => sum + c.commission, 0);
  const totalNet = counterSummary.reduce((sum, c) => sum + c.net, 0);

  const rows: any[] = counterSummary.map((c) => ({
    'Counter Name': c.counter,
    'Total Transactions': c.count,
    'Gross Amount (AED)': Number(c.gross.toFixed(2)),
    'Commission Amount (AED)': Number(c.commission.toFixed(2)),
    'Net Amount (AED)': Number(c.net.toFixed(2)),
    'Share of Total Revenue (%)': Number(c.pctOfTotal.toFixed(1))
  }));

  rows.push({
    'Counter Name': 'TOTAL',
    'Total Transactions': totalCount,
    'Gross Amount (AED)': Number(totalGross.toFixed(2)),
    'Commission Amount (AED)': Number(totalComm.toFixed(2)),
    'Net Amount (AED)': Number(totalNet.toFixed(2)),
    'Share of Total Revenue (%)': 100
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 26 },
    { wch: 18 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 26 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Counter Performance');
  XLSX.writeFile(workbook, getExcelFilename('Counter_Wise_Sales_Report'));
}

// 6. B2B SALES REPORT EXCEL EXPORT
export function exportB2BSalesReportToExcel(
  fromDate: string,
  toDate: string,
  b2bSales: SaleRecord[],
  partnerSummary: Array<{
    partner: string;
    count: number;
    gross: number;
    commission: number;
    net: number;
    pctOfTotal: number;
  }>
): void {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const totalCount = partnerSummary.reduce((sum, p) => sum + p.count, 0);
  const totalGross = partnerSummary.reduce((sum, p) => sum + p.gross, 0);
  const totalComm = partnerSummary.reduce((sum, p) => sum + p.commission, 0);
  const totalNet = partnerSummary.reduce((sum, p) => sum + p.net, 0);

  const summaryRows: any[] = partnerSummary.map((p) => ({
    'B2B Tour Operator': p.partner,
    'Vouchers / Bookings': p.count,
    'Gross Billed (AED)': Number(p.gross.toFixed(2)),
    'Commission (AED)': Number(p.commission.toFixed(2)),
    'Net Invoiced (AED)': Number(p.net.toFixed(2)),
    'Share of Total B2B (%)': Number(p.pctOfTotal.toFixed(1))
  }));

  summaryRows.push({
    'B2B Tour Operator': 'TOTAL B2B SALES',
    'Vouchers / Bookings': totalCount,
    'Gross Billed (AED)': Number(totalGross.toFixed(2)),
    'Commission (AED)': Number(totalComm.toFixed(2)),
    'Net Invoiced (AED)': Number(totalNet.toFixed(2)),
    'Share of Total B2B (%)': 100
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'B2B Partners Summary');

  // Detailed Register Sheet
  const registerRows: any[] = b2bSales.map((s) => ({
    'Date': s.sale_date,
    'Time': s.sale_time,
    'Ref / Voucher #': s.reference_no || `DXA-${s.id}`,
    'Tour Operator / Partner': s.customer_name || 'B2B Partner',
    'Counter / Activity': s.sale_counter,
    'Tour Guide': s.guide_name || '-',
    'Gross (AED)': Number(s.gross_amount.toFixed(2)),
    'Commission (AED)': Number(s.commission_amount.toFixed(2)),
    'Net Amount (AED)': Number(s.net_amount.toFixed(2)),
    'Notes / Details': s.notes || ''
  }));

  registerRows.push({
    'Date': 'TOTAL',
    'Time': `${b2bSales.length} vouchers`,
    'Ref / Voucher #': '',
    'Tour Operator / Partner': '',
    'Counter / Activity': '',
    'Tour Guide': '',
    'Gross (AED)': Number(totalGross.toFixed(2)),
    'Commission (AED)': Number(totalComm.toFixed(2)),
    'Net Amount (AED)': Number(totalNet.toFixed(2)),
    'Notes / Details': ''
  });

  const wsRegister = XLSX.utils.json_to_sheet(registerRows);
  wsRegister['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 26 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsRegister, 'B2B Detailed Register');

  XLSX.writeFile(workbook, getExcelFilename('B2B_Sales_Report'));
}

// 7. B2B CUSTOMER LEDGER STATEMENT EXCEL EXPORT
export function exportB2BCustomerLedgerToExcel(
  partnerName: string,
  fromDate: string,
  toDate: string,
  sales: SaleRecord[],
  payments: import('../types').B2BPaymentRecord[] = []
): void {
  const workbook = XLSX.utils.book_new();

  const totalDebit = sales.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalCreditCommission = sales.reduce((sum, s) => sum + s.commission_amount, 0);
  const netInvoiced = sales.reduce((sum, s) => sum + s.net_amount, 0);
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const netOutstanding = Math.round((netInvoiced - totalReceived) * 100) / 100;

  // Build merged chronological items
  const mergedItems: Array<{
    date: string;
    time: string;
    type: string;
    refNo: string;
    description: string;
    guideOrChannel: string;
    debit: number;
    credit: number;
    netChange: number;
    notes: string;
  }> = [];

  sales.forEach(s => {
    mergedItems.push({
      date: s.sale_date,
      time: s.sale_time || '00:00:00',
      type: 'Sale Voucher',
      refNo: s.reference_no || `DXA-${s.id}`,
      description: s.sale_counter,
      guideOrChannel: s.guide_name || '-',
      debit: s.gross_amount,
      credit: s.commission_amount,
      netChange: s.net_amount,
      notes: s.notes || ''
    });
  });

  payments.forEach(p => {
    mergedItems.push({
      date: p.payment_date,
      time: p.payment_time || '00:00:00',
      type: 'Payment Received',
      refNo: p.reference_no || `REC-${p.id}`,
      description: `Payment Received (${p.payment_method})`,
      guideOrChannel: p.received_by || p.payment_method,
      debit: 0,
      credit: p.amount,
      netChange: -p.amount,
      notes: p.notes || `Settled via ${p.payment_method}`
    });
  });

  mergedItems.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  let runningBalance = 0;
  const rows: any[] = mergedItems.map(item => {
    runningBalance += item.netChange;
    return {
      'Date': item.date,
      'Time': item.time,
      'Transaction Type': item.type,
      'Voucher / Ref #': item.refNo,
      'Activity / Description': item.description,
      'Guide / Received By': item.guideOrChannel,
      'Debit / Charge (AED)': item.debit > 0 ? Number(item.debit.toFixed(2)) : 0,
      'Credit / Paid (AED)': item.credit > 0 ? Number(item.credit.toFixed(2)) : 0,
      'Net Change (AED)': Number(item.netChange.toFixed(2)),
      'Running Balance (AED)': Number(runningBalance.toFixed(2)),
      'Remarks': item.notes
    };
  });

  rows.push({
    'Date': 'TOTAL STATEMENT',
    'Time': `${sales.length} vouchers, ${payments.length} receipts`,
    'Transaction Type': '',
    'Voucher / Ref #': '',
    'Activity / Description': '',
    'Guide / Received By': '',
    'Debit / Charge (AED)': Number(totalDebit.toFixed(2)),
    'Credit / Paid (AED)': Number((totalCreditCommission + totalReceived).toFixed(2)),
    'Net Change (AED)': Number(netInvoiced.toFixed(2)),
    'Running Balance (AED)': Number(netOutstanding.toFixed(2)),
    'Remarks': `Net Outstanding Balance for ${partnerName || 'Consolidated'}: AED ${netOutstanding.toFixed(2)}`
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 28 }
  ];

  const sheetTitle = partnerName ? `${partnerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}_Ledger` : 'B2B_Customer_Ledger';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);
  XLSX.writeFile(workbook, getExcelFilename(`B2B_Ledger_${partnerName || 'All_Partners'}`));
}

// 8. B2C SALES REPORT EXCEL EXPORT
export function exportB2CSalesReportToExcel(
  fromDate: string,
  toDate: string,
  b2cSales: SaleRecord[],
  counterSummary: Array<{
    counter: string;
    count: number;
    gross: number;
    commission: number;
    net: number;
    pctOfTotal: number;
  }>
): void {
  const workbook = XLSX.utils.book_new();

  const totalCount = b2cSales.length;
  const totalGross = b2cSales.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalComm = b2cSales.reduce((sum, s) => sum + s.commission_amount, 0);
  const totalNet = b2cSales.reduce((sum, s) => sum + s.net_amount, 0);

  // Counter Summary Sheet
  const counterRows: any[] = counterSummary.map((c) => ({
    'Retail Counter': c.counter,
    'Transactions': c.count,
    'Gross Sales (AED)': Number(c.gross.toFixed(2)),
    'Commissions (AED)': Number(c.commission.toFixed(2)),
    'Net Income (AED)': Number(c.net.toFixed(2)),
    'Share of Total B2C (%)': Number(c.pctOfTotal.toFixed(1))
  }));

  counterRows.push({
    'Retail Counter': 'TOTAL B2C RETAIL',
    'Transactions': totalCount,
    'Gross Sales (AED)': Number(totalGross.toFixed(2)),
    'Commissions (AED)': Number(totalComm.toFixed(2)),
    'Net Income (AED)': Number(totalNet.toFixed(2)),
    'Share of Total B2C (%)': 100
  });

  const wsSummary = XLSX.utils.json_to_sheet(counterRows);
  wsSummary['!cols'] = [
    { wch: 26 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'B2C Counter Summary');

  // Detailed Register Sheet
  const registerRows: any[] = b2cSales.map((s) => ({
    'Date': s.sale_date,
    'Time': s.sale_time,
    'Ref / Voucher #': s.reference_no || `DXA-${s.id}`,
    'Counter': s.sale_counter,
    'Payment Method': s.payment_method,
    'Guest / Customer': s.customer_name || 'Walk-in Guest',
    'Tour Guide': s.guide_name || '-',
    'Gross (AED)': Number(s.gross_amount.toFixed(2)),
    'Commission (AED)': Number(s.commission_amount.toFixed(2)),
    'Net (AED)': Number(s.net_amount.toFixed(2)),
    'Notes / Details': s.notes || ''
  }));

  registerRows.push({
    'Date': 'TOTAL',
    'Time': `${totalCount} sales`,
    'Ref / Voucher #': '',
    'Counter': '',
    'Payment Method': '',
    'Guest / Customer': '',
    'Tour Guide': '',
    'Gross (AED)': Number(totalGross.toFixed(2)),
    'Commission (AED)': Number(totalComm.toFixed(2)),
    'Net (AED)': Number(totalNet.toFixed(2)),
    'Notes / Details': ''
  });

  const wsRegister = XLSX.utils.json_to_sheet(registerRows);
  wsRegister['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsRegister, 'B2C Sales Register');

  XLSX.writeFile(workbook, getExcelFilename('B2C_Sales_Report'));
}
