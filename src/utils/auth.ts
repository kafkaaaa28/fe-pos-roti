import type { Role } from "../types/auth";

const ROLE_DASHBOARD: Record<Role, string> = {
  MANAGER: "/manager/dashboard",
  STAFF: "/staff/dashboard",
  KASIR: "/cashier/dashboard",
  CUSTOMER: "/customer/dashboard",
};

export function normalizeRole(role?: string | null): Role {
  const normalizedRole = role?.toUpperCase();

  if (normalizedRole === "MANAGER") return "MANAGER";
  if (normalizedRole === "STAFF") return "STAFF";
  if (normalizedRole === "KASIR" || normalizedRole === "CASHIER") return "KASIR";
  if (normalizedRole === "CUSTOMER") return "CUSTOMER";

  return "CUSTOMER";
}

export function getDashboardPath(role?: string | null) {
  if (!role) return "/login";

  return ROLE_DASHBOARD[normalizeRole(role)] ?? "/login";
}
