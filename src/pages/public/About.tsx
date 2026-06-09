import { motion } from "framer-motion";
import { ChefHat, Factory, ShoppingBag } from "lucide-react";

const FEATURES = [
  {
    title: "Produksi Harian",
    desc: "Roti dibuat segar dengan pencatatan produksi yang rapi.",
    icon: Factory,
  },
  {
    title: "Produk Terpantau",
    desc: "Stok produk dan bahan baku dipantau agar operasional lebih aman.",
    icon: ShoppingBag,
  },
  {
    title: "Pesanan Online",
    desc: "Customer dapat melihat produk dan melakukan pemesanan secara online.",
    icon: ChefHat,
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-dark pt-24 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-accent text-sm font-semibold mb-2">Tentang Kami</p>
          <h1 className="font-display text-5xl text-white mb-4">
            Beard Papa's dengan Sistem Operasional Terintegrasi
          </h1>
          <p className="text-white/50 max-w-2xl leading-relaxed">
            Sistem ini membantu Beard Papa's mengelola produk, bahan baku, produksi,
            transaksi POS, dan pemesanan online dalam satu platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {FEATURES.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="bg-surface border border-white/10 rounded-2xl p-6 hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="text-primary" size={18} />
              </div>
              <h2 className="text-white font-semibold mb-2">{title}</h2>
              <p className="text-white/40 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
