import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Toast, { type ToastTone } from '../../components/common/Toast';
import ManagerCrudTable from '../../components/manager/ManagerCrudTable';
import ManagerPageShell from '../../components/manager/ManagerPageShell';
import { createCategory, deleteCategory, listCategories, updateCategory, type Category } from '../../services/category.service';
import { getApiErrorMessage } from '../../services/error';
import { formatDate } from '../../utils/formatter';

const EMPTY_FORM = { name: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit' | 'detail' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ open: false, tone: 'success' as ToastTone, title: '', message: '' });

  const showToast = useCallback((tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2600);
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listCategories({ page, limit });
      setCategories(response.items);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (error) {
      showToast('error', 'Gagal memuat kategori', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [limit, page, showToast]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(
    () => categories.filter((item) => `${item.id} ${item.name} ${item.description ?? ''}`.toLowerCase().includes(search.toLowerCase())),
    [categories, search],
  );

  const openAdd = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode('add');
  };

  const openEdit = (item: Category) => {
    setSelected(item);
    setForm({ name: item.name, description: item.description ?? '' });
    setMode('edit');
  };

  const closeModal = () => {
    setSelected(null);
    setMode(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (form.name.trim().length < 3) {
      showToast('error', 'Nama belum valid', 'Nama kategori minimal 3 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };

      if (mode === 'add') {
        await createCategory(payload);
        showToast('success', 'Kategori ditambahkan', `${payload.name} berhasil disimpan.`);
      }

      if (mode === 'edit' && selected) {
        await updateCategory(selected.id, payload);
        showToast('success', 'Kategori diperbarui', `${payload.name} berhasil diperbarui.`);
      }

      closeModal();
      await loadCategories();
    } catch (error) {
      showToast('error', 'Simpan kategori gagal', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteCategory(selected.id);
      showToast('success', 'Kategori dihapus', `${selected.name} berhasil dihapus.`);
      closeModal();
      await loadCategories();
    } catch (error) {
      showToast('error', 'Hapus kategori gagal', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ManagerPageShell
      title="Kategori"
      subtitle="Kelola kategori produk dari endpoint /categories. Product form memakai ID kategori asli dari daftar ini."
      badge="Master Data Kategori"
      action={<Button onClick={openAdd}><Plus size={16} /> Tambah Kategori</Button>}
    >
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari kategori..."
          className="w-full max-w-md rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
        />
      </div>

      <ManagerCrudTable headers={['ID', 'Nama', 'Deskripsi', 'Dibuat', 'Aksi']} empty={!loading && filteredCategories.length === 0}>
        {loading ? (
          <tr><td colSpan={5} className="px-5 py-10 text-center text-white/45">Memuat kategori...</td></tr>
        ) : filteredCategories.map((item, index) => (
          <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? 'bg-white/[0.02]' : ''}`}>
            <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
            <td className="px-5 py-3 font-semibold text-white">{item.name}</td>
            <td className="px-5 py-3 text-white/60">{item.description || '-'}</td>
            <td className="px-5 py-3 text-white/45">{item.createdAt ? formatDate(item.createdAt) : '-'}</td>
            <td className="px-5 py-3">
              <div className="flex gap-2">
                <button onClick={() => { setSelected(item); setMode('detail'); }} className="rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"><Eye size={14} /></button>
                <button onClick={() => openEdit(item)} className="rounded-lg bg-primary/20 p-2 text-primary hover:bg-primary/30"><Edit size={14} /></button>
                <button onClick={() => { setSelected(item); setMode('delete'); }} className="rounded-lg bg-red-900/20 p-2 text-red-400 hover:bg-red-900/40"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </ManagerCrudTable>

      <div className="mt-5 flex items-center justify-end gap-3">
        <Button variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Sebelumnya</Button>
        <span className="text-sm text-white/55">Halaman {page} / {totalPages}</span>
        <Button variant="ghost" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Berikutnya</Button>
      </div>

      <Modal open={mode === 'add' || mode === 'edit'} onClose={closeModal} title={mode === 'add' ? 'Tambah Kategori' : 'Edit Kategori'}>
        <div className="space-y-4">
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Nama kategori" />
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="h-28 w-full resize-none rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Deskripsi opsional" />
          <Button onClick={() => void handleSubmit()} className="w-full" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Kategori'}</Button>
        </div>
      </Modal>

      <Modal open={mode === 'detail'} onClose={closeModal} title="Detail Kategori">
        {selected && <div className="space-y-3 text-sm"><p className="text-white/45">ID</p><p className="font-mono text-accent">{selected.id}</p><p className="text-white/45">Nama</p><p className="text-white">{selected.name}</p><p className="text-white/45">Deskripsi</p><p className="text-white/70">{selected.description || '-'}</p></div>}
      </Modal>

      <Modal open={mode === 'delete'} onClose={closeModal} title="Hapus Kategori">
        <p className="text-sm leading-6 text-white/70">Yakin ingin menghapus <span className="font-semibold text-white">{selected?.name}</span>?</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={closeModal} disabled={submitting}>Batal</Button>
          <Button variant="danger" className="flex-1" onClick={() => void handleDelete()} disabled={submitting}>{submitting ? 'Menghapus...' : 'Hapus'}</Button>
        </div>
      </Modal>
    </ManagerPageShell>
  );
}
