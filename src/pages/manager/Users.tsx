import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Edit, Eye, FileSpreadsheet, FileText, Power, Trash2, UserPlus } from "lucide-react";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Toast, { type ToastTone } from "../../components/common/Toast";
import ManagerPageShell from "../../components/manager/ManagerPageShell";
import ManagerCrudTable from "../../components/manager/ManagerCrudTable";
import { RolePill, UserStatusPill } from "../../components/manager/ManagerBadges";
import { createManagerUser, deleteManagerUser, listManagerUsers, updateManagerUser } from "../../services/manager.service";
import { getApiErrorMessage } from "../../services/error";
import type { ManagerSystemUser, SystemRole, SystemUserStatus, UserPayload } from "../../types/manager";
import { formatDate, formatNumber } from "../../utils/formatter";
import { exportUserFile, type UserExportFormat } from "../../utils/userExport";

const EMPTY_FORM = { name: "", email: "", phone: "", role: "STAFF" as SystemRole, status: "ACTIVE" as SystemUserStatus, password: "" };

export default function Users() {
  const [users, setUsers] = useState<ManagerSystemUser[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"add" | "edit" | "detail" | "delete" | null>(null);
  const [selected, setSelected] = useState<ManagerSystemUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<UserExportFormat>("excel");
  const [toast, setToast] = useState({ open: false, tone: "success" as ToastTone, title: "", message: "" });

  const showToast = useCallback((tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2300);
  }, []);

  const loadUsers = useCallback(async () => {
    const response = await listManagerUsers();
    setUsers(response.data);
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => users.filter((item) => [item.id, item.name, item.email, item.phone, item.role, item.status].join(" ").toLowerCase().includes(search.toLowerCase())), [users, search]);
  const activeCount = users.filter((item) => item.status === "ACTIVE").length;
  const staffCount = users.filter((item) => item.role === "STAFF").length;
  const cashierCount = users.filter((item) => item.role === "KASIR").length;
  const customerCount = users.filter((item) => item.role === "CUSTOMER").length;

  const openAdd = () => { setSelected(null); setForm(EMPTY_FORM); setMode("add"); };
  const openEdit = (item: ManagerSystemUser) => { setSelected(item); setForm({ name: item.name, email: item.email, phone: item.phone || "", role: item.role, status: item.status, password: "" }); setMode("edit"); };
  const closeModal = () => { setMode(null); setSelected(null); };

  const toPayload = (): UserPayload | null => {
    if (!form.name.trim() || !form.email.trim()) return null;
    if (mode === "add" && form.password.trim().length < 3) return null;
    return { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role: form.role, status: form.status, password: form.password };
  };

  const handleSubmit = async () => {
    const payload = toPayload();
    if (!payload) {
      showToast("error", "Data user belum valid", "Nama, email, role, status, dan password minimal 3 karakter untuk user baru wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "add") {
        await createManagerUser(payload);
        showToast("success", "User ditambahkan", `${payload.name} berhasil masuk ke sistem.`);
      }

      if (mode === "edit" && selected) {
        await updateManagerUser(selected.id, payload);
        showToast("success", "User diperbarui", `${payload.name} berhasil diperbarui.`);
      }

      closeModal();
      await loadUsers();
    } catch (error) {
      showToast("error", "Simpan user gagal", getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item: ManagerSystemUser) => {
    const nextStatus: SystemUserStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateManagerUser(item.id, { name: item.name, email: item.email, phone: item.phone || "", role: item.role, status: nextStatus });
      showToast("success", "Status diperbarui", `${item.name} sekarang ${nextStatus === "ACTIVE" ? "aktif" : "nonaktif"}.`);
      await loadUsers();
    } catch (error) {
      showToast("error", "Gagal memperbarui status", getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteManagerUser(selected.id);
      showToast("success", "User dihapus", `${selected.name} berhasil dihapus dari daftar pengguna.`);
      closeModal();
      await loadUsers();
    } catch (error) {
      showToast("error", "Gagal menghapus user", getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = (format: UserExportFormat) => {
    if (!filtered.length) {
      showToast("error", "Data tidak dapat diunduh", "Tidak ada pengguna yang sesuai dengan pencarian saat ini.");
      return;
    }

    const filterLabel = search.trim() ? `Pencarian: ${search.trim()}` : "Semua pengguna";
    const result = exportUserFile({ users: filtered, format, filterLabel });
    setExportOpen(false);
    showToast("success", "Download berhasil", `${result.message} File: ${result.fileName}`);
  };

  return (
    <ManagerPageShell
      title="User Management"
      subtitle="Kelola seluruh akun sistem: Manager, Staff, Kasir, dan Customer. Data phone ikut dikirim ke backend agar daftar user management konsisten dengan database."
      badge="Manager • Kelola User"
      action={
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2">
            <Download size={16} /> Download
          </Button>
          <Button onClick={openAdd} className="inline-flex items-center gap-2"><UserPlus size={16} /> Tambah User</Button>
        </div>
      }
    >
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <div className="mb-5 grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Total User</p><p className="mt-1 text-2xl font-bold text-white">{formatNumber(users.length)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Aktif</p><p className="mt-1 text-2xl font-bold text-emerald-300">{formatNumber(activeCount)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Staff</p><p className="mt-1 text-2xl font-bold text-mint">{formatNumber(staffCount)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Kasir</p><p className="mt-1 text-2xl font-bold text-accent">{formatNumber(cashierCount)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4"><p className="text-xs text-white/40">Customer</p><p className="mt-1 text-2xl font-bold text-sky-300">{formatNumber(customerCount)}</p></div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, email, role, atau status..." className="w-full max-w-md rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-primary" />
      </div>

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Download Daftar Pengguna" size="lg">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">Pilih format file</p>
            <p className="mt-1 text-sm leading-6 text-white/45">
              Data unduhan mengikuti hasil pencarian yang sedang tampil, yaitu <strong>{formatNumber(filtered.length)} pengguna</strong>.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setExportFormat("excel")}
              className={`rounded-2xl border p-4 text-left transition-all ${exportFormat === "excel" ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 bg-white/[0.03] hover:border-emerald-400/40"}`}
            >
              <FileSpreadsheet className="text-emerald-300" size={24} />
              <p className="mt-3 font-semibold text-white">Excel (.xls)</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Sheet terpisah untuk semua akun, setiap role, dan akun nonaktif. Tidak ada panel yang dikunci saat digulir.</p>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat("pdf")}
              className={`rounded-2xl border p-4 text-left transition-all ${exportFormat === "pdf" ? "border-red-400/60 bg-red-400/10" : "border-white/10 bg-white/[0.03] hover:border-red-400/40"}`}
            >
              <FileText className="text-red-300" size={24} />
              <p className="mt-3 font-semibold text-white">PDF (.pdf)</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Format formal dengan tabel akun aktif dan tabel khusus akun nonaktif.</p>
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" className="flex-1" onClick={() => setExportOpen(false)}>Batal</Button>
            <Button variant="accent" className="flex-1 inline-flex items-center justify-center gap-2" onClick={() => handleExport(exportFormat)}>
              <Download size={16} /> Download {exportFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      </Modal>

      <ManagerCrudTable headers={["Kode", "Nama", "Email", "No HP", "Role", "Status", "Update", "Aksi"]} empty={filtered.length === 0}>
        {filtered.map((item, index) => (
          <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? "bg-white/[0.02]" : ""}`}>
            <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
            <td className="px-5 py-3 font-semibold text-white">{item.name}</td>
            <td className="px-5 py-3 text-white/60">{item.email}</td>
            <td className="px-5 py-3 text-white/60">{item.phone || "-"}</td>
            <td className="px-5 py-3"><RolePill role={item.role} /></td>
            <td className="px-5 py-3"><UserStatusPill status={item.status} /></td>
            <td className="px-5 py-3 text-white/50">{formatDate(item.updatedAt)}</td>
            <td className="px-5 py-3"><div className="flex gap-2"><button onClick={() => { setSelected(item); setMode("detail"); }} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"><Eye size={14} /></button><button onClick={() => openEdit(item)} className="touch-action-btn rounded-lg bg-primary/20 p-2 text-primary hover:bg-primary/30"><Edit size={14} /></button><button onClick={() => void toggleStatus(item)} className="touch-action-btn rounded-lg bg-amber-900/20 p-2 text-amber-400 hover:bg-amber-900/40"><Power size={14} /></button><button onClick={() => { setSelected(item); setMode("delete"); }} className="touch-action-btn rounded-lg bg-red-900/20 p-2 text-red-400 hover:bg-red-900/40"><Trash2 size={14} /></button></div></td>
          </tr>
        ))}
      </ManagerCrudTable>

      <Modal open={mode === "add" || mode === "edit"} onClose={closeModal} title={mode === "add" ? "Tambah User" : "Edit User"} size="lg">
        <div className="space-y-4">
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Nama user" />
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Email user" />
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="No HP / WhatsApp" />
          <div className="grid gap-3 md:grid-cols-2">
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as SystemRole }))} className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"><option value="MANAGER">MANAGER</option><option value="STAFF">STAFF</option><option value="KASIR">KASIR</option><option value="CUSTOMER">CUSTOMER</option></select>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SystemUserStatus }))} className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>
          </div>
          {mode === "add" && <input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} type="password" className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Password awal" />}
          <Button onClick={() => void handleSubmit()} className="w-full" disabled={submitting}>{submitting ? "Menyimpan..." : mode === "add" ? "Simpan User" : "Simpan Perubahan"}</Button>
        </div>
      </Modal>

      <Modal open={mode === "detail"} onClose={closeModal} title="Detail User">
        {selected && <div className="space-y-3 text-sm"><p className="text-white/45">Kode User</p><p className="font-mono text-accent">{selected.id}</p><p className="text-white/45">Nama</p><p className="text-white">{selected.name}</p><p className="text-white/45">Email</p><p className="text-white/70">{selected.email}</p><p className="text-white/45">No HP</p><p className="text-white/70">{selected.phone || "-"}</p><p className="text-white/45">Role</p><p><RolePill role={selected.role} /></p><p className="text-white/45">Status</p><p><UserStatusPill status={selected.status} /></p><p className="text-white/45">Dibuat</p><p className="text-white/70">{formatDate(selected.createdAt)}</p></div>}
      </Modal>

      <Modal open={mode === "delete"} onClose={closeModal} title="Hapus User">
        <p className="text-sm leading-6 text-white/70">Yakin ingin menghapus user <span className="font-semibold text-white">{selected?.name}</span>?</p>
        <div className="mt-5 flex gap-3"><Button variant="ghost" className="flex-1" onClick={closeModal} disabled={submitting}>Batal</Button><Button variant="danger" className="flex-1" onClick={() => void handleDelete()} disabled={submitting}>{submitting ? "Menghapus..." : "Hapus"}</Button></div>
      </Modal>
    </ManagerPageShell>
  );
}
