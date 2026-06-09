import { type ReactNode } from "react";
import { motion } from "framer-motion";
import Sidebar from "../layout/Sidebar";

interface ManagerPageShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function ManagerPageShell({ title, subtitle, badge, action, children }: ManagerPageShellProps) {
  return (
    <div className="flex min-h-dvh bg-dark">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-6 pt-20 sm:px-5 lg:px-8 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 flex flex-col gap-4 lg:mb-8 xl:flex-row xl:items-end xl:justify-between"
        >
          <div>
            {badge && (
              <div className="mb-3 inline-flex rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {badge}
              </div>
            )}
            <h1 className="font-display text-2xl text-white sm:text-3xl md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">{subtitle}</p>
          </div>
          {action}
        </motion.div>
        {children}
      </main>
    </div>
  );
}
