import type { DashboardPeriod } from "../types/dashboard";
import type {
  ManagerReportsData,
  ReportExportPayload,
  ReportType,
} from "../types/reports";
import { formatDate, formatRupiah } from "./formatter";

const brand = {
  dark: "#2A1018",
  primary: "#A02334",
  accent: "#FFAD60",
  cream: "#FFEEAD",
  line: "#E8D6BC",
  muted: "#6B4A3E",
};

const formatFileDate = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const escapeXml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const escapePdf = (value: string | number) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 700);
};

const periodText = (period: DashboardPeriod, periodLabel: string) => `${periodLabel} (${period})`;

const reportRows = (data: ManagerReportsData, reportType: ReportType): Array<Array<string | number>> => {
  if (reportType === "sales") {
    return data.sales.map((item, index) => [
      index + 1,
      formatDate(item.date),
      item.invoiceNumber,
      item.customerName,
      item.type === "OFFLINE" ? "POS" : "Online",
      item.productCount,
      item.totalQty,
      item.totalPrice,
      item.status,
    ]);
  }

  if (reportType === "production") {
    return data.production.map((item, index) => [
      index + 1,
      formatDate(item.date),
      item.productionNumber,
      item.productName,
      item.quantity,
      item.staffName,
      item.status,
      item.notes,
    ]);
  }

  if (reportType === "stock") {
    return data.stock.map((item, index) => [
      index + 1,
      item.id,
      item.name,
      item.type,
      `${item.stock} ${item.unit}`,
      `${item.minStock} ${item.unit}`,
      item.status,
      item.lastMovement,
    ]);
  }

  return data.transaction.map((item, index) => [
    index + 1,
    formatDate(item.date),
    item.invoiceNumber,
    item.customerName,
    item.type === "OFFLINE" ? "POS" : "Online",
    item.paymentMethod,
    item.totalPrice,
    item.status,
  ]);
};

const reportHeaders = (reportType: ReportType) => {
  if (reportType === "sales") return ["No", "Tanggal", "Invoice", "Customer", "Jenis", "Produk", "Qty", "Total", "Status"];
  if (reportType === "production") return ["No", "Tanggal", "No Produksi", "Produk", "Jumlah", "Petugas", "Status", "Catatan"];
  if (reportType === "stock") return ["No", "ID", "Nama", "Jenis", "Stok", "Minimum", "Status", "Pergerakan Terakhir"];
  return ["No", "Tanggal", "Invoice", "Customer", "Jenis", "Metode Bayar", "Total", "Status"];
};

const moneyColumns = (reportType: ReportType) => {
  if (reportType === "sales") return [7];
  if (reportType === "transaction") return [6];
  return [];
};

const cell = (value: string | number, style = "Cell", type: "String" | "Number" = "String") =>
  `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;

const row = (cells: string[], height?: number) => `<Row${height ? ` ss:Height="${height}"` : ""}>${cells.join("")}</Row>`;

const excelDocument = (data: ManagerReportsData, reportType: ReportType, reportTitle: string, period: DashboardPeriod, periodLabel: string) => {
  const headers = reportHeaders(reportType);
  const rows = reportRows(data, reportType);
  const money = moneyColumns(reportType);
  const summary = data.summaries[reportType];

  const tableRows = [
    row([`<Cell ss:StyleID="Title" ss:MergeAcross="${Math.max(headers.length - 1, 1)}"><Data ss:Type="String">${escapeXml(reportTitle.toUpperCase())}</Data></Cell>`], 30),
    row([`<Cell ss:StyleID="Subtitle" ss:MergeAcross="${Math.max(headers.length - 1, 1)}"><Data ss:Type="String">${escapeXml(`Periode: ${periodText(period, periodLabel)} | Export: ${formatDate(data.generatedAt)}`)}</Data></Cell>`], 22),
    row([cell("", "Cell")], 8),
    row([`<Cell ss:StyleID="Section" ss:MergeAcross="${Math.max(headers.length - 1, 1)}"><Data ss:Type="String">Ringkasan</Data></Cell>`], 24),
    row([cell("Indikator", "Header"), cell("Nilai", "Header"), cell("Keterangan", "Header")]),
    ...summary.map((item, index) => row([
      cell(item.label, index % 2 === 0 ? "Cell" : "CellAlt"),
      cell(item.value, index % 2 === 0 ? "Cell" : "CellAlt"),
      cell(item.helper, index % 2 === 0 ? "Cell" : "CellAlt"),
    ])),
    row([cell("", "Cell")], 8),
    row([`<Cell ss:StyleID="Section" ss:MergeAcross="${Math.max(headers.length - 1, 1)}"><Data ss:Type="String">Detail Data</Data></Cell>`], 24),
    row(headers.map((header) => cell(header, "Header"))),
    ...rows.map((items, rowIndex) => row(items.map((value, index) => {
      const style = money.includes(index) ? "Money" : rowIndex % 2 === 0 ? "Cell" : "CellAlt";
      const rawValue = money.includes(index) ? Number(value) : value;
      const type = typeof rawValue === "number" ? "Number" : "String";
      return cell(rawValue, style, type);
    }))),
  ].join("");

  const columns = headers.map((header) => `<Column ss:Width="${Math.max(80, header.length * 12)}"/>`).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="16" ss:Color="#FFFFFF"/><Interior ss:Color="${brand.primary}" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Subtitle"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="10" ss:Color="${brand.cream}"/><Interior ss:Color="${brand.dark}" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Section"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="${brand.primary}" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="${brand.dark}"/><Interior ss:Color="${brand.accent}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.primary}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Cell"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="CellAlt"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Interior ss:Color="#FFF7E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Money"><NumberFormat ss:Format="&quot;Rp&quot;#,##0"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(reportTitle.slice(0, 28))}"><Table>${columns}${tableRows}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>7</SplitHorizontal><TopRowBottomPane>7</TopRowBottomPane></WorksheetOptions></Worksheet>
</Workbook>`;
};

const pdfColor = (hex: string) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`;
};

const pdfDocument = (data: ManagerReportsData, reportType: ReportType, reportTitle: string, period: DashboardPeriod, periodLabel: string) => {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 40;
  const lineHeight = 16;
  let y = pageHeight - margin;
  let current: string[] = [];
  const pages: string[][] = [];
  const addPage = () => {
    if (current.length) pages.push(current);
    current = [];
    y = pageHeight - margin;
  };
  const text = (value: string | number, x: number, size = 9, font = "F1", color = "#2A1018") => {
    current.push(`BT /${font} ${size} Tf ${pdfColor(color)} ${x} ${y} Td (${escapePdf(value)}) Tj ET`);
  };
  const rect = (x: number, yy: number, width: number, height: number, color: string) => {
    current.push(`${pdfColor(color)} ${x} ${yy} ${width} ${height} re f`);
  };
  const ensure = (height: number) => {
    if (y - height < 50) addPage();
  };

  rect(0, pageHeight - 84, pageWidth, 84, brand.primary);
  text(reportTitle.toUpperCase(), margin, 18, "F2", "#FFFFFF");
  y -= 22;
  text(`Periode: ${periodText(period, periodLabel)} | Export: ${formatDate(data.generatedAt)}`, margin, 10, "F1", "#FFFFFF");
  y -= 42;

  text("Ringkasan", margin, 13, "F2", brand.primary);
  y -= 18;
  data.summaries[reportType].forEach((item, index) => {
    const cardWidth = 180;
    const x = margin + (index % 4) * (cardWidth + 12);
    if (index % 4 === 0) ensure(54);
    rect(x, y - 38, cardWidth, 38, index % 2 === 0 ? "#FFF7E6" : "#FFFFFF");
    const oldY = y;
    y = oldY - 14;
    text(item.label, x + 8, 7, "F1", brand.muted);
    y = oldY - 30;
    text(item.value, x + 8, 10, "F2", brand.primary);
    y = oldY;
    if (index % 4 === 3) y -= 48;
  });
  y -= 54;

  const headers = reportHeaders(reportType);
  const rows = reportRows(data, reportType);
  const widths = reportType === "sales" ? [30, 95, 125, 90, 55, 45, 38, 75, 70]
    : reportType === "production" ? [30, 95, 135, 105, 50, 90, 70, 155]
    : reportType === "stock" ? [30, 70, 105, 80, 55, 65, 70, 210]
    : [30, 95, 125, 90, 55, 82, 75, 70];

  ensure(80);
  text("Detail Data", margin, 13, "F2", brand.primary);
  y -= 22;
  let x = margin;
  rect(margin, y - 14, pageWidth - margin * 2, 20, brand.accent);
  headers.forEach((header, index) => {
    text(header, x + 4, 7, "F2", brand.dark);
    x += widths[index] ?? 70;
  });
  y -= 24;

  rows.forEach((items, rowIndex) => {
    ensure(lineHeight + 8);
    if (rowIndex % 2 === 0) rect(margin, y - 11, pageWidth - margin * 2, 18, "#FFF7E6");
    x = margin;
    items.forEach((item, index) => {
      const value = typeof item === "number" && moneyColumns(reportType).includes(index) ? formatRupiah(item) : item;
      text(String(value).slice(0, 26), x + 4, 7, "F1", brand.dark);
      x += widths[index] ?? 70;
    });
    y -= 18;
  });

  addPage();

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  pages.forEach((commands, index) => {
    const pageObjectNumber = 5 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const footer = `BT /F1 8 Tf ${pdfColor(brand.muted)} ${margin} 24 Td (${escapePdf(`Halaman ${index + 1} dari ${pages.length}`)}) Tj ET`;
    const content = [...commands, footer].join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

export const exportReportFile = ({ data, reportType, reportTitle, period, periodLabel, format }: ReportExportPayload) => {
  const extension = format === "excel" ? "xls" : "pdf";
  const fileName = `laporan-${slugify(reportTitle)}-${slugify(periodLabel)}-${formatFileDate()}.${extension}`;

  if (format === "excel") {
    const content = excelDocument(data, reportType, reportTitle, period, periodLabel);
    triggerDownload(new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8" }), fileName);
    return {
      fileName,
      message: "File Excel berhasil dibuat dengan tabel berwarna, ringkasan, dan detail data laporan terpilih.",
    };
  }

  const pdf = pdfDocument(data, reportType, reportTitle, period, periodLabel);
  triggerDownload(new Blob([pdf], { type: "application/pdf" }), fileName);
  return {
    fileName,
    message: "File PDF berhasil dibuat sebagai laporan bertabel lengkap dengan header, ringkasan, detail data, dan nomor halaman.",
  };
};
