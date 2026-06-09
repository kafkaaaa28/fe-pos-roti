import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  Factory,
  FileText,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import Toast, { type ToastTone } from "../../components/common/Toast";
import SalesChart from "../../components/dashboard/SalesChart";
import SummaryCard from "../../components/dashboard/SummaryCard";
import ProductionChart from "../../components/dashboard/ProductionChart";
import Sidebar from "../../components/layout/Sidebar";
import { getManagerDashboard } from "../../services/dashboard.service";
import { exportDashboardFile, type DashboardExportFormat } from "../../utils/dashboardExport";
import type {
  DashboardData,
  DashboardPeriod,
  LowStockItem,
  ProductionStatus,
  RecentProduction,
  RecentTransaction,
  StockStatus,
  TransactionStatus,
  TransactionType,
} from "../../types/dashboard";
import { formatDate, formatNumber, formatRupiah, formatRupiahShort } from "../../utils/formatter";

const periodOptions: { value: DashboardPeriod; label: string; helper: string }[] = [
  { value: "today", label: "Hari ini", helper: "Operasional harian" },
  { value: "week", label: "Minggu ini", helper: "Performa 7 hari" },
  { value: "month", label: "Bulan ini", helper: "Ringkasan bulanan" },
  { value: "year", label: "Tahun ini", helper: "Rekap tahunan" },
];

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

const stockTone = (status: StockStatus) => {
  if (status === "HABIS") return "danger" as const;
  if (status === "MENIPIS") return "warning" as const;
  return "success" as const;
};

const transactionTone = (status: TransactionStatus) => {
  if (status === "COMPLETED") return "success" as const;
  if (["READY", "PAID"].includes(status)) return "info" as const;
  if (["PROCESSING", "PENDING"].includes(status)) return "warning" as const;
  return "danger" as const;
};

const transactionTypeLabel = (type: TransactionType) => (type === "OFFLINE" ? "POS" : "Online");

const productionTone = (status: ProductionStatus) => {
  if (status === "Selesai") return "success" as const;
  if (status === "Diproses") return "info" as const;
  return "warning" as const;
};

function DashboardSection({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 sm:p-6"
    >
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-white/40">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

function QuickAction({ icon: Icon, title, description, onClick }: { icon: typeof Package; title: string; description: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-accent/50 hover:bg-accent/10"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent transition-all group-hover:bg-accent group-hover:text-dark">
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-white/40">{description}</p>
      </div>
      <ArrowRight size={16} className="text-white/30 transition-all group-hover:translate-x-1 group-hover:text-accent" />
    </motion.button>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <span className="text-sm text-white/45">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<DetailModalState | null>(null);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<DashboardExportFormat>("excel");
  const [successModal, setSuccessModal] = useState<DetailModalState | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, tone: "success", title: "", message: "" });

  const showToast = useCallback((tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2600);
  }, []);

  const loadDashboard = useCallback(async (selectedPeriod: DashboardPeriod, mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setActionLoading(true);
    }

    const data = await getManagerDashboard(selectedPeriod);
    setDashboard(data);
    setLoading(false);
    setActionLoading(false);

    if (mode === "refresh") {
      showToast("success", "Dashboard diperbarui", "Data manager berhasil dimuat ulang dari service dashboard.");
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard(period, "initial");
  }, [period, loadDashboard]);

  const selectedPeriodLabel = useMemo(
    () => periodOptions.find((item) => item.value === period)?.label ?? "Minggu ini",
    [period],
  );

  const openMetricDetail = (title: string, value: string, description: string) => {
    setDetailModal({
      title,
      content: (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="font-display text-3xl font-bold text-white">{value}</p>
            <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
          </div>
            <p className="rounded-xl bg-accent/10 p-4 text-sm text-accent">
            Data ini mengikuti pola endpoint <strong>GET /dashboard/manager</strong> dan akan menampilkan state kosong atau error bila backend belum mengirim data.
          </p>
        </div>
      ),
    });
  };

  const openStockDetail = (item: LowStockItem) => {
    setDetailModal({
      title: `Detail Stok - ${item.name}`,
      content: (
        <div>
          <DetailRow label="Nama" value={item.name} />
          <DetailRow label="Jenis" value={item.type} />
          <DetailRow label="Stok Saat Ini" value={`${item.stock} ${item.unit}`} />
          <DetailRow label="Minimum Stok" value={`${item.minStock} ${item.unit}`} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={stockTone(item.status)} />} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={() => navigate("/manager/inventory")}>Buka Inventory</Button>
            <Button
              className="flex-1"
              variant="ghost"
              onClick={() => showToast("info", "Pengingat dibuat", `Catatan restock ${item.name} disiapkan untuk modul inventory.`)}
            >
              Buat Pengingat
            </Button>
          </div>
        </div>
      ),
    });
  };

  const openTransactionDetail = (item: RecentTransaction) => {
    setDetailModal({
      title: `Transaksi ${item.invoiceNumber}`,
      content: (
        <div>
          <DetailRow label="Invoice" value={item.invoiceNumber} />
          <DetailRow label="Customer" value={item.customerName} />
          <DetailRow label="Jenis" value={transactionTypeLabel(item.type)} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={transactionTone(item.status)} />} />
          <DetailRow label="Total" value={formatRupiah(item.totalPrice)} />
          <DetailRow label="Waktu" value={formatDate(item.createdAt)} />
          <div className="mt-5">
            <Button onClick={() => navigate("/manager/reports")} className="w-full">
              Buka Data Terkait
            </Button>
          </div>
        </div>
      ),
    });
  };

  const openProductionDetail = (item: RecentProduction) => {
    setDetailModal({
      title: `Produksi ${item.productName}`,
      content: (
        <div>
          <DetailRow label="Produk" value={item.productName} />
          <DetailRow label="Jumlah" value={`${formatNumber(item.quantity)} pcs`} />
          <DetailRow label="Petugas" value={item.userName} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={productionTone(item.status)} />} />
          <DetailRow label="Tanggal" value={formatDate(item.createdAt)} />
          <div className="mt-5">
            <Button onClick={() => navigate("/manager/productions")} className="w-full">Buka Riwayat Produksi</Button>
          </div>
        </div>
      ),
    });
  };

  const handleExport = async (format: DashboardExportFormat) => {
    if (!dashboard) return;

    setExportConfirmOpen(false);
    setActionLoading(true);

    await new Promise((resolve) => window.setTimeout(resolve, 450));
    const result = exportDashboardFile({ dashboard, period, periodLabel: selectedPeriodLabel, format });

    setActionLoading(false);
    showToast("success", "Export berhasil", `${format.toUpperCase()} berhasil dibuat dan diunduh.`);
    setSuccessModal({
      title: "Export Berhasil",
      content: (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={34} />
          </div>
          <p className="text-white font-semibold">{result.fileName}</p>
          <p className="mt-2 text-sm leading-6 text-white/55">{result.message}</p>
          <p className="mt-3 rounded-xl bg-white/[0.03] p-3 text-xs leading-5 text-white/40">
            Saat backend sudah jadi, struktur tombol ini tetap bisa dipakai. Nantinya tinggal arahkan ke endpoint export backend dengan parameter periode dan format, tanpa perlu mengubah alur tombol export.
          </p>
          <Button className="mt-5 w-full" onClick={() => setSuccessModal(null)}>Selesai</Button>
        </div>
      ),
    });
  };

  if (loading && !dashboard) {
    return <Loading message="Menyiapkan dashboard manager..." />;
  }

  if (!dashboard) {
    return null;
  }

  const metrics = [
    {
      title: "Total Penjualan",
      value: formatRupiahShort(dashboard.summary.totalSales),
      icon: TrendingUp,
      color: "primary" as const,
      trend: dashboard.trends.totalSales.value,
      trendLabel: dashboard.trends.totalSales.label,
      description: "Akumulasi omzet dari transaksi POS dan pesanan online pada periode yang dipilih.",
    },
    {
      title: "Total Produksi",
      value: `${formatNumber(dashboard.summary.totalProduction)} pcs`,
      icon: Factory,
      color: "accent" as const,
      trend: dashboard.trends.totalProduction.value,
      trendLabel: dashboard.trends.totalProduction.label,
      description: "Jumlah produk roti yang berhasil diproduksi berdasarkan riwayat produksi.",
    },
    {
      title: "Produk Terjual",
      value: `${formatNumber(dashboard.summary.totalSoldProducts)} item`,
      icon: ShoppingBag,
      color: "mint" as const,
      trend: dashboard.trends.totalSoldProducts.value,
      trendLabel: dashboard.trends.totalSoldProducts.label,
      description: "Total item produk yang keluar melalui penjualan offline dan online.",
    },
    {
      title: "Jumlah Transaksi",
      value: formatNumber(dashboard.summary.transactionCount),
      icon: ClipboardList,
      color: "cream" as const,
      trend: dashboard.trends.transactionCount.value,
      trendLabel: dashboard.trends.transactionCount.label,
      description: "Jumlah transaksi tercatat dari POS kasir dan order online customer.",
    },
  ];

  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">
        {(actionLoading || loading) && <Loading message="Memproses aksi dashboard..." />}
        <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-5 lg:mb-8 xl:flex-row xl:items-end xl:justify-between"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} /> Dashboard Manager • Monitoring Operasional
            </div>
            <h1 className="font-display text-2xl text-white sm:text-3xl md:text-4xl">Dashboard Manager</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Pusat pantauan cepat untuk penjualan, produksi, inventory, transaksi, dan performa toko. Dashboard ini tidak dipakai untuk CRUD langsung; aksi tambah/edit/hapus tetap berada di halaman modul masing-masing.
            </p>
            <p className="mt-2 text-xs text-white/30">Terakhir diperbarui: {formatDate(dashboard.generatedAt)}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => void loadDashboard(period, "refresh")} className="inline-flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button variant="accent" onClick={() => setExportConfirmOpen(true)} className="inline-flex items-center gap-2">
              <Download size={16} /> Export
            </Button>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {periodOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                period === item.value
                  ? "border-accent/60 bg-accent/15 text-white shadow-lg shadow-accent/10"
                  : "border-white/10 bg-surface text-white/55 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-white/35">{item.helper}</p>
            </button>
          ))}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <SummaryCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              trend={metric.trend}
              trendLabel={metric.trendLabel}
              delay={index * 0.08}
              onClick={() => openMetricDetail(metric.title, metric.value, metric.description)}
            />
          ))}
        </div>

        <div className="mb-8 grid gap-4 xl:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2">
            <div className="dashboard-chart-wrap"><SalesChart data={dashboard.salesChart} /></div>
          </motion.div>
          <div className="dashboard-chart-wrap"><ProductionChart data={dashboard.productionChart} /></div>
        </div>

        <div className="mb-8 rounded-2xl border border-accent/20 bg-accent/10 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">Arah akses manager</p>
              <p className="mt-1 text-sm leading-6 text-white/55">
                Dashboard dipakai untuk monitoring, detail cepat, export, dan navigasi. Aksi CRUD tetap ditempatkan di halaman modul agar alurnya tidak campur.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">Dashboard: monitoring</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">Produksi manager: riwayat</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">User: kelola akses</span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 xl:grid-cols-3">
          <DashboardSection title="Quick Action" subtitle="Navigasi cepat ke halaman detail dan modul kerja">
            <div className="grid gap-3">
              <QuickAction icon={Package} title="Kelola Produk" description="CRUD produk dilakukan di halaman produk" onClick={() => navigate("/manager/products")} />
              <QuickAction icon={Factory} title="Monitoring Produksi" description="Manager hanya melihat riwayat dan detail produksi" onClick={() => navigate("/manager/productions")} />
              <QuickAction icon={Boxes} title="Cek Inventory" description="Monitoring stok, status menipis, dan detail item" onClick={() => navigate("/manager/inventory")} />
              <QuickAction icon={Activity} title="Stock Movement" description="Audit keluar-masuk stok dari seluruh modul" onClick={() => navigate("/manager/stock-movements")} />
              <QuickAction icon={FileText} title="Lihat Laporan" description="Export dan detail laporan per kategori" onClick={() => navigate("/manager/reports")} />
              <QuickAction icon={Users} title="Kelola User" description="Tambah, edit, nonaktifkan, dan hapus akun internal" onClick={() => navigate("/manager/users")} />
            </div>
          </DashboardSection>

          <DashboardSection
            title="Produk Terlaris"
            subtitle={`Top produk pada periode ${selectedPeriodLabel.toLowerCase()}`}
            action={<StatusBadge label={dashboard.summary.bestSellingProduct} tone="success" />}
          >
            <div className="space-y-4">
              {dashboard.bestSellingProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openMetricDetail(item.name, `${item.sold} terjual`, `Pendapatan produk ini mencapai ${formatRupiah(item.revenue)} pada periode ${selectedPeriodLabel.toLowerCase()}.`)}
                  className="w-full text-left"
                >
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-white/80">{item.name}</span>
                    <span className="text-accent">{item.sold} item</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/35">{formatRupiahShort(item.revenue)}</p>
                </button>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Kesehatan Sistem"
            subtitle="Simulasi indikator operasional"
            action={<StatusBadge label="Normal" tone="success" />}
          >
            <div className="space-y-3">
              <DetailRow label="Status API" value={<StatusBadge label="Backend-only" tone="info" />} />
              <DetailRow label="Stok Menipis" value={`${dashboard.summary.lowStockCount} item`} />
              <DetailRow label="Total Pelanggan" value={`${formatNumber(dashboard.summary.customerCount)} customer`} />
              <DetailRow label="Revenue Bulanan" value={formatRupiahShort(dashboard.summary.monthlyRevenue)} />
              <button
                type="button"
                onClick={() => showToast("info", "Health check", "Frontend sudah siap menerima data dashboard dari backend.")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 transition-all hover:border-mint/40 hover:bg-mint/10 hover:text-mint"
              >
                <Activity size={16} /> Cek Status
              </button>
            </div>
          </DashboardSection>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DashboardSection
            title="Stok Menipis"
            subtitle="Bahan baku dan produk yang perlu diperhatikan"
            action={<Button size="sm" variant="ghost" onClick={() => navigate("/manager/inventory")}>Buka Inventory</Button>}
          >
            <div className="overflow-hidden rounded-xl border border-white/10">
              {dashboard.lowStocks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openStockDetail(item)}
                  className="flex w-full items-center justify-between gap-4 border-b border-white/5 px-4 py-3 text-left transition-all last:border-0 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-white/40">{item.type} • min {item.minStock} {item.unit}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-amber-300">{item.stock} {item.unit}</span>
                    <StatusBadge label={item.status} tone={stockTone(item.status)} />
                    <Eye size={16} className="text-white/30" />
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Transaksi Terbaru"
            subtitle="Gabungan transaksi POS dan online"
            action={<Button size="sm" variant="ghost" onClick={() => navigate("/manager/reports")}>Lihat Laporan</Button>}
          >
            <div className="space-y-3">
              {dashboard.recentTransactions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openTransactionDetail(item)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-accent/40 hover:bg-accent/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.invoiceNumber}</p>
                    <p className="mt-1 text-xs text-white/40">{item.customerName} • {transactionTypeLabel(item.type)} • {formatDate(item.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-2 text-sm font-semibold text-accent">{formatRupiahShort(item.totalPrice)}</p>
                    <StatusBadge label={item.status} tone={transactionTone(item.status)} />
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>
        </div>

        <div className="mt-4">
          <DashboardSection
            title="Produksi Terbaru"
            subtitle="Monitoring aktivitas produksi roti"
            action={<Button size="sm" variant="ghost" onClick={() => navigate("/manager/productions")}>Buka Monitoring</Button>}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {dashboard.recentProductions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openProductionDetail(item)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-1 hover:border-mint/40 hover:bg-mint/10"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/15 text-mint">
                      <Factory size={18} />
                    </div>
                    <StatusBadge label={item.status} tone={productionTone(item.status)} />
                  </div>
                  <p className="font-semibold text-white">{item.productName}</p>
                  <p className="mt-1 text-sm text-accent">{formatNumber(item.quantity)} pcs</p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-white/35"><Clock3 size={13} /> {formatDate(item.createdAt)}</p>
                </button>
              ))}
            </div>
          </DashboardSection>
        </div>
      </main>

      <Modal open={Boolean(detailModal)} onClose={() => setDetailModal(null)} title={detailModal?.title} size="lg">
        {detailModal?.content}
      </Modal>

      <Modal open={exportConfirmOpen} onClose={() => setExportConfirmOpen(false)} title="Export Dashboard" size="lg">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm leading-6 text-white/60">
              Pilih format export untuk periode <strong className="text-white">{selectedPeriodLabel}</strong>. Export mengikuti data dashboard yang sedang aktif dan menjaga layout laporan tetap rapi.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setExportFormat("excel")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                exportFormat === "excel" ? "border-emerald-300/60 bg-emerald-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <Download size={20} />
              </div>
              <p className="font-semibold text-white">Excel (.xls)</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Multi-sheet: ringkasan, penjualan, produksi, produk terlaris, stok menipis, dan transaksi.</p>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat("pdf")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                exportFormat === "pdf" ? "border-red-300/60 bg-red-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <FileText size={20} />
              </div>
              <p className="font-semibold text-white">PDF (.pdf)</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Format laporan bertabel dengan header, warna, pemisahan bagian, dan nomor halaman.</p>
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" className="flex-1" onClick={() => setExportConfirmOpen(false)}>Batal</Button>
            <Button variant="accent" className="flex-1" onClick={() => void handleExport(exportFormat)}>
              Export {exportFormat === "excel" ? "Excel" : "PDF"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(successModal)} onClose={() => setSuccessModal(null)} title={successModal?.title} size="sm">
        {successModal?.content}
      </Modal>
    </div>
  );
}
