// hooks/usePrintIncomeExpenses.ts
import { useCallback } from "react";
import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { TransactionWithHierarchy } from "@/hooks/useHierarchicalCategories";

export type PrintOption = "charts" | "table" | "full";

interface PrintArgs {
  option: PrintOption;
  transactions: TransactionWithHierarchy[];
  appliedFilters: {
    search?: string;
    dateRange?: string;
    types?: string[];
    statuses?: string[];
    categories?: string[];
    payees?: string[];
  };
}

export const usePrintIncomeExpenses = () => {
  const { toast } = useToast();
  const { settings } = useCompanySettings();

  // helper: screenshot any element sharply
  const captureEl = async (el: HTMLElement) => {
    const scale = Math.max(2, window.devicePixelRatio || 2); // crisp
    const canvas = await html2canvas(el, {
      scale,
      backgroundColor: "#fff",
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL("image/png", 1.0);
  };

  const generatePrintContent = useCallback(
    async ({ option, transactions, appliedFilters }: PrintArgs) => {
      try {
        const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let cursorY = 48;

        // ---- Header ----
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text(
          `${settings?.company_name || "Company"} - Income & Expenses Report`,
          40,
          cursorY
        );
        cursorY += 18;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const gen = new Date();
        pdf.text(
          `Generated on ${gen.toLocaleDateString()} at ${gen.toLocaleTimeString()}`,
          40,
          cursorY
        );
        cursorY += 14;

        if (appliedFilters?.dateRange) {
          pdf.text(`Date Range: ${appliedFilters.dateRange}`, 40, cursorY);
          cursorY += 12;
        }
        if (appliedFilters?.search) {
          pdf.text(`Search: "${appliedFilters.search}"`, 40, cursorY);
          cursorY += 12;
        }

        // draw a divider line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(1);
        pdf.line(40, cursorY + 6, pageWidth - 40, cursorY + 6);
        cursorY += 20;

        // ---- Charts/KPIs (optional) ----
        if (option === "charts" || option === "full") {
          // Give charts a moment to finish rendering if needed
          await new Promise((r) => setTimeout(r, 400));

          const kpisEl = document.querySelector(
            '[data-print="kpis"]'
          ) as HTMLElement | null;
          if (kpisEl) {
            const kpiImg = await captureEl(kpisEl);
            const maxW = pageWidth - 80;
            const imgProps = pdf.getImageProperties(kpiImg);
            const kpiH = (imgProps.height * maxW) / imgProps.width;
            if (cursorY + kpiH > pageHeight - 60) {
              pdf.addPage();
              cursorY = 48;
            }
            pdf.addImage(kpiImg, "PNG", 40, cursorY, maxW, kpiH);
            cursorY += kpiH + 16;
          }

          const chartsEl = document.querySelector(
            '[data-print="charts"]'
          ) as HTMLElement | null;
          if (chartsEl) {
            const chartsImg = await captureEl(chartsEl);
            const maxW = pageWidth - 80;
            const imgProps = pdf.getImageProperties(chartsImg);
            const chartsH = (imgProps.height * maxW) / imgProps.width;
            if (cursorY + chartsH > pageHeight - 60) {
              pdf.addPage();
              cursorY = 48;
            }
            pdf.addImage(chartsImg, "PNG", 40, cursorY, maxW, chartsH);
            cursorY += chartsH + 12;
          }
        }

        // ---- Transactions table (vector, paginated) ----
        if (option === "table" || option === "full") {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.text(`Transactions (${transactions.length} items)`, 40, cursorY);
          cursorY += 10;

          // table data
          const body = transactions.map((t) => {
            const isIncome = t.transaction_type === "income";
            const amount = `${isIncome ? "+" : "-"}$${Math.abs(t.amount).toFixed(2)}`;

            return [
              new Date(t.expense_date).toLocaleDateString(),
              t.expense_title ?? "",
              t.subcategory_name
                ? `${t.parent_category_name} > ${t.subcategory_name}`
                : t.parent_category_name || "Uncategorized",
              t.vendor_payee || "-",
              amount,
              (t.payment_status || "").toString().replace(/^\w/, (c) => c.toUpperCase()),
              isIncome ? "Income" : "Expense",
            ];
          });

          const colStyles: UserOptions["columnStyles"] = {
            0: { cellWidth: 80 }, // Date
            1: { cellWidth: 140 }, // Title
            2: { cellWidth: 140 }, // Category
            3: { cellWidth: 120 }, // Vendor/Payee
            4: { cellWidth: 70, halign: "right" }, // Amount
            5: { cellWidth: 70, halign: "center" }, // Status
            6: { cellWidth: 70, halign: "center" }, // Type
          };

          autoTable(pdf, {
            startY: cursorY + 6,
            head: [["Date", "Title", "Category", "Vendor/Payee", "Amount", "Status", "Type"]],
            body,
            styles: {
              font: "helvetica",
              fontSize: 9,
              cellPadding: 3,
              lineColor: [226, 232, 240],
              lineWidth: 0.5,
            },
            headStyles: {
              fillColor: [248, 250, 252],
              textColor: [30, 41, 59],
              fontStyle: "bold",
              lineColor: [226, 232, 240],
              lineWidth: 1,
            },
            columnStyles: colStyles,
            didParseCell: (data) => {
              // Color amount & type cells
              if (data.section === "body") {
                if (data.column.index === 4 && typeof data.cell.raw === "string") {
                  if (data.cell.raw.startsWith("+")) {
                    data.cell.styles.textColor = [22, 101, 52]; // green-800
                    data.cell.styles.fontStyle = "bold";
                  } else {
                    data.cell.styles.textColor = [220, 38, 38]; // red-600
                    data.cell.styles.fontStyle = "bold";
                  }
                }
                if (data.column.index === 6 && typeof data.cell.raw === "string") {
                  data.cell.styles.fillColor =
                    data.cell.raw === "Income" ? [220, 252, 231] : [254, 226, 226];
                  data.cell.styles.textColor =
                    data.cell.raw === "Income" ? [22, 101, 52] : [153, 27, 27];
                }
              }
            },
            didDrawPage: (data) => {
              // footer page number
              const str = `Page ${pdf.getCurrentPageInfo().pageNumber}`;
              pdf.setFontSize(9);
              pdf.setTextColor(100);
              pdf.text(str, pageWidth - 60, pageHeight - 20);
            },
            margin: { left: 40, right: 40 },
          });
        }

        // ---- Save ----
        const fileName = `income-expenses-${option}-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`;
        pdf.save(fileName);

        toast({
          title: "PDF ready",
          description: "Your report was generated with proper pagination.",
        });
      } catch (e) {
        console.error(e);
        toast({
          title: "PDF failed",
          description: "There was an error generating the report.",
          variant: "destructive",
        });
      }
    },
    [settings, toast]
  );

  return { generatePrintContent };
};
