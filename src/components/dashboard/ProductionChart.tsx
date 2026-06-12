import { motion } from "framer-motion";
import type { ProductionChartPoint } from "../../types/dashboard";

interface ProductionChartProps {
  data: ProductionChartPoint[];
}

export default function ProductionChart({ data }: ProductionChartProps) {
  if (data.length === 0) {
    return (
      <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 sm:p-6">
        <div className="mb-5 sm:mb-6">
          <h3 className="font-semibold text-white">Produksi per Produk</h3>
          <p className="mt-1 text-xs text-white/40">Belum ada data produksi untuk periode ini</p>
        </div>
        <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center">
          <div>
            <p className="text-sm font-semibold text-white/70">Data chart kosong</p>
            <p className="mt-1 text-xs text-white/40">Backend belum mengirim riwayat produksi atau masih belum ada transaksi produksi.</p>
          </div>
        </div>
      </div>
    );
  }

  const maxQuantity = Math.max(...data.map((item) => item.quantity), 1);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 sm:p-6">
      <div className="mb-5 sm:mb-6">
        <h3 className="font-semibold text-white">Produksi per Produk</h3>
        <p className="mt-1 text-xs text-white/40">Jumlah produksi terbaru berdasarkan produk</p>
      </div>

      <div className="min-w-0 space-y-4">
        {data.map((item, index) => {
          const width = Math.max(10, Math.round((item.quantity / maxQuantity) * 100));
          return (
            <div key={item.label} className="min-w-0">
              <div className="mb-2 flex min-w-0 items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-white/70">{item.label}</span>
                <span className="shrink-0 font-semibold text-accent">{item.quantity} pcs</span>
              </div>
              <div className="h-3 min-w-0 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-mint via-accent to-cream shadow-sm shadow-accent/20"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
