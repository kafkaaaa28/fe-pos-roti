import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import CustomerShell from "../../components/customer/CustomerShell";
import { useCart } from "../../contexts/CartContext";
import { formatRupiah } from "../../utils/formatter";

export default function Cart() {
  const { items, removeItem, updateQty, total } = useCart();
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CustomerShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Customer Cart</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">Keranjang</h1>
          <p className="mt-2 text-sm text-white/45">Cek ulang pesanan sebelum checkout. Kamu masih bisa tambah menu lagi.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-surface p-8 text-center">
            <ShoppingBag className="mx-auto text-accent" size={36} />
            <p className="mt-4 font-bold text-white">Keranjang masih kosong</p>
            <p className="mt-1 text-sm text-white/45">Pilih menu Beard Papa's dulu untuk mulai checkout.</p>
            <Link to="/customer/dashboard" className="mt-5 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-bold text-dark hover:bg-cream">Pilih Menu</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              {items.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-2xl border border-white/10 bg-surface p-3 shadow-xl shadow-black/10 sm:p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream"><img src={item.image} alt={item.name} className="h-full w-full object-contain p-2" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-bold text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-white/45">{formatRupiah(item.price)}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-xl border border-white/10 bg-dark/50">
                        <button className="flex h-10 w-10 items-center justify-center text-white/60 hover:text-accent" onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}><Minus size={15} /></button>
                        <span className="min-w-8 text-center text-sm font-bold text-white">{item.qty}</span>
                        <button className="flex h-10 w-10 items-center justify-center text-white/60 hover:text-accent" onClick={() => updateQty(item.id, item.qty + 1)}><Plus size={15} /></button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden font-bold text-accent sm:inline">{formatRupiah(item.price * item.qty)}</span>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <aside className="h-fit rounded-3xl border border-accent/20 bg-accent/10 p-5 lg:sticky lg:top-8">
              <p className="font-display text-xl font-bold text-white">Ringkasan</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-white/60"><span>Total Item</span><span>{totalQty} pcs</span></div>
                <div className="flex items-end justify-between gap-4"><span className="font-semibold text-white/70">Total</span><span className="font-display text-2xl font-bold text-accent">{formatRupiah(total)}</span></div>
              </div>
              <div className="mt-6 grid gap-3">
                <Link to="/customer/checkout" className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-dark shadow-lg shadow-accent/20 hover:bg-cream">Lanjutkan Checkout</Link>
                <Link to="/customer/dashboard" className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/75 hover:border-accent hover:text-accent">Pilih Menu Lagi</Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
