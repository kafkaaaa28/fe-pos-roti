import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Eye, PackageCheck, Phone, Play, XCircle } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { formatRupiah } from '../../utils/formatter';
import type { OnlineOrder, OnlineOrderStatus } from '../../types/orders';
import { fetchCashierOrders, getFulfillmentLabel, getNextCashierStatus, getOnlineOrders, getPaymentLabel, getStatusLabel, updateOnlineOrderStatus } from '../../services/orderStore';

const STATUS_STYLE: Record<OnlineOrderStatus, string> = {
  PENDING: 'border-white/10 bg-white/10 text-white/65',
  PAID: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
  PROCESSING: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  READY: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  COMPLETED: 'border-mint/25 bg-mint/10 text-mint',
  CANCELLED: 'border-red-400/25 bg-red-500/10 text-red-200',
};

function getActionLabel(status: OnlineOrderStatus) {
  if (status === 'PENDING') return 'Tandai Dibayar';
  if (status === 'PAID') return 'Proses';
  if (status === 'PROCESSING') return 'Siap';
  if (status === 'READY') return 'Selesai';
  return 'Selesai';
}

function getActionIcon(status: OnlineOrderStatus) {
  if (status === 'READY') return CheckCircle2;
  if (status === 'PROCESSING') return PackageCheck;
  return Play;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Orders() {
  const [orders, setOrders] = useState<OnlineOrder[]>(() => getOnlineOrders());
  const [selected, setSelected] = useState<OnlineOrder | null>(null);
  const [toast, setToast] = useState({ open: false, tone: 'success' as 'success' | 'error' | 'info', title: '', message: '' });

  const summary = useMemo(
    () => ({
      incoming: orders.filter((order) => order.status === 'PAID' || order.status === 'PENDING').length,
      processing: orders.filter((order) => order.status === 'PROCESSING').length,
      ready: orders.filter((order) => order.status === 'READY').length,
    }),
    [orders],
  );

  useEffect(() => {
    const sync = () =>
      fetchCashierOrders()
        .then(setOrders)
        .catch(() => setOrders(getOnlineOrders()));
    sync();
    window.addEventListener('beard-papas-orders-updated', sync as EventListener);
    window.addEventListener('papa-bread-orders-updated', sync as EventListener);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('beard-papas-orders-updated', sync as EventListener);
      window.removeEventListener('papa-bread-orders-updated', sync as EventListener);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const showToast = (tone: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2400);
  };

  const refreshOrders = () =>
    fetchCashierOrders()
      .then(setOrders)
      .catch(() => setOrders(getOnlineOrders()));

  const updateStatus = async (order: OnlineOrder, nextStatus?: OnlineOrderStatus) => {
    const target = nextStatus ?? getNextCashierStatus(order.status);
    if (!target) return;
    const updated = await updateOnlineOrderStatus(order.id, target);
    refreshOrders();
    if (selected?.id === order.id && updated) setSelected(updated);
    showToast('success', 'Status pesanan diperbarui', `${order.queueNumber || order.id} menjadi ${getStatusLabel(target, order.fulfillmentType)}.`);
  };

  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-8 pt-20 sm:px-5 lg:px-8 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Kasir Beard Papa's</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">Pesanan Online</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/45">Proses pesanan customer dari status masuk, diproses, siap diambil/saji, sampai selesai.</p>
        </motion.div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Pesanan Masuk', value: summary.incoming, icon: Clock },
            { label: 'Sedang Diproses', value: summary.processing, icon: Play },
            { label: 'Siap Diambil/Saji', value: summary.ready, icon: PackageCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-surface p-4 shadow-xl shadow-black/15">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-white/45">{label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-accent">{value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon size={21} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <div className="responsive-scroll-x">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-white/50">
                  {['No. Order', 'Customer', 'Tipe', 'Item', 'Total', 'Pembayaran', 'Status', 'Aksi'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const next = getNextCashierStatus(order.status);
                  const ActionIcon = getActionIcon(order.status);
                  return (
                    <tr key={order.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? 'bg-white/[0.02]' : ''}`}>
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-bold text-accent">{order.queueNumber || order.id}</p>
                        <p className="mt-1 text-[11px] text-white/35">{order.id}</p>
                        <p className="mt-1 text-[11px] text-white/35">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{order.customerName}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-white/40">
                          <Phone size={12} /> {order.customerPhone}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-white/65">
                        {getFulfillmentLabel(order.fulfillmentType)}
                        {order.tableNumber ? ` • Meja ${order.tableNumber}` : ''}
                      </td>
                      <td className="px-5 py-4 text-white/65">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}</td>
                      <td className="px-5 py-4 font-bold text-white">{formatRupiah(order.total)}</td>
                      <td className="px-5 py-4 text-white/65">{getPaymentLabel(order.paymentMethod)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLE[order.status]}`}>{getStatusLabel(order.status, order.fulfillmentType)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setSelected(order)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-accent hover:text-accent">
                            <Eye size={14} /> Detail
                          </button>
                          {next && (
                            <button onClick={() => updateStatus(order)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-dark hover:bg-cream">
                              <ActionIcon size={14} /> {getActionLabel(order.status)}
                            </button>
                          )}
                          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                            <button onClick={() => updateStatus(order, 'CANCELLED')} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20">
                              <XCircle size={14} /> Batal
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Pesanan Online" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-dark/45 p-4">
              <div className="grid gap-3 text-sm text-white/65 sm:grid-cols-2">
                <p>
                  <span className="text-white/35">No Antrian:</span> {selected.queueNumber || selected.id}
                </p>
                <p>
                  <span className="text-white/35">No Order:</span> {selected.id}
                </p>
                <p>
                  <span className="text-white/35">Tanggal:</span> {formatDate(selected.createdAt)}
                </p>
                <p>
                  <span className="text-white/35">Nama:</span> {selected.customerName}
                </p>
                <p>
                  <span className="text-white/35">No HP:</span> {selected.customerPhone}
                </p>
                <p>
                  <span className="text-white/35">Tipe:</span> {getFulfillmentLabel(selected.fulfillmentType)}
                  {selected.tableNumber ? ` / Meja ${selected.tableNumber}` : ''}
                </p>
                <p>
                  <span className="text-white/35">Pembayaran:</span> {getPaymentLabel(selected.paymentMethod)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {selected.items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-dark/35 p-3 text-sm">
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {item.quantity} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <p className="font-bold text-accent">{formatRupiah(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4">
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-white/70">Total</span>
                <span className="font-bold text-accent">{formatRupiah(selected.total)}</span>
              </div>
            </div>
            {selected.note && (
              <div className="rounded-2xl border border-white/10 bg-surface p-4 text-sm text-white/60">
                <span className="font-bold text-white">Catatan:</span> {selected.note}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {getNextCashierStatus(selected.status) && (
                <button onClick={() => updateStatus(selected)} className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-dark hover:bg-cream">
                  {getActionLabel(selected.status)}
                </button>
              )}
              {selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                <button onClick={() => updateStatus(selected, 'CANCELLED')} className="rounded-xl bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 hover:bg-red-500/20">
                  Batalkan Pesanan
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />
    </div>
  );
}
