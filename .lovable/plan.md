
# Enhanced Full Report PDF with Category Breakdown

## Overview

Add a professional "Expenses by Category" section to the Full Report PDF that groups and summarizes spending by category, giving users a clear view of where their money is going (e.g., Gas, Marketing, Office Supplies).

---

## What You'll Get

### New PDF Section: "Expenses by Category"

The enhanced Full Report will include:

1. **Summary Table by Category** - Shows each category with:
   - Category name
   - Number of transactions  
   - Total amount spent
   - Percentage of total expenses

2. **Category Detail Tables** - For each category:
   - Section header with category name and subtotal
   - Individual transactions within that category (Date, Title, Vendor, Amount)

---

## PDF Structure (Full Report)

```
Page 1:
┌─────────────────────────────────────────────────────┐
│  Company Name - Income & Expenses Report            │
│  Generated on: 2/2/2026 at 6:44:42 PM              │
│  Date Range: last-month                            │
├─────────────────────────────────────────────────────┤
│  [KPI Cards Screenshot]                             │
│  Total Inflow | Total Outflow | Net Cash Flow      │
├─────────────────────────────────────────────────────┤
│  [Charts Screenshot]                                │
│  Monthly Cash Flow | Category Breakdown             │
└─────────────────────────────────────────────────────┘

Page 2:  ← NEW SECTION
┌─────────────────────────────────────────────────────┐
│  EXPENSES BY CATEGORY                               │
├─────────────────────────────────────────────────────┤
│  Summary:                                           │
│  ┌──────────────┬───────┬───────────┬───────────┐  │
│  │ Category     │ Count │ Total     │ % of Total│  │
│  ├──────────────┼───────┼───────────┼───────────┤  │
│  │ GAS          │ 5     │ $450.00   │ 12.3%     │  │
│  │ Office       │ 3     │ $280.00   │ 7.6%      │  │
│  │ Marketing    │ 8     │ $1,540.00 │ 42.1%     │  │
│  │ ...          │       │           │           │  │
│  └──────────────┴───────┴───────────┴───────────┘  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ► GAS ($450.00)                                   │
│  ┌────────────┬──────────────┬──────────┬─────────┐│
│  │ Date       │ Title        │ Vendor   │ Amount  ││
│  ├────────────┼──────────────┼──────────┼─────────┤│
│  │ 1/12/2026  │ Shell Canada │ Shell    │ -$123.83││
│  │ 1/19/2026  │ GAS          │ Petro    │ -$50.00 ││
│  └────────────┴──────────────┴──────────┴─────────┘│
│                                                     │
│  ► Marketing ($1,540.00)                           │
│  ┌────────────┬──────────────┬──────────┬─────────┐│
│  │ Date       │ Title        │ Vendor   │ Amount  ││
│  │ ...        │              │          │         ││
│  └────────────┴──────────────┴──────────┴─────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘

Page 3+:
┌─────────────────────────────────────────────────────┐
│  Transactions (13 items)                            │
│  [Full Transaction Table - existing]                │
└─────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File to Modify
- `src/hooks/usePrintIncomeExpenses.ts`

### Changes

**1. Add Category Grouping Logic**

Group transactions by their parent category and calculate totals:

```typescript
// Group transactions by category
const groupedByCategory = transactions.reduce((acc, t) => {
  const categoryName = t.parent_category_name || 'Uncategorized';
  if (!acc[categoryName]) {
    acc[categoryName] = { transactions: [], total: 0 };
  }
  acc[categoryName].transactions.push(t);
  acc[categoryName].total += Math.abs(t.amount);
  return acc;
}, {} as Record<string, { transactions: TransactionWithHierarchy[]; total: number }>);
```

**2. Add Category Summary Table**

Insert after charts section, before main transactions table:

```typescript
// Category Summary Table
if (option === "full") {
  // Section header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Expenses by Category", 40, cursorY);
  cursorY += 20;
  
  // Summary table
  const categoryData = Object.entries(groupedByCategory)
    .sort((a, b) => b[1].total - a[1].total) // Sort by amount descending
    .map(([name, data]) => [
      name,
      data.transactions.length.toString(),
      `$${data.total.toFixed(2)}`,
      `${((data.total / totalExpenses) * 100).toFixed(1)}%`
    ]);

  autoTable(pdf, {
    startY: cursorY,
    head: [["Category", "# Items", "Total Amount", "% of Total"]],
    body: categoryData,
    // ... styling
  });
}
```

**3. Add Per-Category Detail Tables**

For each category, render a mini-table with its transactions:

```typescript
// Per-category detail tables
Object.entries(groupedByCategory)
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([categoryName, categoryData]) => {
    // Check for page break
    if (cursorY + 50 > pageHeight - 60) {
      pdf.addPage();
      cursorY = 48;
    }
    
    // Category header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(`${categoryName} ($${categoryData.total.toFixed(2)})`, 40, cursorY);
    cursorY += 8;
    
    // Category transactions table
    autoTable(pdf, {
      startY: cursorY,
      head: [["Date", "Title", "Vendor/Payee", "Amount"]],
      body: categoryData.transactions.map(t => [
        new Date(t.expense_date).toLocaleDateString(),
        t.expense_title,
        t.vendor_payee || "-",
        `-$${Math.abs(t.amount).toFixed(2)}`
      ]),
      // ... compact styling
    });
    
    cursorY = pdf.lastAutoTable.finalY + 15;
  });
```

**4. Enhanced Color Coding**

Each category section will have subtle color accents for visual distinction.

---

## Summary of Changes

| Component | Change |
|-----------|--------|
| `usePrintIncomeExpenses.ts` | Add category grouping logic and summary table |
| `usePrintIncomeExpenses.ts` | Add per-category detail tables with transactions |
| `usePrintIncomeExpenses.ts` | Add proper page break handling for multi-page reports |

---

## User Benefit

- **Clear spending visibility**: See exactly how much was spent on Gas, Marketing, Office Supplies, etc.
- **Percentage breakdown**: Understand which categories consume the most budget
- **Professional layout**: Organized sections with proper headers and formatting
- **Full transaction detail**: Still includes the complete transaction table at the end
