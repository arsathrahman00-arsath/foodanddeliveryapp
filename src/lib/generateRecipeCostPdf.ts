import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { savePdfFile, type PdfSaveResult } from "./savePdfFile";

interface RecipeCostRow {
  cat_name: string;
  item_name: string;
  unit_short: string;
  req_qty: number;
  item_rate: number;
  total_rate: number;
}

function formatDateDDMMYYYY(dateStr: string): string {
  const cleaned = dateStr.split("T")[0];
  const parts = cleaned.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

export async function generateRecipeCostPdf(
  data: RecipeCostRow[],
  selectedDate: string
): Promise<PdfSaveResult> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Recipe Cost Report", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${formatDateDDMMYYYY(selectedDate)}`, pageWidth - 14, 28, {
    align: "right",
  });

  const grandTotal = data.reduce((sum, r) => sum + Number(r.total_rate), 0);

  const tableData = data.map((row, i) => [
    i + 1,
    row.cat_name,
    row.item_name,
    row.unit_short,
    Number(row.req_qty).toFixed(2),
    `₹${Number(row.item_rate).toFixed(2)}`,
    `₹${Number(row.total_rate).toFixed(2)}`,
  ]);

  tableData.push(["", "", "", "", "", "Grand Total", `₹${grandTotal.toFixed(2)}`]);

  autoTable(doc, {
    startY: 34,
    head: [["#", "Category", "Item Name", "Unit", "Req Qty", "Unit Rate", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length - 1 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  const filename = `Recipe_Cost_${formatDateDDMMYYYY(selectedDate).replace(/-/g, "")}.pdf`;
  return savePdfFile(doc, filename);
}
