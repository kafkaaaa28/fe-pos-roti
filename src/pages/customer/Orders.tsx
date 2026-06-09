import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, PackageCheck, ReceiptText, Utensils } from 'lucide-react';
import CustomerShell from '../../components/customer/CustomerShell';
import { formatRupiah } from '../../utils/formatter';
import type { OnlineOrder, OnlineOrderStatus } from '../../types/orders';
import { fetchCustomerOrders, getCustomerOrders, getFulfillmentLabel, getPaymentLabel, getStatusLabel } from '../../services/orderStore';

const statusColor: Record<OnlineOrderStatus, string> = {
  PENDING: 'border-white/10 bg-white/10 text-white/65',
  PAID: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
  PROCESSING: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  READY: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  COMPLETED: 'border-mint/25 bg-mint/10 text-mint',
  CANCELLED: 'border-red-400/25 bg-red-500/10 text-red-200',
};

const statusStep: Record<OnlineOrderStatus, number> = {
  PENDING: 1,
  PAID: 2,
  PROCESSING: 3,
  READY: 4,
  COMPLETED: 5,
  CANCELLED: 0,
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function TrackingSteps({ order }: { order: OnlineOrder }) {
  const steps = [
    { key: 'PENDING', label: 'Order Masuk' },
    { key: 'PAID', label: 'Pembayaran' },
    { key: 'PROCESSING', label: 'Diproses' },
    { key: 'READY', label: order.fulfillmentType === 'DINE_IN' ? 'Siap Disajikan' : 'Siap Diambil' },
    { key: 'COMPLETED', label: 'Selesai' },
  ];

  const currentStep = statusStep[order.status];

  if (order.status === 'CANCELLED') {
    return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-200">Pesanan dibatalkan.</div>;
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {steps.map((step, index) => {
        const active = index + 1 <= currentStep;
        return (
          <div key={step.key} className="min-w-0">
            <div className={`h-2 rounded-full ${active ? 'bg-accent' : 'bg-white/10'}`} />
            <p className={`mt-2 truncate text-[10px] font-semibold ${active ? 'text-accent' : 'text-white/35'}`}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<OnlineOrder[]>(() => getCustomerOrders());

  useEffect(() => {
    const sync = () =>
      fetchCustomerOrders()
        .then(setOrders)
        .catch(() => setOrders(getCustomerOrders()));
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

  return (
    <CustomerShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Customer Tracking</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">Tracking Pesanan</h1>
          <p className="mt-2 text-sm text-white/45">Pantau antrian dan status pesanan. Ketika status siap, nama dan nomor antrian akan dipanggil penyaji.</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-surface p-8 text-center">
            <PackageCheck className="mx-auto text-accent" size={36} />
            <p className="mt-4 font-bold text-white">Belum ada pesanan</p>
            <p className="mt-1 text-sm text-white/45">Checkout menu dulu untuk melihat tracking pesanan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-surface p-4 shadow-xl shadow-black/15 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent px-3 py-1 font-mono text-xs font-bold text-dark">{order.queueNumber || order.id}</span>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusColor[order.status]}`}>{getStatusLabel(order.status, order.fulfillmentType)}</span>
                    </div>
                    <h2 className="mt-3 font-display text-xl font-bold text-white">{order.customerName}</h2>
                    <p className="mt-1 text-xs text-white/40">
                      {formatDate(order.createdAt)} • {getFulfillmentLabel(order.fulfillmentType)}
                      {order.tableNumber ? ` • Meja ${order.tableNumber}` : ''} • {getPaymentLabel(order.paymentMethod)}
                    </p>
                    <div className="mt-4 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.productId} className="flex justify-between gap-4 rounded-2xl border border-white/10 bg-dark/35 p-3 text-sm">
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-bold text-white">{item.name}</p>
                            <p className="mt-1 text-xs text-white/40">
                              {item.quantity} x {formatRupiah(item.price)}
                            </p>
                          </div>
                          <p className="shrink-0 font-bold text-accent">{formatRupiah(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                    {order.note && <p className="mt-3 rounded-2xl border border-white/10 bg-dark/35 p-3 text-xs text-white/45">Catatan: {order.note}</p>}
                  </div>

                  <aside className="min-w-0 rounded-2xl border border-white/10 bg-dark/35 p-4 lg:w-72">
                    <div className="mb-4 flex items-center gap-2">
                      <Clock3 className="text-accent" size={18} />
                      <p className="font-bold text-white">Progress</p>
                    </div>
                    <TrackingSteps order={order} />
                    <div className="mt-5 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-white/45">
                        <Utensils size={15} className="text-accent" /> {order.fulfillmentType === 'DINE_IN' ? `Dine In${order.tableNumber ? ` - Meja ${order.tableNumber}` : ''}` : 'Take Away'}
                      </div>
                      <div className="flex items-center gap-2 text-white/45">
                        <ReceiptText size={15} className="text-accent" /> Total {formatRupiah(order.total)}
                      </div>
                    </div>
                  </aside>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
