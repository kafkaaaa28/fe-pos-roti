import clsx from "clsx";

interface StatusBadgeProps {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "muted";
}

const tones = {
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  danger: "border-red-400/30 bg-red-400/10 text-red-300",
  info: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  muted: "border-white/10 bg-white/5 text-white/60",
};

export default function StatusBadge({ label, tone = "muted" }: StatusBadgeProps) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {label}
    </span>
  );
}
