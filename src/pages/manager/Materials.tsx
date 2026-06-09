import { useEffect, useMemo, useState } from 'react';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Toast, { type ToastTone } from '../../components/common/Toast';
import ManagerPageShell from '../../components/manager/ManagerPageShell';
import ManagerCrudTable from '../../components/manager/ManagerCrudTable';
import { InventoryStatusPill } from '../../components/manager/ManagerBadges';
import { createManagerMaterial, deleteManagerMaterial, getInventoryStatus, listManagerMaterials, updateManagerMaterial } from '../../services/manager.service';
import type { ManagerMaterial, MaterialPayload } from '../../types/manager';
import { formatDate, formatNumber } from '../../utils/formatter';

const EMPTY_FORM = { name: '', unit: 'kg', stock: '', minStock: '', supplierName: '' };
const units = ['kg', 'g', 'liter', 'ml', 'pcs'];

export default function Materials() {
  const [materials, setMaterials] = useState<ManagerMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'add' | 'edit' | 'detail' | 'delete' | null>(null);
  const [selected, setSelected] = useState<ManagerMaterial | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ open: false, tone: 'success' as ToastTone, title: '', message: '' });

  const showToast = (tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2300);
  };

  const loadMaterials = async () => {
    const response = await listManagerMaterials();
    setMaterials(response.data);
  };

  useEffect(() => {
    void loadMaterials();
  }, []);

  const filtered = useMemo(() => materials.filter((item) => [item.id, item.name, item.supplierName, getInventoryStatus(item.stock, item.minStock)].join(' ').toLowerCase().includes(search.toLowerCase())), [materials, search]);
  const lowStock = materials.filter((item) => getInventoryStatus(item.stock, item.minStock) !== 'AMAN').length;

  const toPayload = (): MaterialPayload | null => {
    const stock = Number(form.stock);
    const minStock = Number(form.minStock);
    if (!form.name.trim() || !form.unit.trim() || stock < 0 || minStock < 0) return null;
    return { name: form.name.trim(), unit: form.unit, stock, minStock, supplierName: form.supplierName.trim() || '-' };
  };

  const openAdd = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode('add');
  };
  const openEdit = (item: ManagerMaterial) => {
    setSelected(item);
    setForm({ name: item.name, unit: item.unit, stock: String(item.stock), minStock: String(item.minStock), supplierName: item.supplierName });
    setMode('edit');
  };
  const closeModal = () => {
    setMode(null);
    setSelected(null);
  };

  const handleSubmit = async () => {
    const payload = toPayload();
    if (!payload) {
      showToast('error', 'Data bahan belum valid', 'Nama, satuan, stok, dan minimum stok wajib diisi dengan benar.');
      return;
    }
    if (mode === 'add') {
      await createManagerMaterial(payload);
      showToast('success', 'Bahan ditambahkan', `${payload.name} berhasil masuk ke master bahan baku.`);
    }
    if (mode === 'edit' && selected) {
      await updateManagerMaterial(selected.id, payload);
      showToast('success', 'Bahan diperbarui', `${payload.name} berhasil diperbarui.`);
    }
    closeModal();
    await loadMaterials();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deleteManagerMaterial(selected.id);
    showToast('success', 'Bahan dihapus', `${selected.name} berhasil dihapus dari master bahan baku.`);
    closeModal();
    await loadMaterials();
  };

  return (
    <ManagerPageShell
      title="Bahan Baku"
      subtitle="Kelola master bahan baku untuk recipe/BOM dan inventory. Field disiapkan mengikuti tabel Materials agar nanti mudah masuk API /materials."
      badge="Manager • Master Data Bahan"
      action={
        <Button onClick={openAdd} className="inline-flex items-center gap-2">
          <Plus size={16} /> Tambah Bahan
        </Button>
      }
    >
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Total Bahan</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatNumber(materials.length)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Bahan Aman</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{formatNumber(materials.length - lowStock)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Perlu Restock</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{formatNumber(lowStock)}</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari kode, nama bahan, supplier, atau status..."
          className="w-full max-w-md rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
        />
      </div>

      <ManagerCrudTable headers={['Kode', 'Nama Bahan', 'Supplier', 'Stok', 'Min Stok', 'Status', 'Aksi']} empty={filtered.length === 0}>
        {filtered.map((item, index) => {
          const status = getInventoryStatus(item.stock, item.minStock);
          return (
            <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? 'bg-white/[0.02]' : ''}`}>
              <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
              <td className="px-5 py-3 font-semibold text-white">{item.name}</td>
              <td className="px-5 py-3 text-white/60">{item.supplierName}</td>
              <td className="px-5 py-3 text-white">
                {item.stock} {item.unit}
              </td>
              <td className="px-5 py-3 text-white/60">
                {item.minStock} {item.unit}
              </td>
              <td className="px-5 py-3">
                <InventoryStatusPill status={status} />
              </td>
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelected(item);
                      setMode('detail');
                    }}
                    className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"
                  >
                    <Eye size={14} />
                  </button>
                  <button onClick={() => openEdit(item)} className="touch-action-btn rounded-lg bg-primary/20 p-2 text-primary hover:bg-primary/30">
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setSelected(item);
                      setMode('delete');
                    }}
                    className="touch-action-btn rounded-lg bg-red-900/20 p-2 text-red-400 hover:bg-red-900/40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </ManagerCrudTable>

      <Modal open={mode === 'add' || mode === 'edit'} onClose={closeModal} title={mode === 'add' ? 'Tambah Bahan Baku' : 'Edit Bahan Baku'} size="lg">
        <div className="space-y-4">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
            placeholder="Nama bahan baku"
          />
          <input
            value={form.supplierName}
            onChange={(event) => setForm((current) => ({ ...current, supplierName: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
            placeholder="Nama supplier"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={form.unit}
              onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
              className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
            >
              {units.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={form.stock}
              onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              type="number"
              className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
              placeholder="Stok"
            />
            <input
              value={form.minStock}
              onChange={(event) => setForm((current) => ({ ...current, minStock: event.target.value }))}
              type="number"
              className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
              placeholder="Minimum stok"
            />
          </div>
          <Button onClick={() => void handleSubmit()} className="w-full">
            {mode === 'add' ? 'Simpan Bahan' : 'Simpan Perubahan'}
          </Button>
        </div>
      </Modal>

      <Modal open={mode === 'detail'} onClose={closeModal} title="Detail Bahan Baku">
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-white/45">Kode</p>
            <p className="font-mono text-accent">{selected.id}</p>
            <p className="text-white/45">Nama</p>
            <p className="text-white">{selected.name}</p>
            <p className="text-white/45">Supplier</p>
            <p className="text-white/70">{selected.supplierName}</p>
            <p className="text-white/45">Stok</p>
            <p className="text-white">
              {selected.stock} {selected.unit}, minimum {selected.minStock} {selected.unit}
            </p>
            <p className="text-white/45">Terakhir update</p>
            <p className="text-white/70">{formatDate(selected.updatedAt)}</p>
          </div>
        )}
      </Modal>

      <Modal open={mode === 'delete'} onClose={closeModal} title="Hapus Bahan Baku">
        <p className="text-sm leading-6 text-white/70">
          Yakin ingin menghapus <span className="font-semibold text-white">{selected?.name}</span>? Dummy ini juga akan membersihkan bahan tersebut dari recipe yang terhubung.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={closeModal}>
            Batal
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => void handleDelete()}>
            Hapus
          </Button>
        </div>
      </Modal>
    </ManagerPageShell>
  );
}
