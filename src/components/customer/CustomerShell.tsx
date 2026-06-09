import type { ReactNode } from "react";
import Sidebar from "../layout/Sidebar";

export default function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-dark text-white">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 sm:px-6 md:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
