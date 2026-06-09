import type { DashboardData, DashboardPeriod } from "../types/dashboard";
import { formatDate, formatNumber, formatRupiah } from "./formatter";

export type DashboardExportFormat = "excel" | "pdf";

interface ExportDashboardOptions {
  dashboard: DashboardData;
  period: DashboardPeriod;
  periodLabel: string;
  format: DashboardExportFormat;
}

interface ExcelCellOptions {
  style?: string;
  type?: "String" | "Number";
  mergeAcross?: number;
}

interface PdfTableOptions {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  widths: number[];
}

const brand = {
  dark: "#2A1510",
  primary: "#7B2D13",
  secondary: "#A65321",
  accent: "#F7D488",
  cream: "#FFF7E6",
  muted: "#6B4A3E",
  line: "#E8D6BC",
  danger: "#B91C1C",
  warning: "#B7791F",
  success: "#047857",
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

const excelStyles = () => `
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="Title">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="${brand.primary}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Subtitle">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="${brand.cream}"/>
      <Interior ss:Color="${brand.secondary}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Section">
      <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="${brand.dark}" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
      </Borders>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="${brand.dark}"/>
      <Interior ss:Color="${brand.accent}" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.primary}"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
      </Borders>
    </Style>
    <Style ss:ID="Cell">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
      </Borders>
    </Style>
    <Style ss:ID="CellAlt">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Interior ss:Color="#FFF7E6" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/>
      </Borders>
    </Style>
    <Style ss:ID="Money"><NumberFormat ss:Format="&quot;Rp&quot;#,##0"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Number"><NumberFormat ss:Format="#,##0"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Success"><Font ss:Color="${brand.success}" ss:Bold="1"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Warning"><Font ss:Color="${brand.warning}" ss:Bold="1"/><Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Danger"><Font ss:Color="${brand.danger}" ss:Bold="1"/><Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
  </Styles>`;

const excelCell = (value: string | number, options: ExcelCellOptions = {}) => {
  const style = options.style ? ` ss:StyleID="${options.style}"` : "";
  const merge = options.mergeAcross ? ` ss:MergeAcross="${options.mergeAcross}"` : "";
  const type = options.type ?? (typeof value === "number" ? "Number" : "String");
  return `<Cell${style}${merge}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
};

const excelRow = (cells: string[], height?: number) => `<Row${height ? ` ss:Height="${height}"` : ""}>${cells.join("")}</Row>`;

const excelHeaderRows = (title: string, period: DashboardPeriod, periodLabel: string, generatedAt: string, columnCount: number) => [
  excelRow([excelCell("LAPORAN DASHBOARD MANAGER - TOKO ROTI", { style: "Title", mergeAcross: columnCount - 1 })], 28),
  excelRow([excelCell(`${title} | Periode: ${periodLabel} (${period}) | Export: ${formatDate(generatedAt)}`, { style: "Subtitle", mergeAcross: columnCount - 1 })], 22),
  excelRow([excelCell("", { mergeAcross: columnCount - 1 })], 8),
].join("");

const worksheet = (name: string, columnWidths: number[], rows: string) => `
  <Worksheet ss:Name="${escapeXml(name)}">
    <Table>
      ${columnWidths.map((width) => `<Column ss:Width="${width}"/>`).join("")}
      ${rows}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>3</SplitHorizontal>
      <TopRowBottomPane>3</TopRowBottomPane>
      <ActivePane>2</ActivePane>
      <Panes><Pane><Number>3</Number></Pane><Pane><Number>2</Number></Pane></Panes>
      <ProtectObjects>False</ProtectObjects>
      <ProtectScenarios>False</ProtectScenarios>
    </WorksheetOptions>
  </Worksheet>`;

const statusStyle = (value: string) => {
  if (["HABIS", "CANCELLED"].includes(value)) return "Danger";
  if (["MENIPIS", "PENDING", "PROCESSING", "Tertunda", "Diproses"].includes(value)) return "Warning";
  return "Success";
};

const rowStyle = (index: number) => (index % 2 === 0 ? "Cell" : "CellAlt");

const buildSummarySheet = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const rows = [
    excelHeaderRows("Ringkasan Operasional", period, periodLabel, dashboard.generatedAt, 4),
    excelRow([excelCell("Ringkasan Dashboard", { style: "Section", mergeAcross: 3 })], 23),
    excelRow([excelCell("Indikator", { style: "Header" }), excelCell("Nilai", { style: "Header" }), excelCell("Satuan", { style: "Header" }), excelCell("Keterangan", { style: "Header" })]),
    excelRow([excelCell("Total Penjualan", { style: "Cell" }), excelCell(dashboard.summary.totalSales, { style: "Money", type: "Number" }), excelCell("Rupiah", { style: "Cell" }), excelCell("Transaksi POS dan online", { style: "Cell" })]),
    excelRow([excelCell("Total Produksi", { style: "CellAlt" }), excelCell(dashboard.summary.totalProduction, { style: "Number", type: "Number" }), excelCell("pcs", { style: "CellAlt" }), excelCell("Riwayat produksi", { style: "CellAlt" })]),
    excelRow([excelCell("Produk Terjual", { style: "Cell" }), excelCell(dashboard.summary.totalSoldProducts, { style: "Number", type: "Number" }), excelCell("item", { style: "Cell" }), excelCell("Produk keluar melalui transaksi", { style: "Cell" })]),
    excelRow([excelCell("Jumlah Transaksi", { style: "CellAlt" }), excelCell(dashboard.summary.transactionCount, { style: "Number", type: "Number" }), excelCell("transaksi", { style: "CellAlt" }), excelCell("POS dan online", { style: "CellAlt" })]),
    excelRow([excelCell("Total Customer", { style: "Cell" }), excelCell(dashboard.summary.customerCount, { style: "Number", type: "Number" }), excelCell("customer", { style: "Cell" }), excelCell("Akun/pelanggan tercatat", { style: "Cell" })]),
    excelRow([excelCell("Produk Terlaris", { style: "CellAlt" }), excelCell(dashboard.summary.bestSellingProduct, { style: "CellAlt" }), excelCell("-", { style: "CellAlt" }), excelCell("Produk dengan penjualan tertinggi", { style: "CellAlt" })]),
    excelRow([excelCell("Pendapatan Bulanan", { style: "Cell" }), excelCell(dashboard.summary.monthlyRevenue, { style: "Money", type: "Number" }), excelCell("Rupiah", { style: "Cell" }), excelCell("Revenue bulan berjalan", { style: "Cell" })]),
    excelRow([excelCell("Stok Menipis", { style: "CellAlt" }), excelCell(dashboard.summary.lowStockCount, { style: "Number", type: "Number" }), excelCell("item", { style: "CellAlt" }), excelCell("Perlu perhatian manager", { style: "CellAlt" })]),
  ].join("");

  return worksheet("Ringkasan", [150, 130, 90, 250], rows);
};

const buildSalesSheet = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const totalSales = dashboard.salesChart.reduce((sum, item) => sum + item.sales, 0);
  const totalTransactions = dashboard.salesChart.reduce((sum, item) => sum + item.transactions, 0);
  const rows = [
    excelHeaderRows("Laporan Penjualan", period, periodLabel, dashboard.generatedAt, 4),
    excelRow([excelCell("Grafik Penjualan", { style: "Section", mergeAcross: 3 })], 23),
    excelRow([excelCell("Label", { style: "Header" }), excelCell("Penjualan", { style: "Header" }), excelCell("Transaksi", { style: "Header" }), excelCell("Rata-rata per Transaksi", { style: "Header" })]),
    ...dashboard.salesChart.map((item, index) =>
      excelRow([
        excelCell(item.label, { style: rowStyle(index) }),
        excelCell(item.sales, { style: "Money", type: "Number" }),
        excelCell(item.transactions, { style: "Number", type: "Number" }),
        excelCell(item.transactions ? Math.round(item.sales / item.transactions) : 0, { style: "Money", type: "Number" }),
      ]),
    ),
    excelRow([excelCell("TOTAL", { style: "Header" }), excelCell(totalSales, { style: "Money", type: "Number" }), excelCell(totalTransactions, { style: "Number", type: "Number" }), excelCell(totalTransactions ? Math.round(totalSales / totalTransactions) : 0, { style: "Money", type: "Number" })]),
  ].join("");

  return worksheet("Penjualan", [120, 135, 110, 160], rows);
};

const buildProductionSheet = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const totalProduction = dashboard.productionChart.reduce((sum, item) => sum + item.quantity, 0);
  const rows = [
    excelHeaderRows("Laporan Produksi", period, periodLabel, dashboard.generatedAt, 4),
    excelRow([excelCell("Grafik Produksi per Produk", { style: "Section", mergeAcross: 3 })], 23),
    excelRow([excelCell("Produk", { style: "Header" }), excelCell("Jumlah Produksi", { style: "Header" }), excelCell("Satuan", { style: "Header" }), excelCell("Kontribusi", { style: "Header" })]),
    ...dashboard.productionChart.map((item, index) =>
      excelRow([
        excelCell(item.label, { style: rowStyle(index) }),
        excelCell(item.quantity, { style: "Number", type: "Number" }),
        excelCell("pcs", { style: rowStyle(index) }),
        excelCell(`${totalProduction ? Math.round((item.quantity / totalProduction) * 100) : 0}%`, { style: rowStyle(index) }),
      ]),
    ),
    excelRow([excelCell("TOTAL", { style: "Header" }), excelCell(totalProduction, { style: "Number", type: "Number" }), excelCell("pcs", { style: "Header" }), excelCell("100%", { style: "Header" })]),
    excelRow([excelCell("", { mergeAcross: 3 })], 8),
    excelRow([excelCell("Riwayat Produksi Terbaru", { style: "Section", mergeAcross: 3 })], 23),
    excelRow([excelCell("Produk", { style: "Header" }), excelCell("Jumlah", { style: "Header" }), excelCell("Petugas", { style: "Header" }), excelCell("Status / Tanggal", { style: "Header" })]),
    ...dashboard.recentProductions.map((item, index) =>
      excelRow([
        excelCell(item.productName, { style: rowStyle(index) }),
        excelCell(item.quantity, { style: "Number", type: "Number" }),
        excelCell(item.userName, { style: rowStyle(index) }),
        excelCell(`${item.status} - ${formatDate(item.createdAt)}`, { style: statusStyle(item.status) }),
      ]),
    ),
  ].join("");

  return worksheet("Produksi", [150, 120, 140, 240], rows);
};

const buildBestProductSheet = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const totalRevenue = dashboard.bestSellingProducts.reduce((sum, item) => sum + item.revenue, 0);
  const rows = [
    excelHeaderRows("Laporan Produk Terlaris", period, periodLabel, dashboard.generatedAt, 5),
    excelRow([excelCell("Ranking Produk Terlaris", { style: "Section", mergeAcross: 4 })], 23),
    excelRow([excelCell("Ranking", { style: "Header" }), excelCell("ID", { style: "Header" }), excelCell("Produk", { style: "Header" }), excelCell("Terjual", { style: "Header" }), excelCell("Revenue", { style: "Header" })]),
    ...dashboard.bestSellingProducts.map((item, index) =>
      excelRow([
        excelCell(index + 1, { style: "Number", type: "Number" }),
        excelCell(item.id, { style: rowStyle(index) }),
        excelCell(item.name, { style: rowStyle(index) }),
        excelCell(item.sold, { style: "Number", type: "Number" }),
        excelCell(item.revenue, { style: "Money", type: "Number" }),
      ]),
    ),
    excelRow([excelCell("TOTAL", { style: "Header", mergeAcross: 2 }), excelCell(dashboard.bestSellingProducts.reduce((sum, item) => sum + item.sold, 0), { style: "Number", type: "Number" }), excelCell(totalRevenue, { style: "Money", type: "Number" })]),
  ].join("");

  return worksheet("Produk Terlaris", [80, 100, 170, 100, 140], rows);
};

const buildStockSheet = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const rows = [
    excelHeaderRows("Laporan Stok Menipis", period, periodLabel, dashboard.generatedAt, 6),
    excelRow([excelCell("Daftar Stok yang Perlu Perhatian", { style: "Section", mergeAcross: 5 })], 23),
    excelRow([excelCell("ID", { style: "Header" }), excelCell("Nama", { style: "Header" }), excelCell("Jenis", { style: "Header" }), excelCell("Stok", { style: "Header" }), excelCell("Minimum", { style: "Header" }), excelCell("Status", { style: "Header" })]),
    ...dashboard.lowStocks.map((item, index) =>
      excelRow([
        excelCell(item.id, { style: rowStyle(index) }),
        excelCell(item.name, { style: rowStyle(index) }),
        excelCell(item.type, { style: rowStyle(index) }),
        excelCell(`${item.stock} ${item.unit}`, { style: rowStyle(index) }),
        excelCell(`${item.minStock} ${item.unit}`, { style: rowStyle(index) }),
        excelCell(item.status, { style: statusStyle(item.status) }),
      ]),
    ),
  ].join("");

  return worksheet("Stok Menipis", [100, 170, 120, 90, 90, 110], rows);
};

const buildTransactionSheet = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const totalRevenue = dashboard.recentTransactions.reduce((sum, item) => sum + item.totalPrice, 0);
  const rows = [
    excelHeaderRows("Laporan Transaksi Terbaru", period, periodLabel, dashboard.generatedAt, 6),
    excelRow([excelCell("Daftar Transaksi", { style: "Section", mergeAcross: 5 })], 23),
    excelRow([excelCell("Invoice", { style: "Header" }), excelCell("Customer", { style: "Header" }), excelCell("Jenis", { style: "Header" }), excelCell("Status", { style: "Header" }), excelCell("Total", { style: "Header" }), excelCell("Waktu", { style: "Header" })]),
    ...dashboard.recentTransactions.map((item, index) =>
      excelRow([
        excelCell(item.invoiceNumber, { style: rowStyle(index) }),
        excelCell(item.customerName, { style: rowStyle(index) }),
        excelCell(item.type, { style: rowStyle(index) }),
        excelCell(item.status, { style: statusStyle(item.status) }),
        excelCell(item.totalPrice, { style: "Money", type: "Number" }),
        excelCell(formatDate(item.createdAt), { style: rowStyle(index) }),
      ]),
    ),
    excelRow([excelCell("TOTAL", { style: "Header", mergeAcross: 3 }), excelCell(totalRevenue, { style: "Money", type: "Number" }), excelCell("", { style: "Header" })]),
  ].join("");

  return worksheet("Transaksi", [160, 140, 90, 110, 120, 170], rows);
};

export const downloadDashboardExcel = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const fileName = `dashboard-manager-rapih-${slugify(periodLabel)}-${formatFileDate()}.xls`;
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>POS Roti Dashboard</Author>
    <Title>Laporan Dashboard Manager</Title>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  ${excelStyles()}
  ${buildSummarySheet(dashboard, period, periodLabel)}
  ${buildSalesSheet(dashboard, period, periodLabel)}
  ${buildProductionSheet(dashboard, period, periodLabel)}
  ${buildBestProductSheet(dashboard, period, periodLabel)}
  ${buildStockSheet(dashboard, period, periodLabel)}
  ${buildTransactionSheet(dashboard, period, periodLabel)}
</Workbook>`;

  triggerDownload(new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }), fileName);
  return fileName;
};

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
};

const pdfColor = (hex: string, mode: "fill" | "stroke" = "fill") => {
  const { r, g, b } = hexToRgb(hex);
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${mode === "fill" ? "rg" : "RG"}`;
};

const truncateText = (value: string | number, maxLength: number) => {
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text;
};

const buildPdf = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 34;
  const contentWidth = pageWidth - margin * 2;
  const pages: string[][] = [];
  let commands: string[] = [];
  let y = 792;

  const push = (command: string) => commands.push(command);
  const finishPage = () => {
    pages.push(commands);
    commands = [];
    y = 792;
  };
  const addPageHeader = () => {
    push(`q ${pdfColor(brand.primary)} ${margin} 788 ${contentWidth} 28 re f Q`);
    push(`BT /F2 14 Tf ${pdfColor("#FFFFFF")} ${margin + 14} 806 Td (${escapePdf("LAPORAN DASHBOARD MANAGER - TOKO ROTI")}) Tj ET`);
    push(`BT /F1 8 Tf ${pdfColor("#FFFFFF")} ${margin + 14} 793 Td (${escapePdf(`Periode: ${periodLabel} (${period}) | Export: ${formatDate(dashboard.generatedAt)}`)}) Tj ET`);
    y = 768;
  };
  const ensureSpace = (height: number) => {
    if (y - height < 45) {
      finishPage();
      addPageHeader();
    }
  };
  const drawText = (text: string | number, x: number, textY: number, size = 9, font = "F1", color = brand.dark) => {
    push(`BT /${font} ${size} Tf ${pdfColor(color)} ${x} ${textY} Td (${escapePdf(text)}) Tj ET`);
  };
  const drawRect = (x: number, rectY: number, width: number, height: number, fill: string, stroke = brand.line) => {
    push(`q ${pdfColor(fill)} ${pdfColor(stroke, "stroke")} ${x} ${rectY} ${width} ${height} re B Q`);
  };
  const section = (title: string) => {
    ensureSpace(34);
    y -= 8;
    drawRect(margin, y - 20, contentWidth, 22, brand.dark, brand.dark);
    drawText(title, margin + 10, y - 7, 10, "F2", "#FFFFFF");
    y -= 31;
  };
  const table = ({ title, columns, rows, widths }: PdfTableOptions) => {
    section(title);
    const headerHeight = 20;
    ensureSpace(headerHeight + 22);
    let x = margin;
    columns.forEach((column, index) => {
      drawRect(x, y - headerHeight, widths[index], headerHeight, brand.accent, brand.line);
      drawText(truncateText(column, Math.floor(widths[index] / 6)), x + 5, y - 13, 8, "F2", brand.dark);
      x += widths[index];
    });
    y -= headerHeight;

    rows.forEach((row, rowIndex) => {
      const rowHeight = 22;
      ensureSpace(rowHeight + 4);
      x = margin;
      row.forEach((cell, index) => {
        const fill = rowIndex % 2 === 0 ? "#FFFFFF" : brand.cream;
        drawRect(x, y - rowHeight, widths[index], rowHeight, fill, brand.line);
        drawText(truncateText(cell, Math.floor(widths[index] / 5.6)), x + 5, y - 14, 7.6, "F1", brand.muted);
        x += widths[index];
      });
      y -= rowHeight;
    });
    y -= 8;
  };

  addPageHeader();
  section("Ringkasan Dashboard");
  const summaryCards = [
    ["Total Penjualan", formatRupiah(dashboard.summary.totalSales)],
    ["Total Produksi", `${formatNumber(dashboard.summary.totalProduction)} pcs`],
    ["Produk Terjual", `${formatNumber(dashboard.summary.totalSoldProducts)} item`],
    ["Jumlah Transaksi", formatNumber(dashboard.summary.transactionCount)],
    ["Produk Terlaris", dashboard.summary.bestSellingProduct],
    ["Stok Menipis", `${dashboard.summary.lowStockCount} item`],
  ];
  summaryCards.forEach((item, index) => {
    const col = index % 2;
    const cardWidth = (contentWidth - 12) / 2;
    const x = margin + col * (cardWidth + 12);
    if (col === 0) ensureSpace(54);
    drawRect(x, y - 42, cardWidth, 42, index % 2 === 0 ? brand.cream : "#FFFFFF", brand.line);
    drawText(item[0], x + 10, y - 15, 8, "F1", brand.muted);
    drawText(item[1], x + 10, y - 31, 11, "F2", brand.primary);
    if (col === 1) y -= 52;
  });
  if (summaryCards.length % 2 !== 0) y -= 52;

  table({
    title: "Laporan Penjualan",
    columns: ["Label", "Penjualan", "Transaksi", "Rata-rata"],
    widths: [110, 150, 110, 160],
    rows: dashboard.salesChart.map((item) => [item.label, formatRupiah(item.sales), item.transactions, formatRupiah(item.transactions ? Math.round(item.sales / item.transactions) : 0)]),
  });

  table({
    title: "Laporan Produksi",
    columns: ["Produk", "Jumlah", "Kontribusi"],
    widths: [230, 140, 160],
    rows: dashboard.productionChart.map((item) => [item.label, `${formatNumber(item.quantity)} pcs`, `${Math.round((item.quantity / Math.max(1, dashboard.summary.totalProduction)) * 100)}%`]),
  });

  table({
    title: "Produk Terlaris",
    columns: ["Rank", "Produk", "Terjual", "Revenue"],
    widths: [60, 220, 100, 150],
    rows: dashboard.bestSellingProducts.map((item, index) => [index + 1, item.name, `${item.sold} item`, formatRupiah(item.revenue)]),
  });

  table({
    title: "Stok Menipis",
    columns: ["Nama", "Jenis", "Stok", "Min", "Status"],
    widths: [150, 115, 90, 85, 90],
    rows: dashboard.lowStocks.map((item) => [item.name, item.type, `${item.stock} ${item.unit}`, `${item.minStock} ${item.unit}`, item.status]),
  });

  table({
    title: "Transaksi Terbaru",
    columns: ["Invoice", "Customer", "Jenis", "Status", "Total"],
    widths: [155, 120, 75, 90, 90],
    rows: dashboard.recentTransactions.map((item) => [item.invoiceNumber, item.customerName, item.type, item.status, formatRupiah(item.totalPrice)]),
  });

  table({
    title: "Produksi Terbaru",
    columns: ["Produk", "Jumlah", "Petugas", "Status", "Tanggal"],
    widths: [135, 80, 115, 85, 115],
    rows: dashboard.recentProductions.map((item) => [item.productName, `${item.quantity} pcs`, item.userName, item.status, formatDate(item.createdAt)]),
  });

  finishPage();

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageCommands, index) => {
    const pageObjectNumber = 5 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const footer = [
      `BT /F1 8 Tf ${pdfColor(brand.muted)} ${margin} 24 Td (${escapePdf(`Halaman ${index + 1} dari ${pages.length}`)}) Tj ET`,
      `BT /F1 8 Tf ${pdfColor(brand.muted)} ${pageWidth - margin - 135} 24 Td (${escapePdf("POS Roti Manager Export")}) Tj ET`,
    ];
    const content = [...pageCommands, ...footer].join("\n");
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
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
};

export const downloadDashboardPdf = (dashboard: DashboardData, period: DashboardPeriod, periodLabel: string) => {
  const fileName = `dashboard-manager-rapih-${slugify(periodLabel)}-${formatFileDate()}.pdf`;
  const pdf = buildPdf(dashboard, period, periodLabel);
  triggerDownload(new Blob([pdf], { type: "application/pdf" }), fileName);
  return fileName;
};

export const exportDashboardFile = ({ dashboard, period, periodLabel, format }: ExportDashboardOptions) => {
  if (format === "excel") {
    const fileName = downloadDashboardExcel(dashboard, period, periodLabel);
    return {
      fileName,
      message: "File Excel rapi berhasil dibuat. Data dipisah per sheet: ringkasan, penjualan, produksi, produk terlaris, stok, dan transaksi.",
    };
  }

  const fileName = downloadDashboardPdf(dashboard, period, periodLabel);
  return {
    fileName,
    message: "File PDF rapi berhasil dibuat dengan layout laporan, tabel berwarna, header, dan nomor halaman.",
  };
};
