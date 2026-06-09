import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Loader2, Plus, RefreshCw } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Modal from "../../components/common/Modal";
import Toast, { type ToastTone } from "../../components/common/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { createStaffProduction, listStaffProductions, listStaffProducts } from "../../services/staff.service";
import type { ManagerProduction, ManagerProduct } from "../../types/manager";
import { formatDate, formatNumber } from "../../utils/formatter";

const STATUS_COLOR: Record<string, string> = {
  SELESAI: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  DIPROSES: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  DIBATALKAN: "bg-red-500/15 text-red-300 border-red-400/20",
};

export default function Productions() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ManagerProduction[]>([]);
  const [products, setProducts] = useState<ManagerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ManagerProduction | null>(null);
  const [form, setForm] = useState({ productId: "", quantity: "", notes: "" });
  const [toast, setToast] = useState({ open: false, tone: "success" as ToastTone, title: "", message: "" });

  const currentStaffName = useMemo(() => user?.name || "Petugas login", [user?.name]);

  const showToast = (tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2500);
  };

  const loadPage = async () => {
    setLoading(true);
    try {
      const [productResponse, productionResponse] = await Promise.all([listStaffProducts(), listStaffProductions()]);
      setProducts(productResponse.data.filter((product) => product.status === "ACTIVE"));
      setHistory(productionResponse.data);
      setForm((current) => ({ ...current, productId: current.productId || productResponse.data[0]?.id || "" }));
    } catch (error) {
      showToast("error", "Gagal memuat produksi", error instanceof Error ? error.message : "Coba ulangi kembali.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  const resetForm = () => setForm({ productId: products[0]?.id || "", quantity: "", notes: "" });

  const handleSubmit = async () => {
    const quantity = Number(form.quantity);

    if (!form.productId || Number.isNaN(quantity) || quantity <= 0) {
      showToast("error", "Produksi belum valid", "Pilih produk dan isi jumlah produksi lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      await createStaffProduction({
        productId: form.productId,
        quantity,
        notes: form.notes.trim() || "Produksi oleh staff",
      });
      const productName = products.find((item) => item.id === form.productId)?.name || "Produk";
      showToast("success", "Produksi disimpan", `${formatNumber(quantity)} pcs ${productName} berhasil dicatat oleh ${currentStaffName}.`);
      setOpen(false);
      resetForm();
      await loadPage();
    } catch (error) {
      showToast("error", "Gagal menyimpan produksi", error instanceof Error ? error.message : "Cek recipe/BOM dan stok bahan baku.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8">
          <div>
            <h1 className="mb-1 font-display text-2xl text-white sm:text-3xl">Produksi</h1>
            <p className="text-sm text-white/40">Catat produksi roti ke backend. Stok bahan, stok produk, dan stock movement diproses otomatis oleh BE.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadPage()} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:border-accent hover:text-accent">
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-dark transition-colors hover:bg-cream">
              <Plus size={16} /> Produksi Baru
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] text-sm">
              <thead>
                <tr className="bg-white/5 text-white/50">
                  {["Kode", "Produk", "Jumlah", "Tanggal", "Petugas", "Status", "Aksi"].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-white/45"><Loader2 className="mx-auto mb-2 animate-spin text-accent" /> Memuat produksi...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-white/45">Belum ada riwayat produksi.</td></tr>
                ) : history.map((item, index) => (
                  <tr key={item.id} className={`border-t border-white/5 transition-colors hover:bg-white/5 ${index % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
                    <td className="px-5 py-3 font-medium text-white">{item.productName}</td>
                    <td className="px-5 py-3 font-semibold text-accent">{formatNumber(item.quantity)} pcs</td>
                    <td className="px-5 py-3 text-white/60">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-3 text-white/60">{item.userName}</td>
                    <td className="px-5 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLOR[item.status] ?? STATUS_COLOR.SELESAI}`}>{item.status}</span></td>
                    <td className="px-5 py-3"><button onClick={() => setDetail(item)} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10"><Eye size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <Modal open={open} onClose={() => setOpen(false)} title="Produksi Roti Baru">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-dark/60 p-4">
              <p className="text-xs text-white/40">Petugas Produksi</p>
              <p className="mt-1 font-semibold text-white">{currentStaffName}</p>
              <p className="mt-1 text-xs text-white/40">Backend mengambil userId dari token, FE hanya mengirim produk, jumlah, dan catatan.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/60">Pilih Produk</label>
              <select value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent">
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/60">Jumlah Produksi</label>
              <input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} type="number" min={1} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder="50" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/60">Catatan</label>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="h-20 w-full resize-none rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder="Opsional..." />
            </div>
            <button disabled={submitting} onClick={handleSubmit} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent py-3 font-bold text-dark transition-colors hover:bg-cream disabled:opacity-60">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : "Simpan Produksi"}
            </button>
          </div>
        </Modal>

        <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Detail Produksi">
          {detail && <div className="space-y-3 text-sm"><p className="text-white/50">Kode Produksi</p><p className="font-mono text-accent">{detail.id}</p><p className="text-white/50">Produk</p><p className="text-white">{detail.productName}</p><p className="text-white/50">Jumlah</p><p className="text-white">{formatNumber(detail.quantity)} pcs</p><p className="text-white/50">Tanggal</p><p className="text-white">{formatDate(detail.createdAt)}</p><p className="text-white/50">Petugas</p><p className="text-white">{detail.userName}</p><p className="text-white/50">Catatan</p><p className="text-white">{detail.notes || "-"}</p></div>}
        </Modal>
      </main>
    </div>
  );
}
