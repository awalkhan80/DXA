import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleRecord, ExpenseRecord } from '../types';
import { formatAED } from './utils';

// Helper to get formatted filename Report_Name_YYYY-MM-DD.pdf
export function getPdfFilename(reportName: string): string {
  const today = new Date().toISOString().split('T')[0];
  const sanitized = reportName.replace(/\s+/g, '_');
  return `${sanitized}_${today}.pdf`;
}

// Add company header with Desert Xtreme Adventure branding
function addCompanyHeader(
  doc: jsPDF,
  title: string,
  fromDate: string,
  toDate: string,
  isLandscape = false
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Background header band
  doc.setFillColor(45, 49, 66); // #2D3142 Desert Xtreme Charcoal
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent line
  doc.setFillColor(255, 107, 53); // #FF6B35 Orange Accent
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DESERT XTREME ADVENTURE', 14, 13);

  // Subtitle / Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(240, 240, 240);
  doc.text('Premium Tourism, Dune Safari & Adventure Operations • Dubai / UAE', 14, 20);

  // Report Title (Right-aligned in header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 190, 150);
  doc.text(title.toUpperCase(), pageWidth - 14, 13, { align: 'right' });

  // Date range info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);
  const dateText = `Period: ${fromDate || 'All Records'} to ${toDate || 'Present'}`;
  doc.text(dateText, pageWidth - 14, 20, { align: 'right' });

  // Generated timestamp in body header
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const genText = `Generated on: ${new Date().toLocaleString()} | Official Audit Copy`;
  doc.text(genText, 14, 36);
}

// 1. CASH FLOW REPORT PDF
export function exportCashFlowPdf(
  fromDate: string,
  toDate: string,
  totalSalesNet: number,
  totalOwnerCapital: number,
  totalCashIn: number,
  totalExpenses: number,
  netCashPosition: number,
  expensesByCategory: Record<string, number>,
  expensesBySource: Record<string, number>
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  addCompanyHeader(doc, 'Statement of Cash Flow', fromDate, toDate);

  // Summary Metrics Table
  autoTable(doc, {
    startY: 42,
    head: [['Cash Flow Section', 'Details / Origin', 'Amount (AED)']],
    body: [
      ['1. PHYSICAL CASH INFLOW', 'Direct Cash Sales & Capital Deposits', formatAED(totalCashIn)],
      ['2. PHYSICAL CASH OUTFLOW', 'Guide Commissions Paid in Cash + Cash Expenses', formatAED(totalCashIn - netCashPosition)],
      ['3. NET CASH IN HAND (DRAWER)', 'Physical Safe Drawer Balance (Cash In - Out)', formatAED(netCashPosition)],
      ['TOTAL OPERATIONAL EXPENSES', 'All sources (Drawer cash, bank, terminal)', formatAED(totalExpenses)],
      ['CONSOLIDATED NET OPERATING', 'Total Sales Net + Capital - All Expenses', formatAED(totalSalesNet + totalOwnerCapital - totalExpenses)]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [45, 49, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { fontStyle: 'bold', halign: 'right', cellWidth: 40 }
    },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fillColor = [220, 245, 230];
        data.cell.styles.textColor = [16, 120, 60];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 1) {
        data.cell.styles.fillColor = [254, 235, 235];
        data.cell.styles.textColor = [190, 30, 30];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 2) {
        const isPositive = netCashPosition >= 0;
        data.cell.styles.fillColor = isPositive ? [200, 240, 215] : [254, 220, 220];
        data.cell.styles.textColor = isPositive ? [10, 100, 45] : [180, 20, 20];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Category Breakdown table
  const catRows = Object.entries(expensesByCategory).map(([cat, amt]) => [
    cat,
    formatAED(amt),
    totalExpenses > 0 ? `${((amt / totalExpenses) * 100).toFixed(1)}%` : '0%'
  ]);

  const finalY1 = (doc as any).lastAutoTable?.finalY || 100;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 49, 66);
  doc.text('Expenses by Category', 14, finalY1 + 10);

  autoTable(doc, {
    startY: finalY1 + 13,
    head: [['Expense Category', 'Total Spent (AED)', 'Share of Outflow']],
    body: [
      ...catRows,
      ['TOTAL EXPENSES', formatAED(totalExpenses), '100%']
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'normal' },
      1: { halign: 'right', fontStyle: 'bold' },
      2: { halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === catRows.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 245, 245];
      }
    }
  });

  // Cash Source Table
  const srcRows = Object.entries(expensesBySource).map(([src, amt]) => [
    src,
    formatAED(amt),
    totalExpenses > 0 ? `${((amt / totalExpenses) * 100).toFixed(1)}%` : '0%'
  ]);

  const finalY2 = (doc as any).lastAutoTable?.finalY || 180;
  if (finalY2 < 230) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 49, 66);
    doc.text('Expenses by Cash Disbursement Source', 14, finalY2 + 10);

    autoTable(doc, {
      startY: finalY2 + 13,
      head: [['Disbursement Account / Cash Source', 'Amount Drawn (AED)', '% of Total Outflow']],
      body: [
        ...srcRows,
        ['TOTAL EXPENSES DRAWN', formatAED(totalExpenses), '100%']
      ],
      theme: 'grid',
      headStyles: { fillColor: [45, 49, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'normal' },
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.index === srcRows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [245, 245, 245];
        }
      }
    });
  }

  doc.save(getPdfFilename('CashFlow_Report'));
}

// 2. TOTAL SALES REPORT PDF (Landscape for tabular width)
export function exportSalesPdf(
  fromDate: string,
  toDate: string,
  salesList: SaleRecord[],
  totalGross: number,
  totalCommission: number,
  totalNet: number,
  paymentBreakdown: Record<string, number>
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  addCompanyHeader(doc, 'Total Sales Audit Report', fromDate, toDate, true);

  const tableBody = salesList.map((s) => [
    s.sale_date,
    s.sale_time || '-',
    s.sale_counter,
    s.payment_method,
    s.customer_name || '-',
    formatAED(s.gross_amount),
    s.commission_amount > 0 ? formatAED(s.commission_amount) : '-',
    formatAED(s.net_amount)
  ]);

  // Add total footer row
  tableBody.push([
    'TOTALS',
    `${salesList.length} txns`,
    '-',
    '-',
    '-',
    formatAED(totalGross),
    formatAED(totalCommission),
    formatAED(totalNet)
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Date', 'Time', 'Counter', 'Method', 'Customer', 'Gross (AED)', 'Comm. (AED)', 'Net (AED)']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [45, 49, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 24 },
      1: { cellWidth: 18 },
      2: { fontStyle: 'bold', cellWidth: 48 },
      3: { cellWidth: 26 },
      4: { cellWidth: 40 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 28, textColor: [180, 50, 50] },
      7: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [16, 120, 60] }
    },
    didParseCell: (data) => {
      if (data.row.index === salesList.length) {
        data.cell.styles.fillColor = [240, 240, 245];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY < 175) {
    // Payment Method summary row at the bottom
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 49, 66);
    doc.text('Payment Method Summary:', 14, finalY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const b2bAmount = (paymentBreakdown['B2B'] || 0) + (paymentBreakdown['Car B2B'] || 0);
    const summaryText = `Cash: ${formatAED(paymentBreakdown['Cash'] || 0)}  |  Card: ${formatAED(paymentBreakdown['Card'] || 0)}  |  B2B: ${formatAED(b2bAmount)}`;
    doc.text(summaryText, 65, finalY + 8);
  }

  doc.save(getPdfFilename('Total_Sales_Report'));
}

// 3. EXPENSES REPORT PDF
export function exportExpensesPdf(
  fromDate: string,
  toDate: string,
  expensesList: ExpenseRecord[],
  totalExpenses: number,
  categorySummary: Record<string, number>,
  sourceSummary: Record<string, number>
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  addCompanyHeader(doc, 'Operational Expenses Report', fromDate, toDate, true);

  const tableBody = expensesList.map((e) => [
    e.expense_date,
    e.expense_time || '-',
    e.expense_category,
    e.expense_source,
    e.paid_to || '-',
    e.reference_no || '-',
    e.description || '-',
    formatAED(e.amount)
  ]);

  tableBody.push([
    'TOTAL EXPENSES',
    `${expensesList.length} items`,
    '-',
    '-',
    '-',
    '-',
    '-',
    formatAED(totalExpenses)
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Date', 'Time', 'Category', 'Spent From', 'Paid To', 'Ref #', 'Description', 'Amount (AED)']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [45, 49, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 24 },
      1: { cellWidth: 18 },
      2: { fontStyle: 'bold', cellWidth: 44 },
      3: { cellWidth: 36 },
      4: { cellWidth: 32 },
      5: { cellWidth: 26 },
      6: { cellWidth: 50 },
      7: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [180, 20, 20] }
    },
    didParseCell: (data) => {
      if (data.row.index === expensesList.length) {
        data.cell.styles.fillColor = [254, 235, 235];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  doc.save(getPdfFilename('Expenses_Report'));
}

// 4. COUNTER-WISE SALES REPORT PDF
export function exportCounterSalesPdf(
  fromDate: string,
  toDate: string,
  counterSummary: Array<{
    counter: string;
    count: number;
    gross: number;
    commission: number;
    net: number;
    pctOfTotal: number;
  }>,
  topCounter: { counter: string; pctOfTotal: number; net: number } | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  addCompanyHeader(doc, 'Counter-Wise Sales Audit', fromDate, toDate);

  const totalGross = counterSummary.reduce((s, c) => s + c.gross, 0);
  const totalComm = counterSummary.reduce((s, c) => s + c.commission, 0);
  const totalNet = counterSummary.reduce((s, c) => s + c.net, 0);
  const totalCount = counterSummary.reduce((s, c) => s + c.count, 0);

  const tableBody = counterSummary.map((c) => [
    c.counter,
    c.count.toString(),
    formatAED(c.gross),
    c.commission > 0 ? formatAED(c.commission) : '-',
    formatAED(c.net),
    `${c.pctOfTotal.toFixed(1)}%`
  ]);

  tableBody.push([
    'TOTAL',
    totalCount.toString(),
    formatAED(totalGross),
    totalComm > 0 ? formatAED(totalComm) : '-',
    formatAED(totalNet),
    '100%'
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Sales Counter', 'Trans.', 'Gross Sales', 'Comm.', 'Net Sales', '% Share']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [45, 49, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 24, textColor: [180, 50, 50] },
      4: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: [16, 120, 60] },
      5: { halign: 'right', cellWidth: 24, fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === counterSummary.length) {
        data.cell.styles.fillColor = [240, 240, 245];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  if (topCounter) {
    doc.setFillColor(255, 248, 240);
    doc.setDrawColor(255, 107, 53);
    doc.rect(14, finalY + 8, 182, 22, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 93, 4);
    doc.text('★ TOP PERFORMING COUNTER', 20, finalY + 16);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 49, 66);
    const highlight = `${topCounter.counter} generated ${formatAED(topCounter.net)} (${topCounter.pctOfTotal.toFixed(1)}% of total net sales)`;
    doc.text(highlight, 20, finalY + 23);
  }

  doc.save(getPdfFilename('Counter_Wise_Sales_Report'));
}

// 6. B2B SALES REPORT PDF EXPORT
export function exportB2BSalesPdf(
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
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addCompanyHeader(doc, 'B2B Sales & Agency Report', fromDate, toDate, true);

  const totalGross = b2bSales.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalComm = b2bSales.reduce((sum, s) => sum + s.commission_amount, 0);
  const totalNet = b2bSales.reduce((sum, s) => sum + s.net_amount, 0);

  // Summary Table First
  const summaryBody = partnerSummary.map(p => [
    p.partner,
    p.count.toString(),
    formatAED(p.gross),
    p.commission > 0 ? formatAED(p.commission) : '-',
    formatAED(p.net),
    `${p.pctOfTotal.toFixed(1)}%`
  ]);

  summaryBody.push([
    'TOTAL B2B REVENUE',
    b2bSales.length.toString(),
    formatAED(totalGross),
    totalComm > 0 ? formatAED(totalComm) : '-',
    formatAED(totalNet),
    '100%'
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['B2B Tour Operator / Partner', 'Vouchers', 'Gross Billed', 'Guide Comm.', 'Net Invoiced', '% Share']],
    body: summaryBody,
    theme: 'striped',
    headStyles: {
      fillColor: [255, 107, 53],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', textColor: [180, 50, 50] },
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 120, 60] },
      5: { halign: 'right' }
    }
  });

  const nextY = ((doc as any).lastAutoTable?.finalY || 100) + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 49, 66);
  doc.text('Itemized B2B Sales Register', 14, nextY);

  const detailBody = b2bSales.slice(0, 100).map(s => [
    s.sale_date,
    s.sale_time,
    s.reference_no || `DXA-${s.id}`,
    s.customer_name || 'B2B Partner',
    s.sale_counter,
    s.guide_name || '-',
    formatAED(s.gross_amount),
    s.commission_amount > 0 ? formatAED(s.commission_amount) : '-',
    formatAED(s.net_amount)
  ]);

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Date', 'Time', 'Voucher #', 'Partner', 'Activity / Counter', 'Guide', 'Gross', 'Comm.', 'Net']],
    body: detailBody,
    theme: 'grid',
    headStyles: {
      fillColor: [45, 49, 66],
      textColor: [255, 255, 255]
    },
    styles: {
      fontSize: 7.5
    },
    columnStyles: {
      6: { halign: 'right' },
      7: { halign: 'right', textColor: [180, 50, 50] },
      8: { halign: 'right', fontStyle: 'bold', textColor: [16, 120, 60] }
    }
  });

  doc.save(getPdfFilename('B2B_Sales_Report'));
}

// 7. B2B CUSTOMER LEDGER STATEMENT PDF EXPORT
export function exportB2BCustomerLedgerPdf(
  partnerName: string,
  fromDate: string,
  toDate: string,
  sales: SaleRecord[],
  payments: import('../types').B2BPaymentRecord[] = []
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addCompanyHeader(doc, `Statement: ${partnerName || 'B2B Ledger'}`, fromDate, toDate, false);

  const totalDebit = sales.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalCreditCommission = sales.reduce((sum, s) => sum + s.commission_amount, 0);
  const netInvoiced = sales.reduce((sum, s) => sum + s.net_amount, 0);
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const netOutstanding = Math.round((netInvoiced - totalReceived) * 100) / 100;

  // Statement Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 42, 182, 24, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ACCOUNT HOLDER:', 20, 49);
  doc.text('NET INVOICED:', 75, 49);
  doc.text('PAYMENTS RECEIVED:', 125, 49);

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(partnerName || 'All B2B Partners', 20, 58);
  doc.text(formatAED(netInvoiced), 75, 58);
  doc.setTextColor(16, 120, 60);
  doc.text(formatAED(totalReceived), 125, 58);

  // Net Balance Callout
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.rect(14, 69, 182, 16, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(194, 65, 12);
  doc.text('NET OUTSTANDING BALANCE DUE:', 20, 79);
  doc.setFontSize(13);
  doc.setTextColor(netOutstanding > 0 ? 234 : 16, netOutstanding > 0 ? 88 : 120, netOutstanding > 0 ? 12 : 60);
  doc.text(formatAED(netOutstanding), 140, 79);

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
  }> = [];

  sales.forEach(s => {
    mergedItems.push({
      date: s.sale_date,
      time: s.sale_time || '00:00:00',
      type: 'Voucher',
      refNo: s.reference_no || `DXA-${s.id}`,
      description: s.sale_counter,
      guideOrChannel: s.guide_name || '-',
      debit: s.gross_amount,
      credit: s.commission_amount,
      netChange: s.net_amount
    });
  });

  payments.forEach(p => {
    mergedItems.push({
      date: p.payment_date,
      time: p.payment_time || '00:00:00',
      type: 'Payment',
      refNo: p.reference_no || `REC-${p.id}`,
      description: `Payment (${p.payment_method})`,
      guideOrChannel: p.received_by || p.payment_method,
      debit: 0,
      credit: p.amount,
      netChange: -p.amount
    });
  });

  mergedItems.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  let running = 0;
  const tableBody = mergedItems.map(item => {
    running += item.netChange;
    return [
      item.date,
      item.type,
      item.refNo,
      item.description,
      item.guideOrChannel,
      item.debit > 0 ? formatAED(item.debit) : '-',
      item.credit > 0 ? formatAED(item.credit) : '-',
      (item.netChange >= 0 ? '+' : '') + formatAED(item.netChange),
      formatAED(running)
    ];
  });

  tableBody.push([
    'TOTAL',
    '',
    `${sales.length} vch, ${payments.length} rec`,
    '',
    '',
    formatAED(totalDebit),
    formatAED(totalCreditCommission + totalReceived),
    formatAED(netInvoiced),
    formatAED(netOutstanding)
  ]);

  autoTable(doc, {
    startY: 89,
    head: [['Date', 'Type', 'Ref #', 'Activity/Channel', 'Guide/By', 'Debit', 'Credit', 'Net', 'Balance']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [45, 49, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5
    },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right', textColor: [16, 120, 60] },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'right', fontStyle: 'bold' }
    }
  });

  doc.save(getPdfFilename(`B2B_Ledger_${partnerName || 'All_Partners'}`));
}

// 8. B2C SALES REPORT PDF EXPORT
export function exportB2CSalesPdf(
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
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addCompanyHeader(doc, 'B2C Retail & Direct Sales Report', fromDate, toDate, true);

  const totalGross = b2cSales.reduce((sum, s) => sum + s.gross_amount, 0);
  const totalComm = b2cSales.reduce((sum, s) => sum + s.commission_amount, 0);
  const totalNet = b2cSales.reduce((sum, s) => sum + s.net_amount, 0);

  // Counter Summary Table
  const counterBody = counterSummary.map(c => [
    c.counter,
    c.count.toString(),
    formatAED(c.gross),
    c.commission > 0 ? formatAED(c.commission) : '-',
    formatAED(c.net),
    `${c.pctOfTotal.toFixed(1)}%`
  ]);

  counterBody.push([
    'TOTAL B2C RETAIL',
    b2cSales.length.toString(),
    formatAED(totalGross),
    totalComm > 0 ? formatAED(totalComm) : '-',
    formatAED(totalNet),
    '100%'
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['Retail Counter', 'Trans.', 'Gross Sales', 'Comm.', 'Net Income', '% Share']],
    body: counterBody,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', textColor: [180, 50, 50] },
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 120, 60] },
      5: { halign: 'right' }
    }
  });

  const nextY = ((doc as any).lastAutoTable?.finalY || 100) + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 49, 66);
  doc.text('Itemized Retail Sales Register', 14, nextY);

  const detailBody = b2cSales.slice(0, 100).map(s => [
    s.sale_date,
    s.sale_time,
    s.reference_no || `DXA-${s.id}`,
    s.sale_counter,
    s.payment_method,
    s.customer_name || 'Walk-in Guest',
    formatAED(s.gross_amount),
    s.commission_amount > 0 ? formatAED(s.commission_amount) : '-',
    formatAED(s.net_amount)
  ]);

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Date', 'Time', 'Voucher #', 'Counter', 'Method', 'Guest Name', 'Gross', 'Comm.', 'Net']],
    body: detailBody,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255]
    },
    styles: {
      fontSize: 7.5
    },
    columnStyles: {
      6: { halign: 'right' },
      7: { halign: 'right', textColor: [180, 50, 50] },
      8: { halign: 'right', fontStyle: 'bold', textColor: [16, 120, 60] }
    }
  });

  doc.save(getPdfFilename('B2C_Sales_Report'));
}
