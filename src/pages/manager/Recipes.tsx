import { useEffect, useMemo, useState } from 'react';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Toast, { type ToastTone } from '../../components/common/Toast';
import ManagerPageShell from '../../components/manager/ManagerPageShell';
import ManagerCrudTable from '../../components/manager/ManagerCrudTable';
import { createManagerRecipe, deleteManagerRecipe, listManagerMaterials, listManagerProducts, listManagerRecipes, updateManagerRecipe } from '../../services/manager.service';
import { getApiErrorMessage } from '../../services/error';
import type { ManagerMaterial, ManagerProduct, ManagerRecipe, RecipeMaterialLine, RecipePayload } from '../../types/manager';
import { formatDate, formatNumber } from '../../utils/formatter';

const EMPTY_LINE: RecipeMaterialLine = { materialId: '', materialName: '', quantity: 0, unit: 'kg' };
const EMPTY_FORM = { productId: '', productName: '', materials: [{ ...EMPTY_LINE }] };

function formatMaterials(materials: RecipeMaterialLine[]) {
  return materials.map((item) => `${item.materialName} ${item.quantity} ${item.unit}`).join(', ');
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<ManagerRecipe[]>([]);
  const [products, setProducts] = useState<ManagerProduct[]>([]);
  const [materials, setMaterials] = useState<ManagerMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'add' | 'edit' | 'detail' | 'delete' | null>(null);
  const [selected, setSelected] = useState<ManagerRecipe | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ open: false, tone: 'success' as ToastTone, title: '', message: '' });

  const showToast = (tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2300);
  };

  const loadData = async () => {
    const [recipeResult, productResult, materialResult] = await Promise.allSettled([
      listManagerRecipes(),
      listManagerProducts(),
      listManagerMaterials(),
    ]);

    if (recipeResult.status === 'fulfilled') {
      setRecipes(recipeResult.value.data);
    } else {
      showToast('error', 'Recipe gagal dimuat', getApiErrorMessage(recipeResult.reason));
      setRecipes([]);
    }

    if (productResult.status === 'fulfilled') {
      setProducts(productResult.value.data.filter((item) => item.status === 'ACTIVE'));
    } else {
      showToast('error', 'Produk gagal dimuat', getApiErrorMessage(productResult.reason));
      setProducts([]);
    }

    if (materialResult.status === 'fulfilled') {
      setMaterials(materialResult.value.data);
    } else {
      showToast('error', 'Bahan gagal dimuat', getApiErrorMessage(materialResult.reason));
      setMaterials([]);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => recipes.filter((item) => [item.id, item.productName, formatMaterials(item.materials)].join(' ').toLowerCase().includes(search.toLowerCase())), [recipes, search]);

  const openAdd = () => {
    const firstProduct = products[0];
    setSelected(null);
    setForm({ productId: firstProduct?.id ?? '', productName: firstProduct?.name ?? '', materials: [{ ...EMPTY_LINE }] });
    setMode('add');
  };

  const openEdit = (item: ManagerRecipe) => {
    setSelected(item);
    setForm({ productId: item.productId, productName: item.productName, materials: item.materials.map((line) => ({ ...line })) });
    setMode('edit');
  };

  const closeModal = () => {
    setMode(null);
    setSelected(null);
  };

  const setProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({ ...current, productId, productName: product?.name ?? '' }));
  };

  const setMaterialLine = (index: number, key: keyof RecipeMaterialLine, value: string) => {
    setForm((current) => ({
      ...current,
      materials: current.materials.map((line, currentIndex) => {
        if (currentIndex !== index) return line;
        if (key === 'materialId') {
          const material = materials.find((item) => item.id === value);
          return { ...line, materialId: value, materialName: material?.name ?? '', unit: material?.unit ?? line.unit };
        }
        return { ...line, [key]: key === 'quantity' ? Number(value) : value };
      }),
    }));
  };

  const addLine = () => setForm((current) => ({ ...current, materials: [...current.materials, { ...EMPTY_LINE }] }));
  const removeLine = (index: number) => setForm((current) => ({ ...current, materials: current.materials.filter((_, currentIndex) => currentIndex !== index) }));

  const toPayload = (): RecipePayload | null => {
    const cleanLines = form.materials.filter((line) => line.materialId && line.materialName && Number(line.quantity) > 0);
    if (!form.productId || !form.productName || cleanLines.length === 0) return null;
    return { productId: form.productId, productName: form.productName, materials: cleanLines };
  };

  const handleSubmit = async () => {
    const payload = toPayload();
    if (!payload) {
      showToast('error', 'Recipe belum valid', 'Pilih produk dan minimal satu bahan dengan jumlah lebih dari 0.');
      return;
    }
    if (mode === 'add') {
      await createManagerRecipe(payload);
      showToast('success', 'Recipe ditambahkan', `BOM ${payload.productName} berhasil ditambahkan.`);
    }
    if (mode === 'edit' && selected) {
      await updateManagerRecipe(selected.id, payload);
      showToast('success', 'Recipe diperbarui', `BOM ${payload.productName} berhasil diperbarui.`);
    }
    closeModal();
    await loadData();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deleteManagerRecipe(selected.id);
    showToast('success', 'Recipe dihapus', `BOM ${selected.productName} berhasil dihapus.`);
    closeModal();
    await loadData();
  };

  return (
    <ManagerPageShell
      title="Resep / BOM"
      subtitle="Kelola komposisi bahan baku setiap produk. Struktur dibuat sesuai tabel Recipes: product_id, material_id, dan quantity."
      badge="Manager • Recipe / Bill of Material"
      action={
        <Button onClick={openAdd} className="inline-flex items-center gap-2">
          <Plus size={16} /> Tambah Resep
        </Button>
      }
    >
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Total Recipe</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatNumber(recipes.length)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Produk Aktif</p>
          <p className="mt-1 text-2xl font-bold text-accent">{formatNumber(products.length)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs text-white/40">Bahan Terdaftar</p>
          <p className="mt-1 text-2xl font-bold text-mint">{formatNumber(materials.length)}</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-surface p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari kode, produk, atau nama bahan..."
          className="w-full max-w-md rounded-xl border border-white/10 bg-dark px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
        />
      </div>

      <ManagerCrudTable headers={['Kode', 'Produk', 'Jumlah Bahan', 'Komposisi', 'Aksi']} empty={filtered.length === 0}>
        {filtered.map((item, index) => (
          <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? 'bg-white/[0.02]' : ''}`}>
            <td className="px-5 py-3 font-mono text-xs text-accent">{item.id}</td>
            <td className="px-5 py-3 font-semibold text-white">{item.productName}</td>
            <td className="px-5 py-3 text-white/70">{item.materials.length} bahan</td>
            <td className="max-w-md px-5 py-3 text-white/60">{formatMaterials(item.materials)}</td>
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
        ))}
      </ManagerCrudTable>

      <Modal open={mode === 'add' || mode === 'edit'} onClose={closeModal} title={mode === 'add' ? 'Tambah Recipe/BOM' : 'Edit Recipe/BOM'} size="xl">
        <div className="space-y-4">
          <select value={form.productId} onChange={(event) => setProduct(event.target.value)} className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-sm text-white outline-none focus:border-primary">
            <option value="">Pilih produk</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="space-y-3">
            {form.materials.map((line, index) => (
              <div key={`${line.materialId}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-dark/60 p-3 md:grid-cols-[1fr_120px_90px_44px]">
                <select
                  value={line.materialId}
                  onChange={(event) => setMaterialLine(index, 'materialId', event.target.value)}
                  className="rounded-xl border border-white/10 bg-dark px-3 py-2 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="">Pilih bahan</option>
                  {materials.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  value={line.quantity || ''}
                  onChange={(event) => setMaterialLine(index, 'quantity', event.target.value)}
                  type="number"
                  className="rounded-xl border border-white/10 bg-dark px-3 py-2 text-sm text-white outline-none focus:border-primary"
                  placeholder="Jumlah"
                />
                <input value={line.unit} disabled className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 outline-none" />
                <button onClick={() => removeLine(index)} disabled={form.materials.length === 1} className="rounded-xl bg-red-900/20 text-red-400 disabled:cursor-not-allowed disabled:opacity-40">
                  <Trash2 size={16} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={addLine} className="w-full">
            Tambah Baris Bahan
          </Button>
          <Button onClick={() => void handleSubmit()} className="w-full">
            {mode === 'add' ? 'Simpan Recipe' : 'Simpan Perubahan'}
          </Button>
        </div>
      </Modal>

      <Modal open={mode === 'detail'} onClose={closeModal} title="Detail Recipe/BOM" size="lg">
        {selected && (
          <div>
            <p className="mb-4 text-sm text-white/60">
              Produk: <span className="font-semibold text-white">{selected.productName}</span>
            </p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Bahan</th>
                    <th className="px-4 py-2 text-left">Jumlah</th>
                    <th className="px-4 py-2 text-left">Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.materials.map((line) => (
                    <tr key={line.materialId} className="border-t border-white/5">
                      <td className="px-4 py-2 text-white">{line.materialName}</td>
                      <td className="px-4 py-2 text-white/70">{line.quantity}</td>
                      <td className="px-4 py-2 text-white/70">{line.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-white/30">Update: {formatDate(selected.updatedAt)}</p>
          </div>
        )}
      </Modal>

      <Modal open={mode === 'delete'} onClose={closeModal} title="Hapus Recipe/BOM">
        <p className="text-sm leading-6 text-white/70">
          Yakin ingin menghapus recipe <span className="font-semibold text-white">{selected?.productName}</span>?
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
