import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Loader2, Plus, RefreshCw } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Modal from "../../components/common/Modal";
import Toast, { type ToastTone } from "../../components/common/Toast";
import { createStaffStockMovement, listStaffMaterials, listStaffStockMovements } from "../../services/staff.service";
import type { ManagerMaterial, ManagerStockMovement, StockMovementType } from "../../types/manager";
import { formatDate, formatNumber } from "../../utils/formatter";

const TYPE_COLOR: Record<StockMovementType, string> = {
  IN: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  OUT: "bg-red-500/15 text-red-300 border-red-400/20",
  ADJUSTMENT: "bg-blue-500/15 text-blue-300 border-blue-400/20",
};

const EMPTY_FORM = { materialId: "", type: "IN" as StockMovementType, quantity: "", description: "" };

export default function StockMovements() {
  const [movements, setMovements] = useState<ManagerStockMovement[]>([]);
  const [materials, setMaterials] = useState<ManagerMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ManagerStockMovement | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ open: false, tone: "success" as ToastTone, title: "", message: "" });

  const showToast = (tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2500);
  };

  const loadPage = async () => {
    setLoading(true);
    try {
      const [materialResponse, movementResponse] = await Promise.all([listStaffMaterials(), listStaffStockMovements()]);
      setMaterials(materialResponse.data);
      setMovements(movementResponse.data);
      setForm((current) => ({ ...current, materialId: current.materialId || materialResponse.data[0]?.id || "" }));
    } catch (error) {
      showToast("error", "Gagal memuat stock movement", error instanceof Error ? error.message : "Coba ulangi kembali.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  const selectedMaterial = useMemo(() => materials.find((material) => material.id === form.materialId), [form.materialId, materials]);

  const handleSubmit = async () => {
    const quantity = Number(form.quantity);
    const invalidQuantity = form.type === "ADJUSTMENT" ? quantity < 0 : quantity <= 0;
    if (!form.materialId || Number.isNaN(quantity) || invalidQuantity || !form.description.trim()) {
      showToast("error", "Data belum valid", "Pilih bahan, jenis mutasi, jumlah, dan keterangan.");
      return;
    }

    setSubmitting(true);
    try {
      await createStaffStockMovement({
        materialId: form.materialId,
        type: form.type,
        quantity,
        description: form.description.trim(),
      });
      showToast("success", "Stock movement disimpan", `${selectedMaterial?.name || "Bahan"} berhasil dicatat.`);
      setOpen(false);
      setForm({ ...EMPTY_FORM, materialId: materials[0]?.id || "" });
      await loadPage();
    } catch (error) {
      showToast("error", "Gagal menyimpan stock movement", error instanceof Error ? error.message : "Cek stok bahan baku dan coba ulangi.");
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-1 font-display text-2xl text-white sm:text-3xl">Stock Movement</h1>
            <p className="text-sm text-white/40">Riwayat keluar-masuk stok bahan baku dari endpoint <span className="text-accent">/stock-movements</span>.</p>
          </motion.div>
          <div className="flex gap-3">
            <button onClick={() => void loadPage()} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:border-accent hover:text-accent">
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-dark transition-colors hover:bg-cream">
              <Plus size={16} /> Tambah Movement
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-[820px] text-sm">
              <thead>
                <tr className="bg-white/5 text-white/50">
                  {["Kode", "Bahan", "Jenis", "Jumlah", "Keterangan", "Tanggal", "Aksi"].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-white/45"><Loader2 className="mx-auto mb-2 animate-spin text-accent" /> Memuat stock movement...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-white/45">Belum ada mutasi stok.</td></tr>
                ) : movements.map((movement, index) => (
                  <tr key={movement.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-5 py-3 font-mono text-xs text-accent">{movement.id}</td>
                    <td className="px-5 py-3 font-medium text-white">{movement.itemName}</td>
                    <td className="px-5 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${TYPE_COLOR[movement.type]}`}>{movement.type}</span></td>
                    <td className="px-5 py-3 text-white">{formatNumber(movement.quantity)} {movement.unit}</td>
                    <td className="px-5 py-3 text-white/60">{movement.description}</td>
                    <td className="px-5 py-3 text-white/60">{formatDate(movement.createdAt)}</td>
                    <td className="px-5 py-3"><button onClick={() => setDetail(movement)} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10"><Eye size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <Modal open={open} onClose={() => setOpen(false)} title="Tambah Stock Movement">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-white/60">Bahan Baku</label>
              <select value={form.materialId} onChange={(event) => setForm((current) => ({ ...current, materialId: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent">
                {materials.map((material) => <option key={material.id} value={material.id}>{material.name} ({material.stock} {material.unit})</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as StockMovementType, quantity: event.target.value === "ADJUSTMENT" ? String(selectedMaterial?.stock ?? 0) : "" }))} className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent"><option value="IN">IN / Restock</option><option value="OUT">OUT / Keluar</option><option value="ADJUSTMENT">ADJUSTMENT</option></select>
              <input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} type="number" min={form.type === "ADJUSTMENT" ? 0 : 1} className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder={form.type === "ADJUSTMENT" ? "Stok akhir" : "Jumlah perubahan"} />
            </div>
            <p className="text-xs text-white/45">{form.type === "ADJUSTMENT" ? "ADJUSTMENT akan mengatur stok akhir bahan sesuai angka yang diinput." : "IN/OUT akan menambah atau mengurangi stok dari angka saat ini."}</p>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="h-20 w-full resize-none rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder="Keterangan mutasi stok" />
            <button disabled={submitting} onClick={handleSubmit} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent py-3 font-bold text-dark transition-colors hover:bg-cream disabled:opacity-60">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : "Simpan Movement"}
            </button>
          </div>
        </Modal>

        <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Detail Stock Movement">
          {detail && <div className="space-y-3 text-sm"><p className="text-white/50">Kode</p><p className="font-mono text-accent">{detail.id}</p><p className="text-white/50">Bahan</p><p className="text-white">{detail.itemName}</p><p className="text-white/50">Jenis</p><p><span className={`rounded-full border px-2 py-0.5 text-xs ${TYPE_COLOR[detail.type]}`}>{detail.type}</span></p><p className="text-white/50">Jumlah</p><p className="text-white">{formatNumber(detail.quantity)} {detail.unit}</p><p className="text-white/50">Keterangan</p><p className="text-white">{detail.description}</p></div>}
        </Modal>
      </main>
    </div>
  );
}
