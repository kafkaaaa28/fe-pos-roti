import type { ManagerSystemUser, SystemRole } from "../types/manager";
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

const headers = ["No", "Nama", "Email", "No HP", "Role", "Status"];
const columnWidths = [36, 150, 250, 135, 120, 95];
const roleSheets: Array<{ role: SystemRole; sheetName: string; title: string }> = [
  { role: "MANAGER", sheetName: "Role Manager", title: "LAPORAN PENGGUNA ROLE MANAGER" },
  { role: "STAFF", sheetName: "Role Staff", title: "LAPORAN PENGGUNA ROLE STAFF" },
  { role: "KASIR", sheetName: "Role Kasir", title: "LAPORAN PENGGUNA ROLE KASIR" },
  { role: "CUSTOMER", sheetName: "Role Customer", title: "LAPORAN PENGGUNA ROLE CUSTOMER" },
];

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

const userRow = (item: ManagerSystemUser, index: number): Array<string | number> => [
  index + 1,
  item.name.trim() || "-",
  item.email.trim() || "-",
  item.phone?.trim() || "-",
  item.role,
  item.status === "ACTIVE" ? "Aktif" : "Nonaktif",
];

const excelCell = (value: string | number, style = "Cell", type?: "String" | "Number") =>
  `<Cell ss:StyleID="${style}"><Data ss:Type="${type ?? (typeof value === "number" ? "Number" : "String")}">${escapeXml(value)}</Data></Cell>`;

const excelRow = (cells: string[], height?: number) => `<Row${height ? ` ss:Height="${height}"` : ""}>${cells.join("")}</Row>`;

const excelUserRows = (users: ManagerSystemUser[]) => users.map((item, rowIndex) => {
  const values = userRow(item, rowIndex);
  return excelRow(values.map((value, columnIndex) => {
    if (columnIndex === headers.length - 1) {
      return excelCell(value, item.status === "ACTIVE" ? "Active" : "Inactive");
    }

    const style = typeof value === "number"
      ? rowIndex % 2 ? "NumberAlt" : "Number"
      : rowIndex % 2 ? "CellAlt" : "Cell";
    return excelCell(value, style);
  }));
});

const excelWorksheet = ({
  sheetName,
  title,
  users,
  filterLabel,
  generatedAt,
  includeSummary = false,
  emptyMessage,
}: {
  sheetName: string;
  title: string;
  users: ManagerSystemUser[];
  filterLabel: string;
  generatedAt: string;
  includeSummary?: boolean;
  emptyMessage: string;
}) => {
  const mergeAcross = headers.length - 1;
  const rows: string[] = [
    excelRow([`<Cell ss:StyleID="Title" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">${escapeXml(title)}</Data></Cell>`], 30),
    excelRow([`<Cell ss:StyleID="Subtitle" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">${escapeXml(`Filter: ${filterLabel} | Diekspor: ${formatDate(generatedAt)}`)}</Data></Cell>`], 22),
    excelRow([`<Cell ss:StyleID="Section" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">${escapeXml(`Jumlah data: ${formatNumber(users.length)}`)}</Data></Cell>`], 23),
  ];

  if (includeSummary) {
    rows.push(
      excelRow([excelCell("Ringkasan Pengguna", "Header"), excelCell("Jumlah", "Header")]),
      ...summaryRows(users).map(([label, value], index) => excelRow([
        excelCell(label, index % 2 ? "CellAlt" : "Cell"),
        excelCell(value, index % 2 ? "NumberAlt" : "Number"),
      ])),
      excelRow([`<Cell ss:MergeAcross="${mergeAcross}"><Data ss:Type="String"></Data></Cell>`], 8),
    );
  }

  rows.push(
    excelRow([`<Cell ss:StyleID="Section" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">Detail Pengguna</Data></Cell>`], 23),
    excelRow(headers.map((header) => excelCell(header, "Header"))),
  );

  if (users.length) {
    rows.push(...excelUserRows(users));
  } else {
    rows.push(excelRow([`<Cell ss:StyleID="Empty" ss:MergeAcross="${mergeAcross}"><Data ss:Type="String">${escapeXml(emptyMessage)}</Data></Cell>`], 22));
  }

  return `
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>
      ${columnWidths.map((width) => `<Column ss:Width="${width}"/>`).join("")}
      ${rows.join("")}
    </Table>
  </Worksheet>`;
};

const excelDocument = (users: ManagerSystemUser[], filterLabel: string, generatedAt: string) => {
  const inactiveUsers = users.filter((item) => item.status === "INACTIVE");
  const worksheets = [
    excelWorksheet({
      sheetName: "Semua Akun",
      title: "LAPORAN SEMUA PENGGUNA",
      users,
      filterLabel,
      generatedAt,
      includeSummary: true,
      emptyMessage: "Tidak ada data pengguna untuk ditampilkan.",
    }),
    ...roleSheets.map(({ role, sheetName, title }) => excelWorksheet({
      sheetName,
      title,
      users: users.filter((item) => item.role === role),
      filterLabel,
      generatedAt,
      emptyMessage: `Tidak ada pengguna dengan role ${role}.`,
    })),
    excelWorksheet({
      sheetName: "Akun Nonaktif",
      title: "LAPORAN AKUN NONAKTIF",
      users: inactiveUsers,
      filterLabel,
      generatedAt,
      emptyMessage: "Tidak ada akun nonaktif.",
    }),
  ];

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
    <Style ss:ID="Active"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Color="${brand.success}" ss:Bold="1"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Inactive"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Color="${brand.danger}" ss:Bold="1"/><Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
    <Style ss:ID="Empty"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Italic="1" ss:Color="${brand.muted}"/><Interior ss:Color="#FFF7E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="${brand.line}"/></Borders></Style>
  </Styles>
  ${worksheets.join("\n")}
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
    text("LAPORAN PENGGUNA SISTEM", margin, 17, "F2", "#FFFFFF");
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

  const drawRows = (sectionTitle: string, sectionUsers: ManagerSystemUser[], emptyMessage: string) => {
    if (y < 93) nextPage();

    text(sectionTitle, margin, 11, "F2", brand.primary);
    y -= 17;
    drawTableHeader();

    if (!sectionUsers.length) {
      text(emptyMessage, margin + 3, 7.5, "F1", brand.muted);
      y -= 20;
      return;
    }

    sectionUsers.forEach((item, rowIndex) => {
      if (y < 48) {
        nextPage();
        text(`${sectionTitle} (lanjutan)`, margin, 10, "F2", brand.primary);
        y -= 16;
        drawTableHeader();
      }

      if (rowIndex % 2 === 0) rect(margin, y - 11, tableWidth, 17, "#FFF7E6");
      let x = margin;
      userRow(item, rowIndex).forEach((value, columnIndex) => {
        const maxLength = [3, 24, 40, 20, 15, 12][columnIndex];
        const color = columnIndex === headers.length - 1
          ? item.status === "ACTIVE" ? brand.success : brand.danger
          : brand.dark;
        text(truncate(value, maxLength), x + 3, 7, columnIndex === 1 ? "F2" : "F1", color);
        x += columnWidths[columnIndex];
      });
      y -= 17;
    });

    y -= 8;
  };

  const activeUsers = users.filter((item) => item.status === "ACTIVE");
  const inactiveUsers = users.filter((item) => item.status === "INACTIVE");
  const summary = summaryRows(users);

  nextPage();
  text("Ringkasan", margin, 11, "F2", brand.primary);
  y -= 16;
  text(`Total: ${formatNumber(users.length)}  |  Aktif: ${formatNumber(activeUsers.length)}  |  Nonaktif: ${formatNumber(inactiveUsers.length)}`, margin, 7.5, "F1", brand.muted);
  y -= 13;
  text(summary.slice(3).map(([label, value]) => `${label}: ${formatNumber(value)}`).join("  |  "), margin, 7.5, "F1", brand.muted);
  y -= 24;

  drawRows("Daftar Akun Aktif", activeUsers, "Tidak ada akun aktif.");
  drawRows("Daftar Akun Nonaktif", inactiveUsers, "Tidak ada akun nonaktif.");

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
  const fileName = `laporan-pengguna-${formatFileDate()}.${format === "excel" ? "xls" : "pdf"}`;
  const activeCount = users.filter((item) => item.status === "ACTIVE").length;
  const inactiveCount = users.length - activeCount;

  if (format === "excel") {
    triggerDownload(new Blob([excelDocument(users, filterLabel, generatedAt)], { type: "application/vnd.ms-excel;charset=utf-8" }), fileName);
    return {
      fileName,
      message: `Excel berisi sheet semua akun, per role, dan akun nonaktif. Aktif: ${formatNumber(activeCount)}, nonaktif: ${formatNumber(inactiveCount)}.`,
    };
  }

  triggerDownload(new Blob([pdfDocument(users, filterLabel, generatedAt)], { type: "application/pdf" }), fileName);
  return {
    fileName,
    message: `PDF memisahkan tabel akun aktif dan akun nonaktif. Aktif: ${formatNumber(activeCount)}, nonaktif: ${formatNumber(inactiveCount)}.`,
  };
};
