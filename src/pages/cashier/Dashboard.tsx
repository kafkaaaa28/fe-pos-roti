import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  WalletCards,
  AlertTriangle,
} from "lucide-react";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import Toast, { type ToastTone } from "../../components/common/Toast";
import SummaryCard from "../../components/dashboard/SummaryCard";
import Sidebar from "../../components/layout/Sidebar";
import { getCashierDashboard } from "../../services/cashier.service";
import type {
  CashierDashboardData,
  CashierOrderStatus,
  CashierOnlineOrder,
  CashierPaymentMethod,
  CashierPeriod,
  CashierProductStock,
  CashierRecentTransaction,
  CashierStockStatus,
  CashierTransactionType,
} from "../../types/cashier";
import { formatDate, formatNumber, formatRupiah, formatRupiahShort } from "../../utils/formatter";

const periodOptions: { value: CashierPeriod; label: string; helper: string }[] = [
  { value: "today", label: "Hari ini", helper: "Shift berjalan" },
  { value: "week", label: "Minggu ini", helper: "Rekap 7 hari" },
  { value: "month", label: "Bulan ini", helper: "Rekap bulanan" },
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

const statusTone = (status: CashierOrderStatus) => {
  if (status === "COMPLETED" || status === "READY") return "success" as const;
  if (status === "PAID") return "info" as const;
  if (status === "PROCESSING" || status === "PENDING") return "warning" as const;
  return "danger" as const;
};

const stockTone = (status: CashierStockStatus) => {
  if (status === "HABIS") return "danger" as const;
  if (status === "MENIPIS") return "warning" as const;
  return "success" as const;
};

const transactionTypeLabel = (type: CashierTransactionType) => (type === "OFFLINE" ? "POS" : "Online");

const paymentIcon = (method: CashierPaymentMethod) => {
  if (method === "Cash") return Banknote;
  if (method === "QRIS") return WalletCards;
  return CreditCard;
};

function DashboardSection({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 sm:p-6"
    >
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-white/40">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
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

function QuickAction({ icon: Icon, title, description, onClick }: { icon: typeof ShoppingCart; title: string; description: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex min-h-[92px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-accent/50 hover:bg-accent/10"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent transition-all group-hover:bg-accent group-hover:text-dark">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/40">{description}</p>
      </div>
      <ArrowRight size={16} className="text-white/30 transition-all group-hover:translate-x-1 group-hover:text-accent" />
    </motion.button>
  );
}

function TransactionTrendChart({ data }: { data: CashierDashboardData["transactionTrend"] }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <div className="flex h-48 min-w-0 items-end gap-1.5 sm:gap-3">
      {data.map((item, index) => {
        const height = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="group relative flex h-36 w-full min-w-0 items-end">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${height}%`, opacity: 1 }}
                transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full min-w-[20px] rounded-t-xl bg-gradient-to-t from-mint via-accent to-cream shadow-lg shadow-accent/20 sm:min-w-[30px]"
              />
              <div className="pointer-events-none absolute -top-12 left-1/2 hidden w-max -translate-x-1/2 rounded-xl border border-white/10 bg-dark px-3 py-2 text-xs text-white shadow-xl group-hover:block">
                <p className="font-semibold">{formatRupiahShort(item.revenue)}</p>
                <p className="text-white/50">{item.transactions} transaksi</p>
              </div>
            </div>
            <span className="text-[10px] text-white/45 sm:text-xs">{item.label}:00</span>
          </div>
        );
      })}
    </div>
  );
}

function PaymentBreakdown({ data }: { data: CashierDashboardData["paymentBreakdown"] }) {
  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const Icon = paymentIcon(item.method);
        return (
          <div key={item.method}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-2 truncate text-white/70">
                <Icon size={14} className="text-accent" /> {item.method}
              </span>
              <span className="shrink-0 font-semibold text-accent">{formatRupiahShort(item.total)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-mint via-accent to-cream shadow-sm shadow-accent/20"
              />
            </div>
            <p className="mt-1 text-xs text-white/35">{item.count} transaksi • {item.percentage}%</p>
          </div>
        );
      })}
    </div>
  );
}

export default function CashierDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<CashierPeriod>("today");
  const [dashboard, setDashboard] = useState<CashierDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<DetailModalState | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, tone: "success", title: "", message: "" });

  const selectedPeriodLabel = useMemo(
    () => periodOptions.find((item) => item.value === period)?.label ?? "Hari ini",
    [period],
  );

  const showToast = useCallback((tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2600);
  }, []);

  const loadDashboard = useCallback(async (selectedPeriod: CashierPeriod, mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setActionLoading(true);
    }

    const data = await getCashierDashboard(selectedPeriod);
    setDashboard(data);
    setLoading(false);
    setActionLoading(false);

    if (mode === "refresh") {
      showToast("success", "Dashboard diperbarui", "Data POS, pesanan online, transaksi, dan stok produk berhasil dimuat ulang.");
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard(period, "initial");
  }, [period, loadDashboard]);

  const openTransactionDetail = (item: CashierRecentTransaction) => {
    setDetailModal({
      title: `Transaksi ${item.invoiceNumber}`,
      content: (
        <div>
          <DetailRow label="Invoice" value={item.invoiceNumber} />
          <DetailRow label="Customer" value={item.customerName} />
          <DetailRow label="Jenis" value={transactionTypeLabel(item.type)} />
          <DetailRow label="Pembayaran" value={item.paymentMethod} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={statusTone(item.status)} />} />
          <DetailRow label="Total" value={formatRupiah(item.totalPrice)} />
          <DetailRow label="Waktu" value={formatDate(item.createdAt)} />
          <Button className="mt-5 w-full" onClick={() => navigate("/cashier/pos")}>Buka POS</Button>
        </div>
      ),
    });
  };

  const openOrderDetail = (item: CashierOnlineOrder) => {
    setDetailModal({
      title: `Pesanan ${item.orderNumber}`,
      content: (
        <div>
          <DetailRow label="No. Pesanan" value={item.orderNumber} />
          <DetailRow label="Customer" value={item.customerName} />
          <DetailRow label="Item" value={item.items} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={statusTone(item.status)} />} />
          <DetailRow label="Total" value={formatRupiah(item.totalPrice)} />
          <DetailRow label="Masuk" value={formatDate(item.createdAt)} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => navigate("/cashier/orders")}>Kelola Pesanan</Button>
            <Button variant="ghost" onClick={() => showToast("info", "Status disiapkan", "Di backend nanti tombol ini mengubah status order sesuai alur PAID → PROCESSING → READY → COMPLETED.")}>Simulasi Status</Button>
          </div>
        </div>
      ),
    });
  };

  const openStockDetail = (item: CashierProductStock) => {
    setDetailModal({
      title: `Stok Produk - ${item.name}`,
      content: (
        <div>
          <DetailRow label="Produk" value={item.name} />
          <DetailRow label="Stok Saat Ini" value={`${item.stock} pcs`} />
          <DetailRow label="Minimum Stok" value={`${item.minStock} pcs`} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={stockTone(item.status)} />} />
          <p className="mt-5 rounded-xl bg-accent/10 p-4 text-sm leading-6 text-accent">
            Kasir cukup memantau stok produk agar tidak menjual produk kosong. Penyesuaian stok tetap berada pada modul inventory.
          </p>
        </div>
      ),
    });
  };

  if (loading && !dashboard) {
    return <Loading message="Menyiapkan dashboard kasir..." />;
  }

  if (!dashboard) return null;

  const metrics = [
    {
      title: "Pendapatan Hari Ini",
      value: formatRupiahShort(dashboard.summary.todayRevenue),
      icon: WalletCards,
      color: "accent" as const,
      trend: dashboard.trends.todayRevenue.value,
      trendLabel: dashboard.trends.todayRevenue.label,
      detail: "Total pendapatan dari transaksi POS offline dan pesanan online yang sudah dibayar.",
    },
    {
      title: "Transaksi",
      value: `${formatNumber(dashboard.summary.todayTransactions)} trx`,
      icon: ReceiptText,
      color: "primary" as const,
      trend: dashboard.trends.todayTransactions.value,
      trendLabel: dashboard.trends.todayTransactions.label,
      detail: "Jumlah transaksi kasir yang tercatat pada periode berjalan.",
    },
    {
      title: "Pesanan Online",
      value: `${formatNumber(dashboard.summary.onlineOrders)} order`,
      icon: PackageCheck,
      color: "mint" as const,
      trend: dashboard.trends.onlineOrders.value,
      trendLabel: dashboard.trends.onlineOrders.label,
      detail: "Pesanan dari customer online yang masuk ke dashboard kasir.",
    },
    {
      title: "Siap Diambil",
      value: `${formatNumber(dashboard.summary.readyOrders)} order`,
      icon: CheckCircle2,
      color: "cream" as const,
      trend: dashboard.trends.readyOrders.value,
      trendLabel: dashboard.trends.readyOrders.label,
      detail: "Pesanan yang sudah READY dan menunggu customer mengambil di toko.",
    },
  ];

  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">
        {(actionLoading || loading) && <Loading message="Memproses dashboard kasir..." />}
        <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-5 lg:mb-8 xl:flex-row xl:items-end xl:justify-between"
        >
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} /> Dashboard Kasir • POS & Pesanan Online
            </div>
            <h1 className="font-display text-2xl text-white sm:text-3xl md:text-4xl">Dashboard Kasir</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Panel kerja kasir untuk memantau transaksi POS, pesanan online, status pembayaran, riwayat transaksi, dan stok produk sebelum dijual.
            </p>
            <p className="mt-2 text-xs text-white/30">Terakhir diperbarui: {formatDate(dashboard.generatedAt)}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => void loadDashboard(period, "refresh")} className="inline-flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button variant="accent" onClick={() => navigate("/cashier/pos")} className="inline-flex items-center gap-2">
              <ShoppingCart size={16} /> Buka POS
            </Button>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
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
              onClick={() =>
                setDetailModal({
                  title: metric.title,
                  content: (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="font-display text-3xl font-bold text-white">{metric.value}</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">{metric.detail}</p>
                    </div>
                  ),
                })
              }
            />
          ))}
        </div>

        <div className="mb-8 grid gap-4 xl:grid-cols-3">
          <DashboardSection title="Quick Action" subtitle="Aksi utama kasir saat operasional toko">
            <div className="grid gap-3">
              <QuickAction icon={ShoppingCart} title="Buka POS" description="Transaksi offline kasir dan pembayaran langsung" onClick={() => navigate("/cashier/pos")} />
              <QuickAction icon={PackageCheck} title="Pesanan Online" description="Proses order customer dari PAID sampai READY" onClick={() => navigate("/cashier/orders")} />
              <QuickAction icon={ReceiptText} title="Riwayat Transaksi" description="Lihat transaksi terbaru dari POS dan online" onClick={() => showToast("info", "Riwayat transaksi", "Halaman riwayat transaksi detail disiapkan setelah POS dan order online selesai.")} />
            </div>
          </DashboardSection>

          <DashboardSection title="Grafik Transaksi" subtitle={`Pendapatan dan jumlah transaksi ${selectedPeriodLabel.toLowerCase()}`}>
            <TransactionTrendChart data={dashboard.transactionTrend} />
          </DashboardSection>

          <DashboardSection title="Metode Pembayaran" subtitle="Komposisi pembayaran kasir dan online">
            <PaymentBreakdown data={dashboard.paymentBreakdown} />
          </DashboardSection>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DashboardSection
            title="Pesanan Online Masuk"
            subtitle="Order yang perlu diproses kasir"
            action={<Button size="sm" variant="ghost" onClick={() => navigate("/cashier/orders")}>Kelola Order</Button>}
          >
            <div className="space-y-3">
              {dashboard.onlineOrders.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openOrderDetail(item)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-accent/40 hover:bg-accent/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.orderNumber}</p>
                    <p className="mt-1 truncate text-xs text-white/40">{item.customerName} • {item.items}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-white/30"><Clock3 size={12} /> {formatDate(item.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-2 text-sm font-semibold text-accent">{formatRupiahShort(item.totalPrice)}</p>
                    <StatusBadge label={item.status} tone={statusTone(item.status)} />
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Transaksi Terbaru"
            subtitle="Gabungan POS offline dan online"
            action={<StatusBadge label={`${formatNumber(dashboard.summary.soldProducts)} produk terjual`} tone="info" />}
          >
            <div className="space-y-3">
              {dashboard.recentTransactions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openTransactionDetail(item)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-mint/40 hover:bg-mint/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.invoiceNumber}</p>
                    <p className="mt-1 text-xs text-white/40">{transactionTypeLabel(item.type)} • {item.paymentMethod} • {formatDate(item.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="mb-2 text-sm font-semibold text-accent">{formatRupiahShort(item.totalPrice)}</p>
                    <StatusBadge label={item.status} tone={statusTone(item.status)} />
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>
        </div>

        <div className="mt-4">
          <DashboardSection
            title="Stok Produk Perhatian"
            subtitle="Kasir perlu tahu stok produk sebelum melayani pembelian"
            action={<StatusBadge label="Stok produk" tone="warning" />}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.stockWarnings.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openStockDetail(item)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-1 hover:border-amber-300/40 hover:bg-amber-300/10"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 text-amber-200">
                      <AlertTriangle size={18} />
                    </div>
                    <StatusBadge label={item.status} tone={stockTone(item.status)} />
                  </div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-accent">{item.stock} pcs tersedia</p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-white/35"><Eye size={13} /> Minimum {item.minStock} pcs</p>
                </button>
              ))}
            </div>
          </DashboardSection>
        </div>
      </main>

      <Modal open={Boolean(detailModal)} onClose={() => setDetailModal(null)} title={detailModal?.title} size="lg">
        {detailModal?.content}
      </Modal>
    </div>
  );
}
