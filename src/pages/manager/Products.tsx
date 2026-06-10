import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Edit, Eye, ImagePlus, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Toast, { type ToastTone } from '../../components/common/Toast';
import ManagerPageShell from '../../components/manager/ManagerPageShell';
import ManagerCrudTable from '../../components/manager/ManagerCrudTable';
import { ProductStatusPill } from '../../components/manager/ManagerBadges';
import { createManagerProduct, deleteManagerProduct, listManagerProducts, updateManagerProduct } from '../../services/manager.service';
import { listCategories, type Category } from '../../services/category.service';
import { uploadProductImage, validateProductImageFile } from '../../services/upload.service';
import { getApiErrorMessage } from '../../services/error';
import type { ManagerProduct, ProductPayload, ProductStatus } from '../../types/manager';
import { formatDate, formatNumber, formatRupiah } from '../../utils/formatter';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  categoryName: '',
  description: '',
  image: '',
  price: '',
  stock: '',
  minStock: '',
  status: 'ACTIVE' as ProductStatus,
};

export default function Products() {
  const [products, setProducts] = useState<ManagerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit' | 'detail' | 'delete' | null>(null);
  const [selected, setSelected] = useState<ManagerProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [toast, setToast] = useState({ open: false, tone: 'success' as ToastTone, title: '', message: '' });

  const showToast = useCallback((tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 3000);
  }, []);

  const revokeBlobPreview = () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        listManagerProducts(),
        listCategories({ page: 1, limit: 100 }),
      ]);
      setProducts(productResponse.data);
      setCategories(categoryResponse.items);
    } catch (error) {
      showToast('error', 'Gagal memuat data', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => () => revokeBlobPreview(), [imagePreview]);

  const filteredProducts = useMemo(
    () => products.filter((item) => [item.id, item.name, item.categoryName, item.status].join(' ').toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const totalActive = products.filter((item) => item.status === 'ACTIVE').length;
  const lowStock = products.filter((item) => item.stock <= item.minStock).length;

  const toPayload = (imageUrl: string): ProductPayload | null => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    const minStock = Number(form.minStock);
    const category = categories.find((item) => item.id === form.categoryId);

    if (form.name.trim().length < 3 || !form.categoryId || price <= 0 || stock < 0 || minStock < 0) return null;

    return {
      categoryId: form.categoryId,
      categoryName: category?.name || form.categoryName,
      name: form.name.trim(),
      description: form.description.trim(),
      image: imageUrl || undefined,
      price,
      stock,
      minStock,
      status: form.status,
    };
  };

  const openAdd = () => {
    revokeBlobPreview();
    const firstCategory = categories[0];
    setSelected(null);
    setImageFile(null);
    setImagePreview('');
    setForm({
      ...EMPTY_FORM,
      categoryId: firstCategory?.id ?? '',
      categoryName: firstCategory?.name ?? '',
    });
    setMode('add');
  };

  const openEdit = (item: ManagerProduct) => {
    revokeBlobPreview();
    setSelected(item);
    setImageFile(null);
    setImagePreview(item.image || '');
    setForm({
      name: item.name,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      description: item.description,
      image: item.image || '',
      price: String(item.price),
      stock: String(item.stock),
      minStock: String(item.minStock),
      status: item.status,
    });
    setMode('edit');
  };

  const closeModal = () => {
    revokeBlobPreview();
    setMode(null);
    setSelected(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    setForm((current) => ({
      ...current,
      categoryId,
      categoryName: category?.name ?? '',
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateProductImageFile(file);
    if (validationError) {
      event.target.value = '';
      showToast('error', 'Gambar tidak valid', validationError);
      return;
    }

    revokeBlobPreview();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let imageUrl = selected?.image || form.image || '';
      if (imageFile) {
        const uploadResponse = await uploadProductImage(imageFile);
        imageUrl = uploadResponse.url;
      }

      const payload = toPayload(imageUrl);
      if (!payload) {
        showToast('error', 'Data produk belum valid', 'Nama minimal 3 karakter, kategori backend, harga, stok, dan minimum stok wajib diisi dengan benar.');
        return;
      }

      if (mode === 'add') {
        await createManagerProduct(payload);
        showToast('success', 'Produk ditambahkan', `${payload.name} berhasil masuk ke master produk.`);
      }

      if (mode === 'edit' && selected) {
        await updateManagerProduct(selected.id, payload);
        showToast('success', 'Produk diperbarui', `${payload.name} berhasil diperbarui.`);
      }

      closeModal();
      await loadData();
    } catch (error) {
      showToast('error', imageFile ? 'Upload atau simpan produk gagal' : 'Simpan produk gagal', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteManagerProduct(selected.id);
      showToast('success', 'Produk dihapus', `${selected.name} berhasil dihapus dari master produk.`);
      closeModal();
      await loadData();
    } catch (error) {
      showToast('error', 'Gagal menghapus produk', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ManagerPageShell
      title="Produk"
      subtitle="Kelola master produk. Gambar diupload ke /uploads/images terlebih dahulu, lalu URL disimpan ke payload JSON /products."
      badge="Manager - Master Data Produk"
      action={
        <Button onClick={openAdd} className="inline-flex items-center gap-2" disabled={loading}>
          <Plus size={16} /> Tambah Produk
        </Button>
      }
    >
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Total Produk</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatNumber(products.length)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Produk Aktif</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{formatNumber(totalActive)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Stok Perlu Dicek</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{formatNumber(lowStock)}</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari kode, nama produk, kategori, atau status..."
          className="w-full max-w-md rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
        />
      </div>

      <ManagerCrudTable headers={['Gambar', 'Kode', 'Nama Produk', 'Kategori', 'Harga', 'Stok', 'Status', 'Aksi']} empty={!loading && filteredProducts.length === 0}>
        {loading ? (
          <tr>
            <td colSpan={8} className="px-5 py-10 text-center text-white/45">Memuat produk...</td>
          </tr>
        ) : filteredProducts.map((item, index) => (
          <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? 'bg-white/[0.02]' : ''}`}>
            <td className="px-5 py-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-dark">
                {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-white/25"><ImagePlus size={16} /></div>}
              </div>
            </td>
            <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
            <td className="px-5 py-3 font-semibold text-white">{item.name}</td>
            <td className="px-5 py-3 text-white/60">{item.categoryName}</td>
            <td className="px-5 py-3 text-white">{formatRupiah(item.price)}</td>
            <td className="px-5 py-3 text-white/70">
              {item.stock} pcs <span className="text-white/35">/ min {item.minStock}</span>
            </td>
            <td className="px-5 py-3">
              <ProductStatusPill status={item.status} />
            </td>
            <td className="px-5 py-3">
              <div className="flex gap-2">
                <button onClick={() => { setSelected(item); setMode('detail'); }} className="touch-action-btn rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10">
                  <Eye size={14} />
                </button>
                <button onClick={() => openEdit(item)} className="touch-action-btn rounded-lg bg-primary/20 p-2 text-primary hover:bg-primary/30">
                  <Edit size={14} />
                </button>
                <button onClick={() => { setSelected(item); setMode('delete'); }} className="touch-action-btn rounded-lg bg-red-900/20 p-2 text-red-400 hover:bg-red-900/40">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </ManagerCrudTable>

      <Modal open={mode === 'add' || mode === 'edit'} onClose={closeModal} title={mode === 'add' ? 'Tambah Produk' : 'Edit Produk'} size="lg">
        <div className="space-y-4">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
            placeholder="Nama produk"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.categoryId}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Pilih kategori backend</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}
              className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
            <div className="h-36 overflow-hidden rounded-2xl border border-white/10 bg-dark">
              {imagePreview ? <img src={imagePreview} alt="Preview produk" className="h-full w-full object-cover" /> : <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-white/35"><ImagePlus size={22} /> Preview gambar</div>}
            </div>
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-dark px-4 py-5 text-center text-sm text-white/55 transition-colors hover:border-accent hover:text-accent">
              <ImagePlus size={22} />
              <span className="mt-2 font-semibold">Pilih gambar produk</span>
              <span className="mt-1 text-xs text-white/35">image/*, maksimal 5MB. File akan diupload saat submit.</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
            </label>
          </div>
          {categories.length === 0 && (
            <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
              Kategori belum ter-load. Modal tetap bisa dibuka, tapi produk baru belum bisa disimpan sebelum ada kategori.
            </p>
          )}
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="h-24 w-full resize-none rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary"
            placeholder="Deskripsi produk"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} type="number" className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Harga" />
            <input value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} type="number" className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Stok" />
            <input value={form.minStock} onChange={(event) => setForm((current) => ({ ...current, minStock: event.target.value }))} type="number" className="rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary" placeholder="Minimum stok" />
          </div>
          <Button onClick={() => void handleSubmit()} className="w-full" disabled={submitting}>
            {submitting ? 'Mengupload / menyimpan...' : mode === 'add' ? 'Simpan Produk' : 'Simpan Perubahan'}
          </Button>
        </div>
      </Modal>

      <Modal open={mode === 'detail'} onClose={closeModal} title="Detail Produk">
        {selected && (
          <div className="space-y-3 text-sm">
            {selected.image && <img src={selected.image} alt={selected.name} className="h-44 w-full rounded-2xl object-cover" />}
            <p className="text-white/45">Kode Produk</p>
            <p className="font-mono text-accent">{selected.id}</p>
            <p className="text-white/45">Nama Produk</p>
            <p className="text-white">{selected.name}</p>
            <p className="text-white/45">Kategori</p>
            <p className="text-white/70">{selected.categoryName}</p>
            <p className="text-white/45">Deskripsi</p>
            <p className="text-white/70">{selected.description || '-'}</p>
            <p className="text-white/45">Harga</p>
            <p className="text-white">{formatRupiah(selected.price)}</p>
            <p className="text-white/45">Stok</p>
            <p className="text-white">{selected.stock} pcs, minimum {selected.minStock} pcs</p>
            <p className="text-white/45">Terakhir update</p>
            <p className="text-white/70">{formatDate(selected.updatedAt)}</p>
          </div>
        )}
      </Modal>

      <Modal open={mode === 'delete'} onClose={closeModal} title="Hapus Produk">
        <p className="text-sm leading-6 text-white/70">
          Yakin ingin menghapus <span className="font-semibold text-white">{selected?.name}</span>? Request akan dikirim ke endpoint backend produk.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={closeModal} disabled={submitting}>Batal</Button>
          <Button variant="danger" className="flex-1" onClick={() => void handleDelete()} disabled={submitting}>{submitting ? 'Menghapus...' : 'Hapus'}</Button>
        </div>
      </Modal>
    </ManagerPageShell>
  );
}
