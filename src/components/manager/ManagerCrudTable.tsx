import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface ManagerCrudTableProps {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
  emptyText?: string;
}

export default function ManagerCrudTable({ headers, children, empty, emptyText = "Data belum tersedia." }: ManagerCrudTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-surface"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-white/50">
              {headers.map((heading) => (
                <th key={heading} className="whitespace-nowrap px-5 py-3 text-left font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empty ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-10 text-center text-white/45">
                  {emptyText}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
