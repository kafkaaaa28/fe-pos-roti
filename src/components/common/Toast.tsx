import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastProps {
  open: boolean;
  tone?: ToastTone;
  title: string;
  message: string;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const tones = {
  success: "border-emerald-400/30 bg-emerald-950/90 text-emerald-200",
  error: "border-red-400/30 bg-red-950/90 text-red-200",
  info: "border-sky-400/30 bg-sky-950/90 text-sky-200",
};

export default function Toast({ open, tone = "success", title, message }: ToastProps) {
  const Icon = icons[tone];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          className={`fixed right-6 top-6 z-[60] w-[340px] rounded-2xl border p-4 shadow-2xl backdrop-blur ${tones[tone]}`}
        >
          <div className="flex gap-3">
            <Icon size={22} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-white">{title}</p>
              <p className="mt-1 text-sm text-white/70">{message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
