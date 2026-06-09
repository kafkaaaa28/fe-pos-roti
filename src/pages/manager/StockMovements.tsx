import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import ManagerPageShell from "../../components/manager/ManagerPageShell";
import ManagerCrudTable from "../../components/manager/ManagerCrudTable";
import { ItemTypePill, StockMovementPill } from "../../components/manager/ManagerBadges";
import { listManagerStockMovements } from "../../services/manager.service";
import type { ManagerStockMovement } from "../../types/manager";
import { formatDate, formatNumber } from "../../utils/formatter";

export default function StockMovements() {
  const [movements, setMovements] = useState<ManagerStockMovement[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ManagerStockMovement | null>(null);

  useEffect(() => {
    listManagerStockMovements().then((response) => setMovements(response.data));
  }, []);

  const filtered = useMemo(
    () => movements.filter((item) => [item.id, item.itemName, item.itemType, item.type, item.sourceModule, item.createdBy].join(" ").toLowerCase().includes(search.toLowerCase())),
    [movements, search]
  );

  const totalIn = movements.filter((item) => item.type === "IN").length;
  const totalOut = movements.filter((item) => item.type === "OUT").length;
  const totalAdjustment = movements.filter((item) => item.type === "ADJUSTMENT").length;

  return (
    <ManagerPageShell
      title="Stock Movement"
      subtitle="Lihat seluruh riwayat keluar-masuk stok. Halaman ini menjadi audit trail untuk produksi, POS, order online, restock, dan adjustment."
      badge="Manager • Audit Stock Movement"
    >
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Total Movement</p><p className="mt-1 text-2xl font-bold text-white">{formatNumber(movements.length)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">IN</p><p className="mt-1 text-2xl font-bold text-emerald-300">{formatNumber(totalIn)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">OUT</p><p className="mt-1 text-2xl font-bold text-red-300">{formatNumber(totalOut)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Adjustment</p><p className="mt-1 text-2xl font-bold text-sky-300">{formatNumber(totalAdjustment)}</p></div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari movement, item, jenis, modul, atau petugas..." className="w-full max-w-md rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-primary" />
      </div>

      <ManagerCrudTable headers={["Kode", "Item", "Jenis Item", "Tipe", "Jumlah", "Modul", "Petugas", "Tanggal", "Aksi"]} empty={filtered.length === 0}>
        {filtered.map((item, index) => (
          <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? "bg-white/[0.02]" : ""}`}>
            <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
            <td className="px-5 py-3 font-semibold text-white">{item.itemName}</td>
            <td className="px-5 py-3"><ItemTypePill type={item.itemType} /></td>
            <td className="px-5 py-3"><StockMovementPill type={item.type} /></td>
            <td className="px-5 py-3 text-white/70">{item.quantity} {item.unit}</td>
            <td className="px-5 py-3 text-white/60">{item.sourceModule}</td>
            <td className="px-5 py-3 text-white/60">{item.createdBy}</td>
            <td className="px-5 py-3 text-white/60">{formatDate(item.createdAt)}</td>
            <td className="px-5 py-3"><button onClick={() => setSelected(item)} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"><Eye size={14} /></button></td>
          </tr>
        ))}
      </ManagerCrudTable>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Detail Stock Movement" size="lg">
        {selected && <div className="space-y-3 text-sm"><p className="text-white/45">Kode Movement</p><p className="font-mono text-accent">{selected.id}</p><p className="text-white/45">Item</p><p className="text-white">{selected.itemName}</p><p className="text-white/45">Tipe Movement</p><p><StockMovementPill type={selected.type} /></p><p className="text-white/45">Jumlah</p><p className="text-white">{selected.quantity} {selected.unit}</p><p className="text-white/45">Keterangan</p><p className="text-white/70">{selected.description}</p><p className="text-white/45">Dibuat oleh</p><p className="text-white/70">{selected.createdBy}</p><p className="text-white/45">Tanggal</p><p className="text-white/70">{formatDate(selected.createdAt)}</p><Button className="w-full" variant="ghost" onClick={() => setSelected(null)}>Tutup</Button></div>}
      </Modal>
    </ManagerPageShell>
  );
}
