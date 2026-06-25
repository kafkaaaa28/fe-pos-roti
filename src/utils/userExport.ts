import type { ManagerSystemUser } from "../types/manager";
import { formatDate, formatNumber } from "./formatter";

export type UserExportFormat = "excel" | "pdf";

interface UserExportPayload {
  users: ManagerSystemUser[];
  format: UserExportFormat;
  filterLabel?: string;
}

const brand = {
  dark: "#2A1510",
  primary: "#7B2D13",
  secondary: "#A65321",
  accent: "#F7D488",
  cream: "#FFF7E6",
  muted: "#6B4A3E",
  line: "#E8D6BC",
  success: "#047857",
  danger: "#B91C1C",
};

const headers = ["No", "Kode", "Nama", "Email", "No HP", "Role", "Status", "Dibuat", "Diperbarui"];
const columnWidths = [28, 72, 120, 180, 100, 80, 82, 120, 120];

const formatFileDate = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

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

const summaryRows = (users: ManagerSystemUser[]): Array<[string, number]> => [
  ["Total pengguna", users.length],
  ["Pengguna aktif", users.filter((item) => item.status === "ACTIVE").length],
  ["Pengguna nonaktif", users.filter((item) => item.status === "INACTIVE").length],
  ["Manager", users.filter((item) => item.role === "MANAGER").length],
  ["Staff", users.filter((item) => item.role === "STAFF").length],
  ["Kasir", users.filter((item) => item.role === "KASIR").length],
  ["Customer", users.filter((item) => item.role === "CUSTOMER").length],
];

const displayStatus = (status: ManagerSystemUser["status"]) => (status === "ACTIVE" ? "Aktif" : "Nonaktif");

const dataRows = (users: ManagerSystemUser[]) => users.map((item, index) => [
  index + 1,
  item.id,
  item.name,
  item.email,
  item.phone || "-",
  item.role,
  displayStatus(item.status),
  formatDate(item.createdAt),
  formatDate(item.updatedAt),
]);

const excelCell = (value: string | number, style = "Cell", type?: "String" | "Number") =>
  `<Cell ss:StyleID="${style}"><Data ss:Type="${type ?? (typeof value === "number" ? "Number" : "String")}">${escapeXml(value)}</Data></Cell>`;

const excelRow = (cells: string[], height?: number) => `<Row${height ? ` ss:Height="${height}"` : ""}>${cells.join("")}</Row>`;

const excelDocument = (users: ManagerSystemUser[], filterLabel: string, generatedAt: string) => {
  const summary = summaryRows(users);
  const rows = dataRows(users);
  const mergeAcross = headers.length - 1;
  const tableRows = [
    excelRow([`<Cell ss:StyleID="Title" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">DAFTAR PENGGUNA SISTEM</Data></Cell>`], 30),
    excelRow([`<Cell ss:StyleID="Subtitle" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">${escapeXml(`Filter: ${filterLabel} | Diekspor: ${formatDate(generatedAt)}`)}</Data></Cell>`], 22),
    excelRow([`<Cell ss:MergeAcross="${mergeAcross}"><Data ss:Type="String"></Data></Cell>`], 8),
    excelRow([`<Cell ss:StyleID="Section" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">Ringkasan Pengguna</Data></Cell>`], 23),
    excelRow([excelCell("Indikator", "Header"), excelCell("Jumlah", "Header")]),
    ...summary.map(([label, value], index) => excelRow([
      excelCell(label, index % 2 ? "CellAlt" : "Cell"),
      excelCell(value, index % 2 ? "NumberAlt" : "Number"),
    ])),
    excelRow([`<Cell ss:MergeAcross="${mergeAcross}"><Data ss:Type="String"></Data></Cell>`], 8),
    excelRow([`<Cell ss:StyleID="Section" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">Detail Pengguna</Data></Cell>`], 23),
    excelRow(headers.map((header) => excelCell(header, "Header"))),
    ...rows.map((items, rowIndex) => excelRow(items.map((value, columnIndex) => {
      const isStatus = columnIndex === 6;
      const baseStyle = rowIndex % 2 ? "CellAlt" : "Cell";
      const style = isStatus
        ? value === "Aktif" ? "Active" : "Inactive"
        : typeof value === "number" ? rowIndex % 2 ? "NumberAlt" : "Number" : baseStyle;
      return excelCell(value, style);
    }))),
  ].join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="${brand.primary}" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Subtitle"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="10" ss:Color="${brand.cream}"/><Interior ss:Color="${brand.secondary}" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Section"><Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="${brand.dark}" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="${brand.dark}"/><Interior ss:Color="${brand.accent}" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.primary}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Cell"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="CellAlt"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Interior ss:Color="#FFF7E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Number"><NumberFormat ss:Format="#,##0"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="NumberAlt"><NumberFormat ss:Format="#,##0"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Interior ss:Color="#FFF7E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Active"><Font ss:Color="${brand.success}" ss:Bold="1"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Inactive"><Font ss:Color="${brand.danger}" ss:Bold="1"/><Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
  </Styles>
  <Worksheet ss:Name="Daftar Pengguna">
    <Table>
      ${columnWidths.map((width) => `<Column ss:Width="${width}"/>`).join("")}
      ${tableRows}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>12</SplitHorizontal><TopRowBottomPane>12</TopRowBottomPane></WorksheetOptions>
  </Worksheet>
</Workbook>`;
};

const pdfColor = (hex: string) => {
  const clean = hex.replace("#", "");
  const red = parseInt(clean.slice(0, 2), 16) / 255;
  const green = parseInt(clean.slice(2, 4), 16) / 255;
  const blue = parseInt(clean.slice(4, 6), 16) / 255;
  return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)} rg`;
};

const truncate = (value: string | number, maxLength: number) => {
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, Math.max(1, maxLength - 1))}.` : text;
};

const pdfDocument = (users: ManagerSystemUser[], filterLabel: string, generatedAt: string) => {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 25;
  const tableWidth = pageWidth - margin * 2;
  const pages: string[][] = [];
  let commands: string[] = [];
  let y = pageHeight - 32;

  const text = (value: string | number, x: number, size = 8, font = "F1", color = brand.dark) => {
    commands.push(`BT /${font} ${size} Tf ${pdfColor(color)} ${x} ${y} Td (${escapePdf(value)}) Tj ET`);
  };

  const rect = (x: number, yy: number, width: number, height: number, color: string) => {
    commands.push(`${pdfColor(color)} ${x} ${yy} ${width} ${height} re f`);
  };

  const drawHeader = () => {
    rect(0, pageHeight - 78, pageWidth, 78, brand.primary);
    y = pageHeight - 31;
    text("DAFTAR PENGGUNA SISTEM", margin, 17, "F2", "#FFFFFF");
    y -= 18;
    text(`Filter: ${filterLabel} | Diekspor: ${formatDate(generatedAt)}`, margin, 8.5, "F1", brand.cream);
    y = pageHeight - 98;
  };

  const nextPage = () => {
    if (commands.length) pages.push(commands);
    commands = [];
    drawHeader();
  };

  const drawTableHeader = () => {
    rect(margin, y - 12, tableWidth, 20, brand.accent);
    let x = margin;
    headers.forEach((header, index) => {
      text(header, x + 3, 6.8, "F2", brand.dark);
      x += columnWidths[index];
    });
    y -= 21;
  };

  nextPage();
  const summary = summaryRows(users);
  text("Ringkasan", margin, 11, "F2", brand.primary);
  y -= 16;
  const summaryText = summary.map(([label, value]) => `${label}: ${formatNumber(value)}`).join("  |  ");
  text(summaryText, margin, 7.5, "F1", brand.muted);
  y -= 26;
  text("Detail Pengguna", margin, 11, "F2", brand.primary);
  y -= 17;
  drawTableHeader();

  dataRows(users).forEach((row, rowIndex) => {
    if (y < 48) {
      nextPage();
      text("Detail Pengguna (lanjutan)", margin, 10, "F2", brand.primary);
      y -= 16;
      drawTableHeader();
    }

    if (rowIndex % 2 === 0) rect(margin, y - 11, tableWidth, 17, "#FFF7E6");
    let x = margin;
    row.forEach((value, columnIndex) => {
      const maxLength = [3, 12, 21, 28, 16, 10, 11, 19, 19][columnIndex];
      const statusColor = columnIndex === 6 && value === "Aktif" ? brand.success : columnIndex === 6 ? brand.danger : brand.dark;
      text(truncate(value, maxLength), x + 3, 6.5, columnIndex === 1 ? "F2" : "F1", statusColor);
      x += columnWidths[columnIndex];
    });
    y -= 17;
  });

  pages.push(commands);

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageReferences = pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${pageReferences}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((page, index) => {
    const pageObjectNumber = 5 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const footer = `BT /F1 7 Tf ${pdfColor(brand.muted)} ${margin} 22 Td (${escapePdf(`Halaman ${index + 1} dari ${pages.length}`)}) Tj ET`;
    const content = [...page, footer].join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
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

export const exportUserFile = ({ users, format, filterLabel = "Semua pengguna" }: UserExportPayload) => {
  const generatedAt = new Date().toISOString();
  const fileName = `daftar-pengguna-${formatFileDate()}.${format === "excel" ? "xls" : "pdf"}`;

  if (format === "excel") {
    triggerDownload(new Blob([excelDocument(users, filterLabel, generatedAt)], { type: "application/vnd.ms-excel;charset=utf-8" }), fileName);
    return { fileName, message: `Excel berisi ${formatNumber(users.length)} pengguna, ringkasan, dan detail akun.` };
  }

  triggerDownload(new Blob([pdfDocument(users, filterLabel, generatedAt)], { type: "application/pdf" }), fileName);
  return { fileName, message: `PDF berisi ${formatNumber(users.length)} pengguna, ringkasan, dan detail akun.` };
};
