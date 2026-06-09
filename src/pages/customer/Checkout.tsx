import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, MapPin, QrCode, ShoppingBag, StickyNote, User, Phone } from 'lucide-react';
import Modal from '../../components/common/Modal';
import CustomerShell from '../../components/customer/CustomerShell';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { formatRupiah } from '../../utils/formatter';
import { createOnlineOrder } from '../../services/orderStore';
import { payWithMidtransSnap } from '../../services/midtrans.service';
import { getApiErrorMessage } from '../../services/error';
import type { OrderFulfillmentType, OrderPaymentMethod } from '../../types/orders';

const paymentOptions: { id: OrderPaymentMethod; label: string; desc: string; icon: typeof QrCode }[] = [
  { id: 'QRIS', label: 'QRIS', desc: 'Bayar melalui Midtrans Snap QRIS.', icon: QrCode },
  { id: 'TRANSFER', label: 'Transfer', desc: 'Bayar melalui Midtrans Snap bank transfer.', icon: CreditCard },
];

function readSavedProfile() {
  const raw = localStorage.getItem('beard-papas-customer-profile') || localStorage.getItem('bread-papa-customer-profile');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as { name?: string; email?: string; phone?: string };
  } catch {
    localStorage.removeItem('beard-papas-customer-profile');
    localStorage.removeItem('bread-papa-customer-profile');
    return null;
  }
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const savedProfile = readSavedProfile();
  const [customerName, setCustomerName] = useState(savedProfile?.name || user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(savedProfile?.phone || user?.phone || '');
  const [fulfillmentType, setFulfillmentType] = useState<OrderFulfillmentType>('TAKE_AWAY');
  const [tableNumber, setTableNumber] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('QRIS');
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [createdQueueNumber, setCreatedQueueNumber] = useState('');
  const [toast, setToast] = useState({ open: false, tone: 'error' as 'success' | 'error' | 'info', title: '', message: '' });

  const totalQty = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  const showToast = (title: string, message: string, tone: 'success' | 'error' | 'info' = 'error') => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2400);
  };

  const submitOrder = async () => {
    if (items.length === 0) return showToast('Keranjang kosong', 'Tambahkan menu terlebih dahulu sebelum checkout.');
    if (!customerName.trim()) return showToast('Nama wajib diisi', 'Isi nama pemesan agar kasir mudah memproses pesanan.');
    if (!customerPhone.trim()) return showToast('Nomor HP wajib diisi', 'Isi nomor HP untuk update pesanan.');
    if (fulfillmentType === 'DINE_IN' && !tableNumber.trim()) return showToast('Nomor meja wajib diisi', 'Untuk makan di tempat, nomor meja perlu diisi.');

    setSubmitting(true);
    try {
      const order = await createOnlineOrder({
        customerId: user?.id,
        customerName: customerName.trim(),
        customerEmail: user?.email,
        customerPhone: customerPhone.trim(),
        fulfillmentType,
        tableNumber: tableNumber.trim(),
        note: note.trim(),
        paymentMethod,
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          image: item.image,
          quantity: item.qty,
          price: item.price,
        })),
      });
      if (!order.snapToken) {
        showToast('Token pembayaran tidak ditemukan', 'Token pembayaran Midtrans tidak ditemukan dari response backend.');
        return;
      }

      clear();
      setSuccessOpen(false);
      setCreatedOrderId(order.invoiceNumber || order.id);
      setCreatedQueueNumber(order.queueNumber || order.id);
      await payWithMidtransSnap(order.snapToken, {
        onSuccess() {
          navigate('/customer/orders');
        },
        onPending() {
          navigate('/customer/orders');
        },
        onError() {
          showToast('Pembayaran gagal', 'Midtrans mengembalikan status error untuk pembayaran ini.');
        },
        onClose() {
          showToast('Pembayaran ditutup', 'Popup pembayaran ditutup sebelum selesai. Kamu bisa cek status pesanan di halaman tracking.', 'info');
        },
      });
    } catch (error) {
      showToast('Checkout gagal', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerShell>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Customer Checkout</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">Checkout Pesanan</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">Isi data pemesan, pilih dine in atau take away, lalu pilih metode pembayaran.</p>

          <div className="mt-7 space-y-5 rounded-3xl border border-white/10 bg-surface p-4 shadow-xl shadow-black/20 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
                  <User size={14} className="text-accent" /> Nama Pemesan
                </span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60"
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
                  <Phone size={14} className="text-accent" /> No. HP / WhatsApp
                </span>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60"
                />
              </label>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-white">Tipe Pesanan</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { id: 'TAKE_AWAY', label: 'Take Away', desc: 'Pesanan diambil di toko.' },
                  { id: 'DINE_IN', label: 'Makan di Tempat', desc: 'Pesanan disajikan ke meja.' },
                ].map((type) => {
                  const selected = fulfillmentType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFulfillmentType(type.id as OrderFulfillmentType)}
                      className={`rounded-2xl border p-4 text-left transition-all active:scale-95 ${selected ? 'border-accent bg-accent text-dark' : 'border-white/10 bg-dark/45 text-white hover:border-accent/60'}`}
                    >
                      <MapPin size={20} className={selected ? 'text-dark' : 'text-accent'} />
                      <p className="mt-2 font-bold">{type.label}</p>
                      <p className={`mt-1 text-xs ${selected ? 'text-dark/65' : 'text-white/40'}`}>{type.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {fulfillmentType === 'DINE_IN' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-white/55">Nomor Meja</span>
                <input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Contoh: A3 / 12"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
                <StickyNote size={14} className="text-accent" /> Catatan Pesanan
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Contoh: less sweet, ambil jam 15.00"
                className="w-full resize-none rounded-xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent/60"
              />
            </label>

            <div>
              <p className="mb-3 text-sm font-semibold text-white">Metode Pembayaran</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {paymentOptions.map((option) => {
                  const selected = paymentMethod === option.id;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id)}
                      className={`rounded-2xl border p-4 text-left transition-all active:scale-95 ${selected ? 'border-accent bg-accent text-dark' : 'border-white/10 bg-dark/45 text-white hover:border-accent/60'}`}
                    >
                      <Icon size={20} className={selected ? 'text-dark' : 'text-accent'} />
                      <p className="mt-2 font-bold">{option.label}</p>
                      <p className={`mt-1 text-xs ${selected ? 'text-dark/65' : 'text-white/40'}`}>{option.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <aside className="h-fit rounded-3xl border border-white/10 bg-surface p-4 shadow-xl shadow-black/20 sm:p-5 lg:sticky lg:top-24">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag className="text-accent" size={20} />
            <div>
              <h2 className="font-display text-xl font-bold text-white">Ringkasan Pesanan</h2>
              <p className="text-xs text-white/40">{totalQty} item</p>
            </div>
          </div>
          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-white/40">Keranjang masih kosong.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl border border-white/10 bg-dark/45 p-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-cream">
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {item.qty} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-accent">{formatRupiah(item.price * item.qty)}</p>
                </div>
              ))
            )}
          </div>
          <div className="my-5 border-t border-white/10" />
          <div className="mb-5 flex justify-between gap-4">
            <span className="text-white/65">Total</span>
            <span className="font-display text-2xl font-bold text-accent">{formatRupiah(total)}</span>
          </div>
          <button
            type="button"
            onClick={submitOrder}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-dark shadow-lg shadow-accent/20 transition-colors hover:bg-cream active:scale-95"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </aside>
      </div>

      <Modal open={successOpen} onClose={() => navigate('/customer/orders')} title="Pesanan Berhasil Dibuat" size="md">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
            <ShoppingBag size={30} />
          </div>
          <div>
            <p className="font-bold text-white">Pesanan kamu sudah masuk ke kasir.</p>
            <p className="mt-1 text-sm text-white/45">
              No. Antrian: <span className="font-mono text-accent">{createdQueueNumber}</span>
            </p>
            <p className="mt-1 text-xs text-white/35">
              No. Order: <span className="font-mono text-white/55">{createdOrderId}</span>
            </p>
          </div>
          <button onClick={() => navigate('/customer/orders')} className="min-h-12 w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-dark hover:bg-cream">
            Lihat Status Pesanan
          </button>
        </div>
      </Modal>
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />
    </CustomerShell>
  );
}
