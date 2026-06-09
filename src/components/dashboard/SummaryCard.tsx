import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
  color?: "primary" | "accent" | "mint" | "cream";
  trend?: number;
  trendLabel?: string;
  delay?: number;
  onClick?: () => void;
}

const colors = {
  primary: { bg: "bg-accent/15", text: "text-accent", border: "border-accent/35", glow: "shadow-accent/10" },
  accent:  { bg: "bg-accent/20",  text: "text-accent",  border: "border-accent/35", glow: "shadow-accent/10" },
  mint:    { bg: "bg-mint/15",    text: "text-mint",    border: "border-mint/35", glow: "shadow-mint/10" },
  cream:   { bg: "bg-cream/15",   text: "text-cream",   border: "border-cream/35", glow: "shadow-cream/10" },
};

export default function SummaryCard({ title, value, icon: Icon, color = "primary", trend, trendLabel, delay = 0, onClick }: Props) {
  const c = colors[color];
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`min-w-0 w-full overflow-hidden text-left bg-surface border ${c.border} rounded-2xl p-4 sm:p-5 hover:shadow-xl ${c.glow} transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 hover:border-accent/70`}
    >
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`${c.text} drop-shadow-[0_0_10px_rgba(255,210,26,0.25)]`} size={19} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="mb-1 truncate text-xs text-white/50">{title}</p>
      <p className="break-words font-display text-xl font-bold text-white sm:text-2xl">{value}</p>
      {trendLabel && <p className="mt-2 line-clamp-2 text-xs text-white/35">{trendLabel}</p>}
    </motion.button>
  );
}
