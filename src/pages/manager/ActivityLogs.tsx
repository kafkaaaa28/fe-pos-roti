import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, RefreshCw, Search, ShieldCheck } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import Toast from "../../components/common/Toast";
import { getActivityLogs } from "../../services/activity.service";
import type { ActivityLogItem } from "../../types/activity";
import { formatDate } from "../../utils/formatter";

const actionTone = (action: string) => {
  if (["CREATE", "LOGIN"].includes(action)) return "success" as const;
  if (["UPDATE", "STATUS_CHANGE"].includes(action)) return "info" as const;
  if (["DELETE", "CANCEL"].includes(action)) return "danger" as const;
  return "warning" as const;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-0"><span className="text-sm text-white/45">{label}</span><span className="text-right text-sm font-semibold text-white">{value}</span></div>;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ActivityLogItem | null>(null);
  const [toast, setToast] = useState({ open: false, title: "", message: "" });

  const filteredLogs = useMemo(() => logs.filter((log) => `${log.action} ${log.module} ${log.description} ${log.user?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())), [logs, search]);

  const loadLogs = async (refresh = false) => {
    setLoading(true);
    const data = await getActivityLogs({ search: search || undefined });
    setLogs(data);
    setLoading(false);
    if (refresh) {
      setToast({ open: true, title: "Activity log diperbarui", message: "Data audit berhasil dimuat dari backend/fallback." });
      window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2400);
    }
  };

  useEffect(() => { void loadLogs(false); }, []);

  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">
        <Toast open={toast.open} title={toast.title} message={toast.message} />
        <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"><ShieldCheck size={14} /> Audit Manager</div>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Activity Logs</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">Riwayat aktivitas penting: login, user management, transaksi, produksi, produk, material, dan stock movement.</p>
          </div>
          <button onClick={() => loadLogs(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 hover:border-accent hover:text-accent"><RefreshCw size={16} /> Refresh</button>
        </motion.div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
          <div className="relative max-w-xl"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari action, module, deskripsi, atau user..." className="min-h-12 w-full rounded-2xl border border-white/10 bg-dark/60 px-11 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/60" /></div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-accent text-dark"><tr>{["Waktu", "User", "Action", "Module", "Deskripsi", "Aksi"].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-white/10">
                {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-white/45">Memuat activity logs...</td></tr> : filteredLogs.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-white/45">Activity log tidak ditemukan.</td></tr> : filteredLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-white/[0.04]">
                    <td className="px-4 py-3 text-white/55">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3"><p className="font-semibold text-white">{log.user?.name ?? "Sistem"}</p><p className="text-xs text-white/35">{log.user?.role ?? "-"}</p></td>
                    <td className="px-4 py-3"><StatusBadge label={log.action} tone={actionTone(log.action)} /></td>
                    <td className="px-4 py-3 font-semibold text-accent">{log.module}</td>
                    <td className="px-4 py-3 text-white/65">{log.description}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setSelected(log)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-accent hover:text-accent"><Eye size={14} /> Detail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Activity Log" size="md">
        {selected && <div><DetailRow label="ID" value={selected.id} /><DetailRow label="Waktu" value={formatDate(selected.createdAt)} /><DetailRow label="User" value={selected.user?.name ?? "Sistem"} /><DetailRow label="Email" value={selected.user?.email ?? "-"} /><DetailRow label="Action" value={<StatusBadge label={selected.action} tone={actionTone(selected.action)} />} /><DetailRow label="Module" value={selected.module} /><DetailRow label="Deskripsi" value={selected.description} /><DetailRow label="Metadata" value={<pre className="max-w-[260px] overflow-x-auto rounded-xl bg-dark/70 p-3 text-left text-xs text-white/70">{JSON.stringify(selected.metadata ?? {}, null, 2)}</pre>} /></div>}
      </Modal>
    </div>
  );
}
