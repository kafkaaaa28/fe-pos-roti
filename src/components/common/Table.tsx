import React from "react";

interface Column<T> { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode; }

function getCellValue<T extends object>(row: T, key: keyof T | string) {
  if (key in row) return row[key as keyof T];
  return undefined;
}

export default function Table<T extends { id: string }>({ columns, data }: { columns: Column<T>[]; data: T[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-white/60">
            {columns.map(c => (
              <th key={String(c.key)} className="whitespace-nowrap px-4 py-3 text-left font-semibold">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id} className={`border-t border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
              {columns.map(c => (
                <td key={String(c.key)} className="whitespace-nowrap px-4 py-3 text-white/80">
                  {c.render ? c.render(row) : String(getCellValue(row, c.key) ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
