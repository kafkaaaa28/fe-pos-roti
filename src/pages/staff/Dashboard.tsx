import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Boxes, BookOpen, Eye, Factory, Gauge, PackageCheck, PlayCircle, RefreshCw, Scale } from 'lucide-react';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import Toast, { type ToastTone } from '../../components/common/Toast';
import SummaryCard from '../../components/dashboard/SummaryCard';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { getStaffDashboard } from '../../services/staff.service';
import type { StaffDashboardData, StaffMaterialAlert, StaffPeriod, StaffProductionQueue, StaffProductionRecord, StaffRecipeOverview, StaffStockMovement, StaffStockStatus, StaffMovementType, StaffProductionStatus } from '../../types/staff';
import { formatDate, formatNumber } from '../../utils/formatter';

const periodOptions: { value: StaffPeriod; label: string; helper: string }[] = [
  { value: 'today', label: 'Hari ini', helper: 'Shift berjalan' },
  { value: 'week', label: 'Minggu ini', helper: 'Produksi 7 hari' },
  { value: 'month', label: 'Bulan ini', helper: 'Rekap bulanan' },
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

const stockTone = (status: StaffStockStatus) => {
  if (status === 'HABIS') return 'danger' as const;
  if (status === 'MENIPIS') return 'warning' as const;
  return 'success' as const;
};

const productionTone = (status: StaffProductionStatus) => {
  if (status === 'SELESAI') return 'success' as const;
  if (status === 'DIPROSES') return 'info' as const;
  return 'warning' as const;
};

const movementTone = (type: StaffMovementType) => {
  if (type === 'IN') return 'success' as const;
  if (type === 'OUT') return 'danger' as const;
  return 'info' as const;
};

function DashboardSection({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 sm:p-6">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
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

function QuickAction({ icon: Icon, title, description, onClick }: { icon: typeof Factory; title: string; description: string; onClick: () => void }) {
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

function ProductionTrendChart({ data }: { data: StaffDashboardData['productionTrend'] }) {
  const maxQuantity = Math.max(...data.map((item) => item.quantity), 1);

  return (
    <div className="flex h-48 items-end gap-3">
      {data.map((item, index) => {
        const height = Math.max(10, Math.round((item.quantity / maxQuantity) * 100));
        return (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="group relative flex h-36 w-full items-end">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${height}%`, opacity: 1 }}
                transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-t-xl bg-gradient-to-t from-mint via-accent to-cream shadow-lg shadow-accent/20 transition-all group-hover:brightness-110"
              />
              <div className="pointer-events-none absolute -top-12 left-1/2 hidden w-max -translate-x-1/2 rounded-xl border border-white/10 bg-dark px-3 py-2 text-xs text-white shadow-xl group-hover:block">
                <p className="font-semibold">{formatNumber(item.quantity)} pcs</p>
                <p className="text-white/50">{item.label}</p>
              </div>
            </div>
            <span className="text-xs text-white/45">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProductProductionBars({ data }: { data: StaffDashboardData['productionByProduct'] }) {
  const maxQuantity = Math.max(...data.map((item) => item.quantity), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const width = Math.max(8, Math.round((item.quantity / maxQuantity) * 100));
        return (
          <div key={item.productName}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-white/70">{item.productName}</span>
              <span className="shrink-0 font-semibold text-accent">{formatNumber(item.quantity)} pcs</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-mint via-accent to-cream shadow-sm shadow-accent/20"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<StaffPeriod>('today');
  const [dashboard, setDashboard] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<DetailModalState | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, tone: 'success', title: '', message: '' });
  const currentStaffName = user?.name || 'Staff Produksi';

  const selectedPeriodLabel = useMemo(() => periodOptions.find((item) => item.value === period)?.label ?? 'Hari ini', [period]);

  const showToast = useCallback((tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2600);
  }, []);

  const loadDashboard = useCallback(
    async (selectedPeriod: StaffPeriod, mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setActionLoading(true);
      }

      const data = await getStaffDashboard(selectedPeriod);
      setDashboard(data);
      setLoading(false);
      setActionLoading(false);

      if (mode === 'refresh') {
        showToast('success', 'Dashboard diperbarui', 'Data produksi, bahan baku, recipe, dan stock movement berhasil dimuat ulang.');
      }
    },
    [showToast],
  );

  useEffect(() => {
    void loadDashboard(period, 'initial');
  }, [period, loadDashboard]);

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
            Data ini disiapkan mengikuti kontrak <strong>GET /dashboard/staff</strong>, jadi nanti dashboard tinggal dihubungkan ke backend.
          </p>
        </div>
      ),
    });
  };

  const openProductionDetail = (item: StaffProductionRecord) => {
    setDetailModal({
      title: `Detail Produksi ${item.id}`,
      content: (
        <div>
          <DetailRow label="Kode Produksi" value={item.id} />
          <DetailRow label="Produk" value={item.productName} />
          <DetailRow label="Jumlah" value={`${formatNumber(item.quantity)} pcs`} />
          <DetailRow label="Petugas" value={item.staffName} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={productionTone(item.status)} />} />
          <DetailRow label="Waktu" value={formatDate(item.createdAt)} />
          <DetailRow label="Catatan" value={item.notes} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={() => navigate('/staff/productions')}>
              Buka Produksi
            </Button>
            <Button className="flex-1" variant="ghost" onClick={() => navigate('/staff/stock-movements')}>
              Lihat Movement
            </Button>
          </div>
        </div>
      ),
    });
  };

  const openMaterialDetail = (item: StaffMaterialAlert) => {
    setDetailModal({
      title: `Detail Bahan - ${item.name}`,
      content: (
        <div>
          <DetailRow label="Nama Bahan" value={item.name} />
          <DetailRow label="Stok Saat Ini" value={`${item.stock} ${item.unit}`} />
          <DetailRow label="Minimum Stok" value={`${item.minStock} ${item.unit}`} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={stockTone(item.status)} />} />
          <DetailRow label="Saran Operasional" value={item.suggestedAction} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={() => navigate('/staff/materials')}>
              Kelola Bahan
            </Button>
            <Button className="flex-1" variant="ghost" onClick={() => navigate('/staff/inventory')}>
              Cek Inventory
            </Button>
          </div>
        </div>
      ),
    });
  };

  const openRecipeDetail = (item: StaffRecipeOverview) => {
    setDetailModal({
      title: `Kesiapan Recipe - ${item.productName}`,
      content: (
        <div>
          <DetailRow label="Produk" value={item.productName} />
          <DetailRow label="Jumlah Bahan" value={`${item.materialCount} bahan`} />
          <DetailRow label="Estimasi Output" value={`${formatNumber(item.estimatedOutput)} pcs`} />
          <DetailRow label="Kesiapan Bahan" value={<StatusBadge label={item.readiness} tone={stockTone(item.readiness)} />} />
          <DetailRow label="Catatan" value={item.note} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={() => navigate('/staff/recipes')}>
              Buka Recipe
            </Button>
            <Button className="flex-1" variant="ghost" onClick={() => navigate('/staff/productions')}>
              Mulai Produksi
            </Button>
          </div>
        </div>
      ),
    });
  };

  const openMovementDetail = (item: StaffStockMovement) => {
    setDetailModal({
      title: `Stock Movement ${item.id}`,
      content: (
        <div>
          <DetailRow label="Item" value={item.itemName} />
          <DetailRow label="Jenis" value={<StatusBadge label={item.type} tone={movementTone(item.type)} />} />
          <DetailRow label="Jumlah" value={`${item.quantity} ${item.unit}`} />
          <DetailRow label="Keterangan" value={item.description} />
          <DetailRow label="Tanggal" value={formatDate(item.createdAt)} />
          <div className="mt-5">
            <Button className="w-full" onClick={() => navigate('/staff/stock-movements')}>
              Buka Stock Movement
            </Button>
          </div>
        </div>
      ),
    });
  };

  const openQueueDetail = (item: StaffProductionQueue) => {
    setDetailModal({
      title: `Antrian Produksi - ${item.productName}`,
      content: (
        <div>
          <DetailRow label="Produk" value={item.productName} />
          <DetailRow label="Target Produksi" value={`${formatNumber(item.targetQuantity)} pcs`} />
          <DetailRow label="Prioritas" value={<StatusBadge label={item.priority} tone={item.priority === 'TINGGI' ? 'warning' : 'info'} />} />
          <DetailRow label="Status" value={<StatusBadge label={item.status} tone={productionTone(item.status)} />} />
          <DetailRow label="Target Selesai" value={item.dueTime} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={() => navigate('/staff/productions')}>
              Buka Produksi
            </Button>
            <Button className="flex-1" variant="ghost" onClick={() => showToast('info', 'Checklist disiapkan', `Checklist bahan untuk ${item.productName} siap dilihat di modul Recipe/BOM.`)}>
              Cek Checklist
            </Button>
          </div>
        </div>
      ),
    });
  };

  if (loading || !dashboard) {
    return <Loading message="Memuat dashboard staff..." />;
  }
  console.log(`tes`, dashboard?.productionTrend);

  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />
      {actionLoading && <Loading message="Memproses data staff..." />}

      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <ChefBadge /> Staff Operasional Produksi
              </div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl lg:text-4xl">Dashboard Staff</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Panel kerja {currentStaffName} untuk produksi roti, monitoring bahan baku, recipe/BOM, inventory, dan stock movement.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="ghost" onClick={() => void loadDashboard(period, 'refresh')}>
                <RefreshCw size={16} /> Refresh
              </Button>
              <Button onClick={() => navigate('/staff/productions')}>
                <PlayCircle size={16} /> Produksi Baru
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {periodOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={`rounded-2xl border p-4 text-left transition-all ${period === item.value ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10' : 'border-white/10 bg-surface hover:border-white/20'}`}
            >
              <p className={period === item.value ? 'font-semibold text-accent' : 'font-semibold text-white'}>{item.label}</p>
              <p className="mt-1 text-xs text-white/40">{item.helper}</p>
            </button>
          ))}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Produksi"
            value={`${formatNumber(dashboard.summary.todayProduction)} pcs`}
            icon={Factory}
            color="primary"
            trend={12}
            trendLabel={selectedPeriodLabel}
            onClick={() => openMetricDetail('Total Produksi', `${formatNumber(dashboard.summary.todayProduction)} pcs`, 'Jumlah produk jadi yang tercatat pada periode dashboard staff.')}
          />
          <SummaryCard
            title="Recipe Aktif"
            value={`${formatNumber(dashboard.summary.activeRecipes)} BOM`}
            icon={BookOpen}
            color="accent"
            trendLabel="Siap dipakai produksi"
            onClick={() => openMetricDetail('Recipe/BOM Aktif', `${formatNumber(dashboard.summary.activeRecipes)} BOM`, 'Recipe dipakai untuk membaca kebutuhan bahan saat staff membuat produksi baru.')}
          />
          <SummaryCard
            title="Bahan Perhatian"
            value={`${formatNumber(dashboard.summary.materialAlerts)} item`}
            icon={AlertTriangle}
            color="cream"
            trend={-8}
            trendLabel="Menipis / habis"
            onClick={() => openMetricDetail('Bahan Perhatian', `${formatNumber(dashboard.summary.materialAlerts)} item`, 'Bahan yang sudah mendekati batas minimum atau habis sehingga perlu dicek sebelum produksi.')}
          />
          <SummaryCard
            title="Movement"
            value={`${formatNumber(dashboard.summary.stockMovementsToday)} catatan`}
            icon={Scale}
            color="mint"
            trendLabel="Keluar-masuk stok"
            onClick={() => openMetricDetail('Stock Movement', `${formatNumber(dashboard.summary.stockMovementsToday)} catatan`, 'Catatan keluar-masuk stok dari produksi, restock, dan penyesuaian inventory.')}
          />
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <DashboardSection title="Grafik Produksi" subtitle="Jumlah produksi berdasarkan jam/hari/periode yang dipilih." action={<StatusBadge label="API-ready" tone="info" />}>
            <div className="dashboard-chart-wrap">
              <ProductionTrendChart data={dashboard.productionTrend} />
            </div>
          </DashboardSection>

          <DashboardSection title="Produksi per Produk" subtitle="Produk yang paling banyak diproduksi staff.">
            <div className="dashboard-chart-wrap">
              <ProductProductionBars data={dashboard.productionByProduct} />
            </div>
          </DashboardSection>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardSection
            title="Antrian Produksi"
            subtitle="Prioritas kerja produksi yang perlu dipantau staff."
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/staff/productions')}>
                Buka Produksi
              </Button>
            }
          >
            <div className="space-y-3">
              {dashboard.productionQueue.map((item) => (
                <button key={item.id} type="button" onClick={() => openQueueDetail(item)} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{item.productName}</p>
                      <p className="mt-1 text-xs text-white/45">
                        Target {item.targetQuantity} pcs • selesai {item.dueTime}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={item.priority} tone={item.priority === 'TINGGI' ? 'warning' : 'info'} />
                      <StatusBadge label={item.status} tone={productionTone(item.status)} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            title="Bahan Baku Perhatian"
            subtitle="Status stok otomatis berdasarkan stok dan batas minimum."
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/staff/materials')}>
                Kelola Bahan
              </Button>
            }
          >
            <div className="space-y-3">
              {dashboard.materialAlerts.map((item) => (
                <button key={item.id} type="button" onClick={() => openMaterialDetail(item)} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-white/45">
                        Stok {item.stock} {item.unit} • min {item.minStock} {item.unit}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/35">{item.suggestedAction}</p>
                    </div>
                    <StatusBadge label={item.status} tone={stockTone(item.status)} />
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <DashboardSection title="Recipe/BOM Aktif" subtitle="Kesiapan bahan sebelum produksi dijalankan.">
            <div className="space-y-3">
              {dashboard.recipeOverviews.map((item) => (
                <button key={item.id} type="button" onClick={() => openRecipeDetail(item)} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.productName}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {item.materialCount} bahan • estimasi {item.estimatedOutput} pcs
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/35">{item.note}</p>
                    </div>
                    <StatusBadge label={item.readiness} tone={stockTone(item.readiness)} />
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection title="Aksi Cepat Staff" subtitle="Navigasi kerja sesuai tupoksi staff produksi.">
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction icon={PlayCircle} title="Produksi Baru" description="Input produk, jumlah, dan catatan produksi." onClick={() => navigate('/staff/productions')} />
              <QuickAction icon={Boxes} title="Kelola Bahan" description="Tambah, edit, dan cek stok bahan baku." onClick={() => navigate('/staff/materials')} />
              <QuickAction icon={BookOpen} title="Recipe/BOM" description="Cek komposisi bahan sebelum produksi." onClick={() => navigate('/staff/recipes')} />
              <QuickAction icon={Gauge} title="Inventory" description="Pantau stok produk dan bahan baku." onClick={() => navigate('/staff/inventory')} />
            </div>
          </DashboardSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <DashboardSection
            title="Riwayat Produksi Terbaru"
            subtitle="Produksi yang baru dibuat oleh staff."
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/staff/productions')}>
                Semua Riwayat
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="text-white/45">
                    <th className="px-3 py-3 text-left font-semibold">Kode</th>
                    <th className="px-3 py-3 text-left font-semibold">Produk</th>
                    <th className="px-3 py-3 text-left font-semibold">Jumlah</th>
                    <th className="px-3 py-3 text-left font-semibold">Status</th>
                    <th className="px-3 py-3 text-left font-semibold">Waktu</th>
                    <th className="px-3 py-3 text-left font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentProductions.map((item) => (
                    <tr key={item.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                      <td className="px-3 py-3 font-mono text-xs text-accent">{item.id}</td>
                      <td className="px-3 py-3 font-semibold text-white">{item.productName}</td>
                      <td className="px-3 py-3 text-white/70">{item.quantity} pcs</td>
                      <td className="px-3 py-3">
                        <StatusBadge label={item.status} tone={productionTone(item.status)} />
                      </td>
                      <td className="px-3 py-3 text-white/45">{formatDate(item.createdAt)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => openProductionDetail(item)} className="touch-action-btn bg-white/5 text-white/65 hover:bg-white/10 hover:text-white">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Stock Movement Terbaru"
            subtitle="Audit bahan masuk/keluar dari proses produksi dan adjustment."
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/staff/stock-movements')}>
                Semua Movement
              </Button>
            }
          >
            <div className="space-y-3">
              {dashboard.stockMovements.map((item) => (
                <button key={item.id} type="button" onClick={() => openMovementDetail(item)} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-accent/40 hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.itemName}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {item.quantity} {item.unit} • {formatDate(item.createdAt)}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/35">{item.description}</p>
                    </div>
                    <StatusBadge label={item.type} tone={movementTone(item.type)} />
                  </div>
                </button>
              ))}
            </div>
          </DashboardSection>
        </div>

        <Modal open={Boolean(detailModal)} onClose={() => setDetailModal(null)} title={detailModal?.title} size="lg">
          {detailModal?.content}
        </Modal>
      </main>
    </div>
  );
}

function ChefBadge() {
  return <PackageCheck size={14} />;
}
