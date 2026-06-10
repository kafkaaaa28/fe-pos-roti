import { useEffect, useMemo, useState } from "react";
import { Eye, SlidersHorizontal } from "lucide-react";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Toast, { type ToastTone } from "../../components/common/Toast";
import ManagerPageShell from "../../components/manager/ManagerPageShell";
import ManagerCrudTable from "../../components/manager/ManagerCrudTable";
import { InventoryStatusPill, ItemTypePill } from "../../components/manager/ManagerBadges";
import { createStockAdjustment, listManagerInventory } from "../../services/manager.service";
import type { ManagerInventoryItem, StockMovementType } from "../../types/manager";
import { formatDate, formatNumber } from "../../utils/formatter";

export default function Inventory() {
  const [inventory, setInventory] = useState<ManagerInventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ManagerInventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<ManagerInventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState({ type: "ADJUSTMENT" as StockMovementType, quantity: "", description: "" });
  const [toast, setToast] = useState({ open: false, tone: "success" as ToastTone, title: "", message: "" });

  const showToast = (tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2300);
  };

  const loadInventory = async () => {
    const response = await listManagerInventory();
    setInventory(response.data);
  };

  useEffect(() => { void loadInventory(); }, []);

  const filtered = useMemo(() => inventory.filter((item) => [item.itemId, item.itemName, item.itemType, item.status].join(" ").toLowerCase().includes(search.toLowerCase())), [inventory, search]);
  const lowStock = inventory.filter((item) => item.status !== "AMAN").length;
  const productCount = inventory.filter((item) => item.itemType === "PRODUCT").length;
  const materialCount = inventory.filter((item) => item.itemType === "MATERIAL").length;

  const openAdjustment = (item: ManagerInventoryItem) => {
    setAdjustItem(item);
    setAdjustment({ type: "ADJUSTMENT", quantity: String(item.stock), description: "" });
  };

  const saveAdjustment = async () => {
    if (!adjustItem) return;
    const quantity = Number(adjustment.quantity);
    if (quantity < 0) {
      showToast("error", "Jumlah belum valid", "Jumlah stok tidak boleh kurang dari 0.");
      return;
    }
    if (adjustment.type !== "ADJUSTMENT" && quantity === 0) {
      showToast("error", "Jumlah belum valid", "Jumlah perubahan harus lebih besar dari 0.");
      return;
    }
    await createStockAdjustment({ itemId: adjustItem.itemId, itemType: adjustItem.itemType, type: adjustment.type, quantity, description: adjustment.description, createdBy: "Manager" });
    showToast("success", "Inventory diperbarui", `${adjustItem.itemName} berhasil dicatat ke stock movement.`);
    setAdjustItem(null);
    await loadInventory();
  };

  return (
    <ManagerPageShell
      title="Inventory"
      subtitle="Monitoring stok produk jadi dan bahan baku. Adjustment disiapkan untuk kebutuhan audit stok dan akan otomatis mencatat Stock Movement."
      badge="Manager • Monitoring Inventory"
    >
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Total Item</p><p className="mt-1 text-2xl font-bold text-white">{formatNumber(inventory.length)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Produk Jadi</p><p className="mt-1 text-2xl font-bold text-accent">{formatNumber(productCount)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Bahan Baku</p><p className="mt-1 text-2xl font-bold text-mint">{formatNumber(materialCount)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Menipis/Habis</p><p className="mt-1 text-2xl font-bold text-amber-300">{formatNumber(lowStock)}</p></div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode, nama item, jenis, atau status..." className="w-full max-w-md rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-primary" />
      </div>

      <ManagerCrudTable headers={["Kode Item", "Nama Item", "Jenis", "Stok", "Minimum", "Status", "Aksi"]} empty={filtered.length === 0}>
        {filtered.map((item, index) => (
          <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? "bg-white/[0.02]" : ""}`}>
            <td className="px-5 py-3 font-mono text-xs text-accent">{item.itemId}</td>
            <td className="px-5 py-3 font-semibold text-white">{item.itemName}</td>
            <td className="px-5 py-3"><ItemTypePill type={item.itemType} /></td>
            <td className="px-5 py-3 text-white">{item.stock} {item.unit}</td>
            <td className="px-5 py-3 text-white/60">{item.minStock} {item.unit}</td>
            <td className="px-5 py-3"><InventoryStatusPill status={item.status} /></td>
            <td className="px-5 py-3"><div className="flex gap-2"><button onClick={() => setSelected(item)} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"><Eye size={14} /></button><button onClick={() => openAdjustment(item)} className="touch-action-btn rounded-lg bg-primary/20 p-2 text-primary hover:bg-primary/30"><SlidersHorizontal size={14} /></button></div></td>
          </tr>
        ))}
      </ManagerCrudTable>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Detail Inventory">
        {selected && <div className="space-y-3 text-sm"><p className="text-white/45">Kode Item</p><p className="font-mono text-accent">{selected.itemId}</p><p className="text-white/45">Nama Item</p><p className="text-white">{selected.itemName}</p><p className="text-white/45">Jenis</p><p><ItemTypePill type={selected.itemType} /></p><p className="text-white/45">Stok</p><p className="text-white">{selected.stock} {selected.unit}, minimum {selected.minStock} {selected.unit}</p><p className="text-white/45">Status</p><p><InventoryStatusPill status={selected.status} /></p><p className="text-white/45">Terakhir update</p><p className="text-white/70">{formatDate(selected.updatedAt)}</p></div>}
      </Modal>

      <Modal open={Boolean(adjustItem)} onClose={() => setAdjustItem(null)} title="Stock Adjustment" size="lg">
        {adjustItem && <div className="space-y-4"><div className="rounded-2xl border border-white/10 bg-dark/60 p-4 text-sm"><p className="text-white/45">Item</p><p className="font-semibold text-white">{adjustItem.itemName}</p><p className="mt-2 text-white/45">Stok Saat Ini</p><p className="text-accent">{adjustItem.stock} {adjustItem.unit}</p></div><select value={adjustment.type} onChange={(event) => setAdjustment((current) => ({ ...current, type: event.target.value as StockMovementType, quantity: event.target.value === "ADJUSTMENT" ? String(adjustItem.stock) : "" }))} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"><option value="ADJUSTMENT">Set Stok Audit</option><option value="IN">Stok Masuk</option><option value="OUT">Stok Keluar</option></select><input value={adjustment.quantity} onChange={(event) => setAdjustment((current) => ({ ...current, quantity: event.target.value }))} type="number" className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder={adjustment.type === "ADJUSTMENT" ? `Stok akhir (${adjustItem.unit})` : `Jumlah perubahan (${adjustItem.unit})`} /><p className="text-xs text-white/45">{adjustment.type === "ADJUSTMENT" ? "Mode audit akan mengatur stok akhir persis sesuai angka yang diinput." : "Mode masuk/keluar akan menambah atau mengurangi stok dari angka saat ini."}</p><textarea value={adjustment.description} onChange={(event) => setAdjustment((current) => ({ ...current, description: event.target.value }))} className="h-20 w-full resize-none rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Keterangan adjustment..." /><Button onClick={() => void saveAdjustment()} className="w-full">Simpan Adjustment</Button></div>}
      </Modal>
    </ManagerPageShell>
  );
}
