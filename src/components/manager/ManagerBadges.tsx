import type { InventoryStatus, InventoryItemType, ProductStatus, ProductionStatus, StockMovementType, SystemRole, SystemUserStatus } from "../../types/manager";

const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";

export function ProductStatusPill({ status }: { status: ProductStatus }) {
  return <span className={`${base} ${status === "ACTIVE" ? "bg-emerald-900/30 text-emerald-300" : "bg-white/10 text-white/50"}`}>{status}</span>;
}

export function UserStatusPill({ status }: { status: SystemUserStatus }) {
  return <span className={`${base} ${status === "ACTIVE" ? "bg-emerald-900/30 text-emerald-300" : "bg-red-900/30 text-red-300"}`}>{status === "ACTIVE" ? "Aktif" : "Nonaktif"}</span>;
}

export function RolePill({ role }: { role: SystemRole }) {
  const colors: Record<SystemRole, string> = {
    MANAGER: "bg-accent/20 text-accent",
    STAFF: "bg-mint/20 text-mint",
    KASIR: "bg-cream/20 text-cream",
  };
  return <span className={`${base} ${colors[role]}`}>{role}</span>;
}

export function InventoryStatusPill({ status }: { status: InventoryStatus }) {
  const colors: Record<InventoryStatus, string> = {
    AMAN: "bg-emerald-900/30 text-emerald-300",
    MENIPIS: "bg-amber-900/30 text-amber-300",
    HABIS: "bg-red-900/30 text-red-300",
  };
  return <span className={`${base} ${colors[status]}`}>{status}</span>;
}

export function ItemTypePill({ type }: { type: InventoryItemType }) {
  return <span className={`${base} ${type === "PRODUCT" ? "bg-accent/20 text-accent" : "bg-mint/20 text-mint"}`}>{type === "PRODUCT" ? "Produk Jadi" : "Bahan Baku"}</span>;
}

export function StockMovementPill({ type }: { type: StockMovementType }) {
  const colors: Record<StockMovementType, string> = {
    IN: "bg-emerald-900/30 text-emerald-300",
    OUT: "bg-red-900/30 text-red-300",
    ADJUSTMENT: "bg-sky-900/30 text-sky-300",
  };
  return <span className={`${base} ${colors[type]}`}>{type}</span>;
}

export function ProductionStatusPill({ status }: { status: ProductionStatus }) {
  const colors: Record<ProductionStatus, string> = {
    SELESAI: "bg-emerald-900/30 text-emerald-300",
    DIPROSES: "bg-sky-900/30 text-sky-300",
    DIBATALKAN: "bg-red-900/30 text-red-300",
  };
  const labels: Record<ProductionStatus, string> = {
    SELESAI: "Selesai",
    DIPROSES: "Diproses",
    DIBATALKAN: "Dibatalkan",
  };
  return <span className={`${base} ${colors[status]}`}>{labels[status]}</span>;
}
