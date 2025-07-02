import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialTakeoff } from '@/hooks/useMaterialTakeoffsEnhanced';

export const exportToExcel = (takeoffs: MaterialTakeoff[], filename: string = 'material-takeoffs') => {
  const data = takeoffs.map(takeoff => ({
    'Material Name': takeoff.material_name,
    'Unit': takeoff.unit,
    'Quantity Estimated': takeoff.total_qty_estimated,
    'Unit Price': takeoff.unit_price,
    'Subtotal': takeoff.subtotal,
    'Vendor': takeoff.vendor || '',
    'Category': takeoff.category || '',
    'Priority': takeoff.priority,
    'Jobsite': takeoff.jobsite_name || '',
    'Notes': takeoff.notes || '',
    'Created': new Date(takeoff.created_at).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  const colWidths = [
    { wch: 30 }, // Material Name
    { wch: 10 }, // Unit
    { wch: 15 }, // Quantity
    { wch: 12 }, // Unit Price
    { wch: 12 }, // Subtotal
    { wch: 20 }, // Vendor
    { wch: 15 }, // Category
    { wch: 8 },  // Priority
    { wch: 20 }, // Jobsite
    { wch: 30 }, // Notes
    { wch: 12 }, // Created
  ];
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Material Takeoffs');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (
  takeoffs: MaterialTakeoff[], 
  companyName: string = 'Construction Company',
  filename: string = 'material-takeoffs'
) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
  
  // Add header
  doc.setFontSize(20);
  doc.text(companyName, 20, 20);
  doc.setFontSize(16);
  doc.text('Material Takeoff Report', 20, 30);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
  doc.text(`Total Items: ${takeoffs.length}`, 20, 45);
  
  // Calculate totals
  const totalEstimated = takeoffs.reduce((sum, item) => sum + item.subtotal, 0);
  
  doc.text(`Total Estimated Value: $${totalEstimated.toFixed(2)}`, 150, 40);

  // Prepare table data
  const tableData = takeoffs.map(takeoff => [
    takeoff.material_name,
    takeoff.unit,
    takeoff.total_qty_estimated.toString(),
    `$${takeoff.unit_price.toFixed(2)}`,
    `$${takeoff.subtotal.toFixed(2)}`,
    takeoff.vendor || '-',
    takeoff.category || '-',
    takeoff.jobsite_name || '-',
  ]);

  // Add table
  autoTable(doc, {
    head: [['Material', 'Unit', 'Qty Est.', 'Unit Price', 'Subtotal', 'Vendor', 'Category', 'Jobsite']],
    body: tableData,
    startY: 55,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 45 }, // Material
      1: { cellWidth: 15 }, // Unit
      2: { cellWidth: 20 }, // Qty Est
      3: { cellWidth: 25 }, // Unit Price
      4: { cellWidth: 25 }, // Subtotal
      5: { cellWidth: 30 }, // Vendor
      6: { cellWidth: 25 }, // Category
      7: { cellWidth: 35 }, // Jobsite
    },
    margin: { left: 20, right: 20 },
  });

  // Add summary section
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(12);
  doc.text('Summary', 20, finalY);
  doc.setFontSize(10);
  
  const categoryCount = takeoffs.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let summaryY = finalY + 10;
  doc.text(`Total Items: ${takeoffs.length}`, 20, summaryY);
  summaryY += 5;
  doc.text(`Total Estimated Value: $${totalEstimated.toFixed(2)}`, 20, summaryY);

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`${filename}.pdf`);
};