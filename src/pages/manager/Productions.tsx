import { useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import ManagerPageShell from "../../components/manager/ManagerPageShell";
import ManagerCrudTable from "../../components/manager/ManagerCrudTable";
import { ProductionStatusPill } from "../../components/manager/ManagerBadges";
import { listManagerProductions } from "../../services/manager.service";
import type { ManagerProduction, ProductionStatus } from "../../types/manager";
import { formatDate, formatNumber } from "../../utils/formatter";

const statusLabels: Record<ProductionStatus, string> = {
  SELESAI: "Selesai",
  DIPROSES: "Diproses",
  DIBATALKAN: "Dibatalkan",
};

export default function Productions() {
  const [productions, setProductions] = useState<ManagerProduction[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ManagerProduction | null>(null);

  useEffect(() => {
    listManagerProductions().then((response) => setProductions(response.data));
  }, []);

  const filtered = useMemo(
    () => productions.filter((item) => [item.id, item.productName, item.userName, statusLabels[item.status]].join(" ").toLowerCase().includes(search.toLowerCase())),
    [productions, search]
  );

  const totalQty = productions.reduce((sum, item) => sum + item.quantity, 0);
  const inProcess = productions.filter((item) => item.status === "DIPROSES").length;

  return (
    <ManagerPageShell
      title="Monitoring Produksi"
      subtitle="Manager hanya memantau riwayat dan detail produksi. Input produksi baru tetap dilakukan oleh role Staff agar alur operasional tidak campur."
      badge="Manager • Monitoring Produksi"
    >
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Total Batch</p><p className="mt-1 text-2xl font-bold text-white">{formatNumber(productions.length)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Total Produksi</p><p className="mt-1 text-2xl font-bold text-accent">{formatNumber(totalQty)} pcs</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Sedang Diproses</p><p className="mt-1 text-2xl font-bold text-sky-300">{formatNumber(inProcess)}</p></div>
      </div>

      <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/10 p-4 text-sm leading-6 text-white/60">
        Petugas produksi tidak diinput oleh manager. Saat backend dibuat, petugas otomatis diambil dari token login Staff melalui <span className="font-mono text-accent">req.user.id</span> dan disimpan ke <span className="font-mono text-accent">productions.user_id</span>.
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <div className="flex max-w-md items-center gap-3 rounded-xl border border-white/10 bg-dark px-4 py-2.5">
          <Search size={16} className="text-white/30" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode, produk, petugas, atau status..." className="w-full bg-transparent text-sm text-white outline-none" />
        </div>
      </div>

      <ManagerCrudTable headers={["Kode", "Produk", "Jumlah", "Petugas", "Status", "Tanggal", "Aksi"]} empty={filtered.length === 0}>
        {filtered.map((item, index) => (
          <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? "bg-white/[0.02]" : ""}`}>
            <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
            <td className="px-5 py-3 font-semibold text-white">{item.productName}</td>
            <td className="px-5 py-3 text-white/70">{item.quantity} pcs</td>
            <td className="px-5 py-3 text-white/60">{item.userName}</td>
            <td className="px-5 py-3"><ProductionStatusPill status={item.status} /></td>
            <td className="px-5 py-3 text-white/60">{formatDate(item.createdAt)}</td>
            <td className="px-5 py-3"><button onClick={() => setSelected(item)} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"><Eye size={14} /></button></td>
          </tr>
        ))}
      </ManagerCrudTable>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Detail Produksi" size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-dark/60 p-4"><p className="text-white/45">Kode Produksi</p><p className="mt-1 font-mono text-accent">{selected.id}</p></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><p className="text-white/45">Produk</p><p className="mt-1 text-white">{selected.productName}</p></div>
              <div><p className="text-white/45">Jumlah Produksi</p><p className="mt-1 text-white">{selected.quantity} pcs</p></div>
              <div><p className="text-white/45">Petugas</p><p className="mt-1 text-white">{selected.userName}</p></div>
              <div><p className="text-white/45">Status</p><p className="mt-1"><ProductionStatusPill status={selected.status} /></p></div>
            </div>
            <div><p className="text-white/45">Catatan</p><p className="mt-1 text-white/70">{selected.notes}</p></div>
            <div><p className="text-white/45">Tanggal Produksi</p><p className="mt-1 text-white/70">{formatDate(selected.createdAt)}</p></div>
            <Button className="w-full" variant="ghost" onClick={() => setSelected(null)}>Tutup</Button>
          </div>
        )}
      </Modal>
    </ManagerPageShell>
  );
}
