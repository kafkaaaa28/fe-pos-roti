import { motion } from "framer-motion";
import type { DashboardChartPoint } from "../../types/dashboard";
import { formatRupiahShort } from "../../utils/formatter";

interface SalesChartProps {
  data: DashboardChartPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const maxSales = Math.max(...data.map((item) => item.sales), 1);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 sm:p-6">
      <div className="mb-5 flex min-w-0 flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-white">Grafik Penjualan</h3>
          <p className="mt-1 text-xs text-white/40">Ringkasan omzet dan transaksi per periode</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">Live-ready</span>
      </div>

      <div className="flex h-44 min-w-0 items-end gap-1.5 sm:gap-3">
        {data.map((item, index) => {
          const height = Math.max(12, Math.round((item.sales / maxSales) * 100));
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="group relative flex h-36 w-full min-w-0 items-end">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${height}%`, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full min-w-[18px] rounded-t-xl bg-gradient-to-t from-mint via-accent to-cream shadow-lg shadow-accent/20 transition-all group-hover:brightness-110 sm:min-w-[28px]"
                />
                <div className="pointer-events-none absolute -top-12 left-1/2 hidden w-max -translate-x-1/2 rounded-xl border border-white/10 bg-dark px-3 py-2 text-xs text-white shadow-xl group-hover:block">
                  <p className="font-semibold">{formatRupiahShort(item.sales)}</p>
                  <p className="text-white/50">{item.transactions} transaksi</p>
                </div>
              </div>
              <span className="max-w-full truncate text-[10px] text-white/45 sm:text-xs">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
