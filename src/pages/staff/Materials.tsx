import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit, Eye, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Modal from "../../components/common/Modal";
import Toast, { type ToastTone } from "../../components/common/Toast";
import { getApiErrorMessage } from "../../services/error";
import {
  createManagerMaterial,
  deleteManagerMaterial,
  getInventoryStatus,
  listManagerMaterials,
  updateManagerMaterial,
} from "../../services/manager.service";
import type { ManagerMaterial, MaterialPayload } from "../../types/manager";
import { formatDate, formatNumber } from "../../utils/formatter";

type MaterialStatus = "AMAN" | "MENIPIS" | "HABIS";

const STATUS_COLOR: Record<MaterialStatus, string> = {
  AMAN: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  MENIPIS: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  HABIS: "bg-red-500/15 text-red-300 border-red-400/20",
};

const EMPTY_FORM = { name: "", unit: "Kg", stock: "", minStock: "", supplierName: "-" };

export default function Materials() {
  const [materials, setMaterials] = useState<ManagerMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "detail" | "delete" | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<ManagerMaterial | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ open: false, tone: "success" as ToastTone, title: "", message: "" });

  const showToast = (tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2500);
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await listManagerMaterials();
      setMaterials(response.data);
    } catch (error) {
      showToast("error", "Gagal memuat bahan", getApiErrorMessage(error, "Coba ulangi kembali."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMaterials();
  }, []);

  const filteredMaterials = useMemo(
    () => materials.filter((material) => [material.id, material.name, material.unit, getInventoryStatus(material.stock, material.minStock)].join(" ").toLowerCase().includes(search.toLowerCase())),
    [materials, search]
  );

  const openAdd = () => {
    setSelectedMaterial(null);
    setForm(EMPTY_FORM);
    setMode("add");
  };

  const openEdit = (material: ManagerMaterial) => {
    setSelectedMaterial(material);
    setForm({
      name: material.name,
      unit: material.unit,
      stock: String(material.stock),
      minStock: String(material.minStock),
      supplierName: material.supplierName || "-",
    });
    setMode("edit");
  };

  const closeModal = () => {
    setMode(null);
    setSelectedMaterial(null);
    setSubmitting(false);
  };

  const buildPayload = (): MaterialPayload | null => {
    const stock = Number(form.stock);
    const minStock = Number(form.minStock);
    if (!form.name.trim() || !form.unit.trim() || Number.isNaN(stock) || Number.isNaN(minStock) || stock < 0 || minStock < 0) return null;
    return {
      name: form.name.trim(),
      unit: form.unit.trim(),
      stock,
      minStock,
      supplierName: form.supplierName.trim() || "-",
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) {
      showToast("error", "Data belum valid", "Nama, satuan, stok, dan minimum stok harus diisi dengan benar.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "add") {
        await createManagerMaterial(payload);
        showToast("success", "Bahan ditambahkan", `${payload.name} berhasil disimpan ke backend.`);
      }
      if (mode === "edit" && selectedMaterial) {
        await updateManagerMaterial(selectedMaterial.id, payload);
        showToast("success", "Bahan diperbarui", `${payload.name} berhasil diperbarui.`);
      }
      closeModal();
      await loadMaterials();
    } catch (error) {
      showToast("error", "Gagal menyimpan bahan", getApiErrorMessage(error, "Coba ulangi kembali."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;
    setSubmitting(true);
    try {
      await deleteManagerMaterial(selectedMaterial.id);
      showToast("success", "Bahan dihapus", `${selectedMaterial.name} berhasil dihapus.`);
      closeModal();
      await loadMaterials();
    } catch (error) {
      showToast("error", "Gagal menghapus bahan", getApiErrorMessage(error, "Coba ulangi kembali."));
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
            <h1 className="mb-1 font-display text-2xl text-white sm:text-3xl">Bahan Baku</h1>
            <p className="text-sm text-white/40">Kelola bahan baku langsung ke endpoint <span className="text-accent">/materials</span>.</p>
          </motion.div>
          <button onClick={openAdd} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-dark transition-colors hover:bg-cream">
            <Plus size={16} /> Tambah Bahan
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari bahan, satuan, status..." className="w-full rounded-xl border border-white/10 bg-dark py-2.5 pl-9 pr-4 text-sm text-white outline-none focus:border-accent" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] text-sm">
              <thead>
                <tr className="bg-white/5 text-white/50">
                  {["Kode", "Bahan", "Satuan", "Stok", "Min Stok", "Status", "Update", "Aksi"].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-white/45"><Loader2 className="mx-auto mb-2 animate-spin text-accent" /> Memuat bahan baku...</td></tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-white/45">Belum ada bahan baku.</td></tr>
                ) : filteredMaterials.map((material, index) => {
                  const status = getInventoryStatus(material.stock, material.minStock);
                  return (
                    <tr key={material.id} className={`border-t border-white/5 transition-colors hover:bg-white/5 ${index % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-5 py-3 font-mono text-xs text-accent">{material.id}</td>
                      <td className="px-5 py-3 font-medium text-white">{material.name}</td>
                      <td className="px-5 py-3 text-white/60">{material.unit}</td>
                      <td className="px-5 py-3 text-white">{formatNumber(material.stock)}</td>
                      <td className="px-5 py-3 text-white/60">{formatNumber(material.minStock)}</td>
                      <td className="px-5 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLOR[status]}`}>{status}</span></td>
                      <td className="px-5 py-3 text-white/50">{formatDate(material.updatedAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedMaterial(material); setMode("detail"); }} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10"><Eye size={15} /></button>
                          <button onClick={() => openEdit(material)} className="touch-action-btn rounded-lg bg-accent/15 p-2 text-accent hover:bg-accent/25"><Edit size={15} /></button>
                          <button onClick={() => { setSelectedMaterial(material); setMode("delete"); }} className="touch-action-btn rounded-lg bg-red-900/20 p-2 text-red-300 hover:bg-red-900/40"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <Modal open={mode === "add" || mode === "edit"} onClose={closeModal} title={mode === "add" ? "Tambah Bahan" : "Edit Bahan"}>
          <div className="space-y-4">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder="Nama bahan" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder="Satuan" />
              <input value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} type="number" className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder="Stok" />
              <input value={form.minStock} onChange={(event) => setForm((current) => ({ ...current, minStock: event.target.value }))} type="number" className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-accent" placeholder="Min stok" />
            </div>
            <button disabled={submitting} onClick={handleSubmit} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent py-3 font-bold text-dark transition-colors hover:bg-cream disabled:opacity-60">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : mode === "add" ? "Simpan Bahan" : "Simpan Perubahan"}
            </button>
          </div>
        </Modal>

        <Modal open={mode === "detail"} onClose={closeModal} title="Detail Bahan Baku">
          {selectedMaterial && <div className="space-y-3 text-sm"><p className="text-white/50">Kode Bahan</p><p className="font-mono text-accent">{selectedMaterial.id}</p><p className="text-white/50">Nama Bahan</p><p className="font-semibold text-white">{selectedMaterial.name}</p><p className="text-white/50">Stok</p><p className="text-white">{formatNumber(selectedMaterial.stock)} {selectedMaterial.unit}</p><p className="text-white/50">Minimum Stok</p><p className="text-white">{formatNumber(selectedMaterial.minStock)} {selectedMaterial.unit}</p></div>}
        </Modal>

        <Modal open={mode === "delete"} onClose={closeModal} title="Hapus Bahan">
          <p className="text-sm leading-6 text-white/70">Yakin ingin menghapus bahan <span className="font-semibold text-white">{selectedMaterial?.name}</span>?</p>
          <div className="mt-5 flex gap-3">
            <button onClick={closeModal} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70">Batal</button>
            <button disabled={submitting} onClick={handleDelete} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">Hapus</button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
