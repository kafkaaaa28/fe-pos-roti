import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Search, ShoppingBag } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Toast, { type ToastTone } from '../../components/common/Toast';
import CustomerShell from '../../components/customer/CustomerShell';
import Sidebar from '../../components/layout/Sidebar';
import { getPayment, getPaymentByOrderId, listMyPayments, listPayments, type Payment } from '../../services/payment.service';
import { getApiErrorMessage } from '../../services/error';
import { formatDate, formatRupiah } from '../../utils/formatter';

type Scope = 'customer' | 'admin';

type PaymentsProps = {
  scope: Scope;
  title: string;
  subtitle: string;
};

function PaymentShell({ scope, children }: { scope: Scope; children: ReactNode }) {
  if (scope === 'customer') return <CustomerShell>{children}</CustomerShell>;
  return <div className="flex min-h-dvh bg-dark"><Sidebar /><main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">{children}</main></div>;
}

export default function Payments({ scope, title, subtitle }: PaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [toast, setToast] = useState({ open: false, tone: 'info' as ToastTone, title: '', message: '' });

  const showToast = (tone: ToastTone, title: string, message: string) => {
    setToast({ open: true, tone, title, message });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2600);
  };

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = scope === 'customer' ? await listMyPayments({ limit: 100 }) : await listPayments({ limit: 100 });
      setPayments(response.items);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal memuat pembayaran.'));
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(
    () => payments.filter((item) => `${item.id} ${item.transactionId ?? ''} ${item.orderId ?? ''} ${item.midtransOrderId ?? ''} ${item.paymentMethod ?? ''} ${item.paymentStatus ?? ''}`.toLowerCase().includes(search.toLowerCase())),
    [payments, search],
  );

  const openPaymentDetail = async (id: string) => {
    if (!id.trim()) return;
    try {
      const detail = await getPayment(id.trim());
      setSelected(detail);
    } catch (err) {
      showToast('error', 'Gagal memuat detail pembayaran', getApiErrorMessage(err));
    }
  };

  const openOrderPayment = async () => {
    if (!orderId.trim()) return;
    try {
      const detail = await getPaymentByOrderId(orderId.trim());
      setSelected(detail);
    } catch (err) {
      showToast('error', 'Gagal memuat pembayaran berdasarkan order', getApiErrorMessage(err));
    }
  };

  return (
    <PaymentShell scope={scope}>
      <Toast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Payments</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/45">{subtitle}</p>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_240px_240px]">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari payment, transaction, order, status..." className="min-h-12 w-full rounded-2xl border border-white/10 bg-dark/60 px-11 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/60" />
        </div>
        <div className="flex gap-2">
          <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order ID" className="min-h-12 w-full rounded-2xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/60" />
          <Button variant="ghost" onClick={() => void openOrderPayment()}><ShoppingBag size={16} /> Cari Order</Button>
        </div>
        <div className="flex gap-2">
          <input value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="Payment ID" className="min-h-12 w-full rounded-2xl border border-white/10 bg-dark/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/60" />
          <Button variant="ghost" onClick={() => void openPaymentDetail(paymentId)}><Eye size={16} /> Detail</Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center text-white/45">Memuat pembayaran dari backend...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center text-red-100">{error}</div>
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface p-8 text-center text-white/45">Belum ada data pembayaran.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-white/50">
                  {['Payment ID', 'Transaction', 'Order', 'Method', 'Status', 'Total', 'Aksi'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((item, index) => (
                  <tr key={item.id} className={`border-t border-white/5 hover:bg-white/5 ${index % 2 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="px-5 py-4 font-mono text-xs text-accent">{item.id}</td>
                    <td className="px-5 py-4 text-white/65">{item.transactionId || item.transaction?.invoiceNumber || '-'}</td>
                    <td className="px-5 py-4 text-white/65">{item.orderId || item.midtransOrderId || '-'}</td>
                    <td className="px-5 py-4 text-white/65">{item.paymentMethod || '-'}</td>
                    <td className="px-5 py-4 text-white/65">{item.paymentStatus || '-'}</td>
                    <td className="px-5 py-4 font-bold text-white">{formatRupiah(Number(item.totalPrice ?? item.amount ?? 0))}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelected(item)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:border-accent hover:text-accent">
                        <Eye size={14} /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Payment" size="lg">
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-white/45">Payment ID</p>
            <p className="font-mono text-accent">{selected.id}</p>
            <p className="text-white/45">Transaction ID</p>
            <p className="text-white">{selected.transactionId || selected.transaction?.invoiceNumber || '-'}</p>
            <p className="text-white/45">Order ID</p>
            <p className="text-white">{selected.orderId || selected.midtransOrderId || '-'}</p>
            <p className="text-white/45">Method</p>
            <p className="text-white">{selected.paymentMethod || '-'}</p>
            <p className="text-white/45">Status</p>
            <p className="text-white">{selected.paymentStatus || '-'}</p>
            <p className="text-white/45">Total</p>
            <p className="text-white">{formatRupiah(Number(selected.totalPrice ?? selected.amount ?? 0))}</p>
            <p className="text-white/45">Updated</p>
            <p className="text-white/70">{selected.updatedAt ? formatDate(selected.updatedAt) : '-'}</p>
          </div>
        )}
      </Modal>
    </PaymentShell>
  );
}
