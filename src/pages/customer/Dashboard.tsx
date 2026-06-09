import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Minus, PackageCheck, Plus, Search, ShoppingBag, ShoppingCart, Sparkles, X } from 'lucide-react';
import CustomerShell from '../../components/customer/CustomerShell';
import Toast, { type ToastTone } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { PUBLIC_IMAGE_PRELOADS, PUBLIC_PRODUCT_CATEGORIES, PUBLIC_PRODUCTS, type PublicProduct, type PublicProductCategory } from '../../data/publicProducts';
import { preloadImages } from '../../utils/imageCache';
import { formatRupiah } from '../../utils/formatter';
import type { OnlineOrder, OnlineOrderStatus } from '../../types/orders';
import { fetchCustomerOrders, getCustomerOrders, getFulfillmentLabel, getStatusLabel } from '../../services/orderStore';
import { getPublicProducts } from '../../services/product.service';

type ActiveCategory = 'all' | PublicProductCategory;

const statusColor: Record<OnlineOrderStatus, string> = {
  PENDING: 'border-white/10 bg-white/10 text-white/65',
  PAID: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
  PROCESSING: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  READY: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  COMPLETED: 'border-mint/25 bg-mint/10 text-mint',
  CANCELLED: 'border-red-400/25 bg-red-500/10 text-red-200',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, addItem, updateQty, removeItem } = useCart();
  const [orders, setOrders] = useState<OnlineOrder[]>(() => getCustomerOrders());
  const [menuProducts, setMenuProducts] = useState<PublicProduct[]>(PUBLIC_PRODUCTS);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [cartSheetMinimized, setCartSheetMinimized] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: 'success' as ToastTone, title: '', message: '' });

  const activeOrders = useMemo(() => orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status)), [orders]);

  const filteredProducts = useMemo(() => {
    return menuProducts.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesQuery = `${product.name} ${product.desc} ${product.tag} ${product.categoryLabel}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, menuProducts]);

  useEffect(() => {
    preloadImages(PUBLIC_IMAGE_PRELOADS);
    getPublicProducts().then((items) => {
      setMenuProducts(items);
      preloadImages(items.map((item) => item.image));
    });
    fetchCustomerOrders().then(setOrders);
  }, []);

  useEffect(() => {
    const sync = () =>
      fetchCustomerOrders()
        .then(setOrders)
        .catch(() => setOrders(getCustomerOrders()));
    window.addEventListener('beard-papas-orders-updated', sync as EventListener);
    window.addEventListener('papa-bread-orders-updated', sync as EventListener);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('beard-papas-orders-updated', sync as EventListener);
      window.removeEventListener('papa-bread-orders-updated', sync as EventListener);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const rawPendingItem = sessionStorage.getItem('pending-cart-item');
    if (!rawPendingItem || !user) return;

    try {
      const item = JSON.parse(rawPendingItem) as { id: string; name: string; price: number; image?: string; qty: number };
      addItem(item);
      sessionStorage.removeItem('pending-cart-item');
      setToast({
        open: true,
        tone: 'success',
        title: 'Menu masuk keranjang',
        message: `${item.name} otomatis ditambahkan setelah login.`,
      });
      window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2600);
    } catch {
      sessionStorage.removeItem('pending-cart-item');
    }
  }, [addItem, user]);

  const closeCartSheet = () => {
    setCartSheetOpen(false);
    setCartSheetMinimized(false);
  };

  const handleCartSheetDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 70) {
      setCartSheetMinimized(true);
      return;
    }

    if (info.offset.y < -35) {
      setCartSheetMinimized(false);
    }
  };

  const addProductToCart = (product: PublicProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1,
    });

    setCartSheetOpen(true);
    setCartSheetMinimized(false);
    setToast({
      open: true,
      tone: 'success',
      title: 'Menu ditambahkan',
      message: `${product.name} masuk ke keranjang. Kamu tetap bisa pilih menu lain.`,
    });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2200);
  };

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CustomerShell>
      <div className={`mx-auto max-w-7xl ${cartSheetOpen && items.length > 0 ? 'pb-48 sm:pb-56' : ''}`}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Customer Area</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">Pesan Menu Beard Papa's</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">Halo, {user?.name || 'Customer'}. Pilih menu, atur jumlah, lanjutkan ke keranjang, lalu tracking status pesanan sampai siap diambil/disajikan.</p>
        </motion.div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Pesanan Aktif', value: activeOrders.length, icon: PackageCheck },
            { label: 'Item Keranjang', value: totalQty, icon: ShoppingCart },
            { label: 'Total Keranjang', value: formatRupiah(total), icon: ShoppingBag },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-surface p-4 shadow-xl shadow-black/15">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-white/45">{label}</p>
                  <p className="mt-1 truncate font-display text-xl font-bold text-accent sm:text-2xl">{value}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon size={21} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeOrders.length > 0 && (
          <section className="mb-7 rounded-3xl border border-white/10 bg-surface p-4 shadow-xl shadow-black/15 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Tracking Pesanan Aktif</h2>
                <p className="text-xs text-white/40">Status berubah ketika kasir memproses pesanan.</p>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {activeOrders.slice(0, 2).map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-dark/45 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-accent">{order.queueNumber || order.id}</p>
                      <p className="mt-1 line-clamp-2 font-bold text-white">
                        {order.customerName} • {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {getFulfillmentLabel(order.fulfillmentType)}
                        {order.tableNumber ? ` • Meja ${order.tableNumber}` : ''} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusColor[order.status]}`}>{getStatusLabel(order.status, order.fulfillmentType)}</span>
                      <p className="mt-2 font-bold text-accent">{formatRupiah(order.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-surface p-4 shadow-xl shadow-black/20 sm:p-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
                <Sparkles size={13} fill="currentColor" /> Menu Customer
              </span>
              <h2 className="font-display text-2xl font-bold text-white">Daftar Menu</h2>
              <p className="mt-1 text-sm text-white/45">Klik Tambah, atur quantity di modal kecil, lalu lanjutkan ke keranjang.</p>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari menu..."
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-dark/60 px-11 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="mb-7 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3">
              {PUBLIC_PRODUCT_CATEGORIES.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all active:scale-95 ${
                      isActive ? 'border-accent bg-accent text-dark shadow-lg shadow-accent/20' : 'border-white/10 bg-dark/45 text-white/70 hover:border-accent/60 hover:text-accent'
                    }`}
                  >
                    <span className="block whitespace-nowrap">{category.title}</span>
                    <span className={`mt-0.5 block text-xs ${isActive ? 'text-dark/60' : 'text-white/35'}`}>{category.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.025 }}
                className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-dark/50 transition-all hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/10 sm:rounded-3xl"
              >
                <div className="relative h-36 overflow-hidden bg-cream sm:h-52">
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-4" />
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white sm:left-4 sm:top-4 sm:px-3 sm:text-xs">{product.tag}</span>
                </div>
                <div className="p-3 sm:p-5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-accent sm:text-xs">{product.categoryLabel}</p>
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-white sm:text-lg">{product.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-white/45 sm:text-sm">{product.desc}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-bold text-accent sm:text-base">{formatRupiah(product.price)}</span>
                    <button
                      type="button"
                      onClick={() => addProductToCart(product)}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-dark shadow-lg shadow-accent/15 transition-colors hover:bg-cream active:scale-95 sm:w-auto sm:text-sm"
                    >
                      <ShoppingCart size={15} /> Tambah
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProducts.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/45">Menu tidak ditemukan. Coba kategori atau kata kunci lain.</div>}
        </section>
      </div>

      <AnimatePresence>
        {cartSheetOpen && items.length > 0 && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4 md:left-64 md:px-6"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={handleCartSheetDragEnd}
          >
            <div className={`mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl shadow-black/50 ring-1 ring-accent/10 transition-all duration-300 ${cartSheetMinimized ? 'p-3' : 'p-4 sm:p-5'}`}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />

              {cartSheetMinimized ? (
                <button type="button" onClick={() => setCartSheetMinimized(false)} className="flex w-full items-center justify-between gap-3 text-left" aria-label="Buka keranjang ringkas">
                  <div className="min-w-0">
                    <p className="font-bold text-white">Keranjang aktif</p>
                    <p className="mt-0.5 text-xs text-white/45">
                      {items.length} jenis item, {totalQty} pcs • tap/swipe atas untuk buka
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-accent">{formatRupiah(total)}</p>
                </button>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Keranjang Customer</p>
                      <h3 className="mt-1 font-display text-xl font-bold text-white">Daftar Menu Dipilih</h3>
                      <p className="mt-1 text-xs text-white/40">Pilih menu lain tetap bisa dilakukan. Keranjang ini hanya panel ringkas.</p>
                    </div>
                    <button type="button" onClick={closeCartSheet} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/55 hover:bg-white/10 hover:text-white" aria-label="Tutup keranjang ringkas">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1 sm:max-h-64">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-dark/45 p-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream">
                          <img src={item.image} alt={item.name} className="h-full w-full object-contain p-1.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-bold text-white">{item.name}</p>
                          <p className="mt-1 text-xs text-white/40">{formatRupiah(item.price)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => (item.qty <= 1 ? removeItem(item.id) : updateQty(item.id, item.qty - 1))}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:border-accent/60 hover:text-accent"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-8 text-center text-sm font-bold text-white">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:border-accent/60 hover:text-accent"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            aria-label={`Hapus ${item.name}`}
                          >
                            <X size={14} />
                          </button>
                          <p className="text-sm font-bold text-accent">{formatRupiah(item.price * item.qty)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 p-3">
                    <div className="flex justify-between gap-4 text-xs text-white/60">
                      <span>Total Item</span>
                      <span>{totalQty} pcs</span>
                    </div>
                    <div className="mt-1.5 flex items-end justify-between gap-4">
                      <span className="text-sm font-semibold text-white/65">Total Harga</span>
                      <span className="text-lg font-bold text-accent">{formatRupiah(total)}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-xs text-white/35">Swipe bawah untuk minimize. Swipe atas untuk buka lagi.</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setCartSheetMinimized(true)} className="min-h-12 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 hover:border-white/25 hover:text-white">
                      Pilih Menu Lagi
                    </button>
                    <button type="button" onClick={() => navigate('/customer/cart')} className="min-h-12 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-dark hover:bg-cream">
                      Selesaikan Pesanan
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />
    </CustomerShell>
  );
}
