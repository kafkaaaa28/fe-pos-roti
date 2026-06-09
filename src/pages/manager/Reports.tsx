import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Factory,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  ReceiptText,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import Toast, { type ToastTone } from "../../components/common/Toast";
import Sidebar from "../../components/layout/Sidebar";
import { getReportMeta, reportMetas } from "../../data/mockReports";
import { getManagerReports } from "../../services/report.service";
import type { DashboardPeriod, StockStatus, TransactionStatus } from "../../types/dashboard";
import type {
  ManagerReportsData,
  ProductionReportItem,
  ReportExportFormat,
  ReportSummaryItem,
  ReportType,
  SalesReportItem,
  StockReportItem,
  TransactionReportItem,
} from "../../types/reports";
import { exportReportFile } from "../../utils/reportExport";
import { formatDate, formatNumber, formatRupiah } from "../../utils/formatter";

const periodOptions: { value: DashboardPeriod; label: string; helper: string }[] = [
  { value: "today", label: "Hari ini", helper: "Rekap operasional harian" },
  { value: "week", label: "Minggu ini", helper: "Rekap 7 hari berjalan" },
  { value: "month", label: "Bulan ini", helper: "Laporan bulanan" },
  { value: "year", label: "Tahun ini", helper: "Rekap tahunan" },
];

const reportIcons = {
  sales: ShoppingBag,
  production: Factory,
  stock: Boxes,
  transaction: ReceiptText,
};

interface ToastState {
  open: boolean;
  tone: ToastTone;
  title: string;
  message: string;
}

interface DetailModalState {
  title: string;
  content: ReactNode;
}

const statusTone = (status: TransactionStatus | StockStatus | string) => {
  if (["COMPLETED", "AMAN", "Selesai"].includes(status)) return "success" as const;
  if (["READY", "PAID", "Diproses"].includes(status)) return "info" as const;
  if (["PROCESSING", "PENDING", "MENIPIS", "Tertunda"].includes(status)) return "warning" as const;
  return "danger" as const;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <span className="text-sm text-white/45">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function ReportCard({
  type,
  active,
  summary,
  onClick,
}: {
  type: ReportType;
  active: boolean;
  summary: ReportSummaryItem[];
  onClick: () => void;
}) {
  const meta = getReportMeta(type);
  const Icon = reportIcons[type];
  const mainValue = summary[0]?.value ?? "-";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
        active
          ? "border-accent/70 bg-accent/15 shadow-xl shadow-accent/10"
          : "border-white/10 bg-surface hover:border-primary/50 hover:bg-white/[0.04]"
      }`}
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-accent/20" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-accent ring-1 ring-white/10">
          <Icon size={22} />
        </div>
        {active && <StatusBadge label="Aktif" tone="success" />}
      </div>
      <div className="relative mt-5">
        <h3 className="text-base font-semibold text-white">{meta.title}</h3>
        <p className="mt-1 min-h-[40px] text-sm leading-5 text-white/45">{meta.description}</p>
        <p className="mt-4 font-display text-2xl font-bold text-white">{String(mainValue)}</p>
        <p className="mt-1 text-xs text-white/35">Klik untuk lihat detail, filter, dan download laporan.</p>
      </div>
    </motion.button>
  );
}

function SummaryMiniCard({ item, index }: { item: ReportSummaryItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">{item.label}</p>
      <p className="mt-2 font-display text-xl font-bold text-white">{item.value}</p>
      <p className="mt-1 text-xs text-white/40">{item.helper}</p>
    </motion.div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const [reports, setReports] = useState<ManagerReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ReportExportFormat>("excel");
  const [detailModal, setDetailModal] = useState<DetailModalState | null>(null);
  const [successModal, setSuccessModal] = useState<DetailModalState | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, tone: "success", title: "", message: "" });

  const activeMeta = useMemo(() => getReportMeta(activeReport), [activeReport]);
  const periodLabel = useMemo(() => periodOptions.find((item) => item.value === period)?.label ?? "Minggu ini", [period]);

  const showToast = useCallback((tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2500);
  }, []);

  const loadReports = useCallback(async (selectedPeriod: DashboardPeriod, mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    else setActionLoading(true);

    const data = await getManagerReports(selectedPeriod);
    setReports(data);
    setLoading(false);
    setActionLoading(false);

    if (mode === "refresh") {
      showToast("success", "Laporan diperbarui", "Data laporan berhasil dimuat ulang dari service laporan.");
    }
  }, [showToast]);

  useEffect(() => {
    void loadReports(period, "initial");
  }, [period, loadReports]);

  const openSalesDetail = (item: SalesReportItem) => {
    setDetailModal({
      title: `Detail Penjualan ${item.invoiceNumber}`,
      content: (
        <div>
          <DetailRow label="Tanggal" value={formatDate(item.date)} />
          <DetailRow label="Invoice" value={item.invoiceNumber} />
          <DetailRow label="Customer" value={item.customerName} />
          <DetailRow label="Jenis" value={item.type === "OFFLINE" ? "POS" : "Online"} />
          <DetailRow label="Jumlah Produk" value={`${item.productCount} jenis`} />
          <DetailRow label="Total Qty" value={`${formatNumber(item.totalQty)} item`} />
          <DetailRow label="Total" value={formatRupiah(item.totalPrice)} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={statusTone(item.status)} />} />
        </div>
      ),
    });
  };

  const openProductionDetail = (item: ProductionReportItem) => {
    setDetailModal({
      title: `Detail Produksi ${item.productName}`,
      content: (
        <div>
          <DetailRow label="Tanggal" value={formatDate(item.date)} />
          <DetailRow label="Nomor Produksi" value={item.productionNumber} />
          <DetailRow label="Produk" value={item.productName} />
          <DetailRow label="Jumlah" value={`${formatNumber(item.quantity)} pcs`} />
          <DetailRow label="Petugas" value={item.staffName} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={statusTone(item.status)} />} />
          <DetailRow label="Catatan" value={item.notes} />
        </div>
      ),
    });
  };

  const openStockDetail = (item: StockReportItem) => {
    setDetailModal({
      title: `Detail Stok ${item.name}`,
      content: (
        <div>
          <DetailRow label="ID" value={item.id} />
          <DetailRow label="Nama" value={item.name} />
          <DetailRow label="Jenis" value={item.type} />
          <DetailRow label="Stok" value={`${item.stock} ${item.unit}`} />
          <DetailRow label="Minimum" value={`${item.minStock} ${item.unit}`} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={statusTone(item.status)} />} />
          <DetailRow label="Pergerakan Terakhir" value={item.lastMovement} />
        </div>
      ),
    });
  };

  const openTransactionDetail = (item: TransactionReportItem) => {
    setDetailModal({
      title: `Detail Transaksi ${item.invoiceNumber}`,
      content: (
        <div>
          <DetailRow label="Tanggal" value={formatDate(item.date)} />
          <DetailRow label="Invoice" value={item.invoiceNumber} />
          <DetailRow label="Customer" value={item.customerName} />
          <DetailRow label="Jenis" value={item.type === "OFFLINE" ? "POS" : "Online"} />
          <DetailRow label="Metode Bayar" value={item.paymentMethod} />
          <DetailRow label="Total" value={formatRupiah(item.totalPrice)} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={statusTone(item.status)} />} />
        </div>
      ),
    });
  };

  const handleExport = async (format: ReportExportFormat) => {
    if (!reports) return;
    setExportOpen(false);
    setActionLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    const result = exportReportFile({
      data: reports,
      reportType: activeReport,
      reportTitle: activeMeta.title,
      period,
      periodLabel,
      format,
    });
    setActionLoading(false);
    showToast("success", "Export laporan berhasil", `${format.toUpperCase()} ${activeMeta.title} berhasil diunduh.`);
    setSuccessModal({
      title: "Download Laporan Berhasil",
      content: (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={34} />
          </div>
          <p className="font-semibold text-white">{result.fileName}</p>
          <p className="mt-2 text-sm leading-6 text-white/55">{result.message}</p>
          <p className="mt-3 rounded-xl bg-white/[0.03] p-3 text-xs leading-5 text-white/40">
            Untuk backend nanti, FE ini sudah siap mengikuti endpoint laporan per kategori dengan parameter periode dan format export.
          </p>
          <Button className="mt-5 w-full" onClick={() => setSuccessModal(null)}>Selesai</Button>
        </div>
      ),
    });
  };

  if (loading && !reports) return <Loading message="Menyiapkan laporan manager..." />;
  if (!reports) return null;

  const activeSummary = reports.summaries[activeReport];

  const renderTable = () => {
    if (activeReport === "sales") {
      return (
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="bg-accent text-dark">
            <tr>
              <th className="px-4 py-3 font-bold">Tanggal</th>
              <th className="px-4 py-3 font-bold">Invoice</th>
              <th className="px-4 py-3 font-bold">Customer</th>
              <th className="px-4 py-3 font-bold">Jenis</th>
              <th className="px-4 py-3 font-bold">Qty</th>
              <th className="px-4 py-3 font-bold">Total</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {reports.sales.map((item) => (
              <tr key={item.id} className="bg-surface/70 transition-colors hover:bg-white/[0.04]">
                <td className="px-4 py-3 text-white/60">{formatDate(item.date)}</td>
                <td className="px-4 py-3 font-semibold text-white">{item.invoiceNumber}</td>
                <td className="px-4 py-3 text-white/70">{item.customerName}</td>
                <td className="px-4 py-3 text-white/70">{item.type === "OFFLINE" ? "POS" : "Online"}</td>
                <td className="px-4 py-3 text-white/70">{formatNumber(item.totalQty)} item</td>
                <td className="px-4 py-3 font-semibold text-white">{formatRupiah(item.totalPrice)}</td>
                <td className="px-4 py-3"><StatusBadge label={item.status} tone={statusTone(item.status)} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openSalesDetail(item)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-accent hover:text-accent">
                    <Eye size={14} /> Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeReport === "production") {
      return (
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="bg-accent text-dark">
            <tr>
              <th className="px-4 py-3 font-bold">Tanggal</th>
              <th className="px-4 py-3 font-bold">No Produksi</th>
              <th className="px-4 py-3 font-bold">Produk</th>
              <th className="px-4 py-3 font-bold">Jumlah</th>
              <th className="px-4 py-3 font-bold">Petugas</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {reports.production.map((item) => (
              <tr key={item.id} className="bg-surface/70 transition-colors hover:bg-white/[0.04]">
                <td className="px-4 py-3 text-white/60">{formatDate(item.date)}</td>
                <td className="px-4 py-3 font-semibold text-white">{item.productionNumber}</td>
                <td className="px-4 py-3 text-white/70">{item.productName}</td>
                <td className="px-4 py-3 text-white/70">{formatNumber(item.quantity)} pcs</td>
                <td className="px-4 py-3 text-white/70">{item.staffName}</td>
                <td className="px-4 py-3"><StatusBadge label={item.status} tone={statusTone(item.status)} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openProductionDetail(item)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-accent hover:text-accent">
                    <Eye size={14} /> Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeReport === "stock") {
      return (
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="bg-accent text-dark">
            <tr>
              <th className="px-4 py-3 font-bold">ID</th>
              <th className="px-4 py-3 font-bold">Nama</th>
              <th className="px-4 py-3 font-bold">Jenis</th>
              <th className="px-4 py-3 font-bold">Stok</th>
              <th className="px-4 py-3 font-bold">Minimum</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {reports.stock.map((item) => (
              <tr key={item.id} className="bg-surface/70 transition-colors hover:bg-white/[0.04]">
                <td className="px-4 py-3 font-semibold text-white">{item.id}</td>
                <td className="px-4 py-3 text-white/70">{item.name}</td>
                <td className="px-4 py-3 text-white/70">{item.type}</td>
                <td className="px-4 py-3 text-white/70">{item.stock} {item.unit}</td>
                <td className="px-4 py-3 text-white/70">{item.minStock} {item.unit}</td>
                <td className="px-4 py-3"><StatusBadge label={item.status} tone={statusTone(item.status)} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openStockDetail(item)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-accent hover:text-accent">
                    <Eye size={14} /> Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className="min-w-[920px] w-full text-left text-sm">
        <thead className="bg-accent text-dark">
          <tr>
            <th className="px-4 py-3 font-bold">Tanggal</th>
            <th className="px-4 py-3 font-bold">Invoice</th>
            <th className="px-4 py-3 font-bold">Customer</th>
            <th className="px-4 py-3 font-bold">Jenis</th>
            <th className="px-4 py-3 font-bold">Metode</th>
            <th className="px-4 py-3 font-bold">Total</th>
            <th className="px-4 py-3 font-bold">Status</th>
            <th className="px-4 py-3 font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {reports.transaction.map((item) => (
            <tr key={item.id} className="bg-surface/70 transition-colors hover:bg-white/[0.04]">
              <td className="px-4 py-3 text-white/60">{formatDate(item.date)}</td>
              <td className="px-4 py-3 font-semibold text-white">{item.invoiceNumber}</td>
              <td className="px-4 py-3 text-white/70">{item.customerName}</td>
              <td className="px-4 py-3 text-white/70">{item.type === "OFFLINE" ? "POS" : "Online"}</td>
              <td className="px-4 py-3 text-white/70">{item.paymentMethod}</td>
              <td className="px-4 py-3 font-semibold text-white">{formatRupiah(item.totalPrice)}</td>
              <td className="px-4 py-3"><StatusBadge label={item.status} tone={statusTone(item.status)} /></td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => openTransactionDetail(item)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-accent hover:text-accent">
                  <Eye size={14} /> Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">
        {(actionLoading || loading) && <Loading message="Memproses laporan manager..." />}
        <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-5 lg:mb-8 xl:flex-row xl:items-end xl:justify-between"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} /> Laporan Manager Siap Integrasi BE
            </div>
            <h1 className="font-display text-2xl text-white sm:text-3xl md:text-4xl">Laporan Manager</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Pilih jenis laporan, atur periode, lihat tabel detail, lalu download Excel atau PDF. Data mengikuti response backend yang tersedia saat ini.
            </p>
            <p className="mt-2 text-xs text-white/30">Terakhir diperbarui: {formatDate(reports.generatedAt)}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => void loadReports(period, "refresh")} className="inline-flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button variant="accent" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2">
              <Download size={16} /> Download Laporan
            </Button>
          </div>
        </motion.div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Filter size={16} className="text-accent" /> Filter Periode
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {periodOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  period === item.value ? "border-accent bg-accent/15 text-white" : "border-white/10 bg-white/[0.025] text-white/60 hover:border-primary/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays size={16} /> {item.label}
                </div>
                <p className="mt-1 text-xs text-white/35">{item.helper}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
          {reportMetas.map((meta) => (
            <ReportCard
              key={meta.type}
              type={meta.type}
              active={activeReport === meta.type}
              summary={reports.summaries[meta.type]}
              onClick={() => {
                setActiveReport(meta.type);
                showToast("info", "Jenis laporan dipilih", `${meta.title} siap dilihat dan diunduh.`);
              }}
            />
          ))}
        </div>

        <motion.section
          key={`${activeReport}-${period}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/10 bg-surface p-4 sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/50">
                <BarChart3 size={14} /> {activeMeta.endpoint}
              </div>
              <h2 className="font-display text-2xl text-white">{activeMeta.title}</h2>
              <p className="mt-1 text-sm leading-6 text-white/45">{activeMeta.description}</p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activeSummary.map((item, index) => <SummaryMiniCard key={`${item.label}-${index}`} item={item} index={index} />)}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              {renderTable()}
            </div>
          </div>
        </motion.section>

        <Modal open={exportOpen} onClose={() => setExportOpen(false)} title={`Download ${activeMeta.title}`} size="lg">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Pilih format file</p>
              <p className="mt-1 text-sm leading-6 text-white/45">
                Laporan yang diunduh adalah <strong>{activeMeta.title}</strong> untuk periode <strong>{periodLabel}</strong>.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setExportFormat("excel")}
                className={`rounded-2xl border p-4 text-left transition-all ${exportFormat === "excel" ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 bg-white/[0.03] hover:border-emerald-400/40"}`}
              >
                <FileSpreadsheet className="text-emerald-300" size={24} />
                <p className="mt-3 font-semibold text-white">Excel (.xls)</p>
                <p className="mt-1 text-xs leading-5 text-white/45">Rapi dalam tabel, ada warna header, ringkasan, detail data, dan border.</p>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat("pdf")}
                className={`rounded-2xl border p-4 text-left transition-all ${exportFormat === "pdf" ? "border-red-400/60 bg-red-400/10" : "border-white/10 bg-white/[0.03] hover:border-red-400/40"}`}
              >
                <FileText className="text-red-300" size={24} />
                <p className="mt-3 font-semibold text-white">PDF (.pdf)</p>
                <p className="mt-1 text-xs leading-5 text-white/45">Format laporan formal dengan header, ringkasan, tabel detail, dan nomor halaman.</p>
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="ghost" className="flex-1" onClick={() => setExportOpen(false)}>Batal</Button>
              <Button variant="accent" className="flex-1 inline-flex items-center justify-center gap-2" onClick={() => void handleExport(exportFormat)}>
                <Download size={16} /> Download {exportFormat.toUpperCase()}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title} size="lg">
          {detailModal?.content}
        </Modal>

        <Modal open={!!successModal} onClose={() => setSuccessModal(null)} title={successModal?.title} size="md">
          {successModal?.content}
        </Modal>
      </main>
    </div>
  );
}
