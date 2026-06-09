import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BookOpen,
  Factory,
  Boxes,
  ArrowLeftRight,
  FileText,
  LogOut,
  Activity as ActivityIcon,
  Menu,
  X,
  ClipboardList,
  UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import papaLogoRound from "../../assets/brand/logo-round.png";

const MANAGER_LINKS = [
  { to: "/manager/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/manager/products", icon: Package, label: "Produk" },
  { to: "/manager/materials", icon: Boxes, label: "Bahan Baku" },
  { to: "/manager/recipes", icon: BookOpen, label: "Resep" },
  { to: "/manager/productions", icon: Factory, label: "Produksi" },
  { to: "/manager/inventory", icon: ArrowLeftRight, label: "Inventory" },
  { to: "/manager/stock-movements", icon: ActivityIcon, label: "Stock Movement" },
  { to: "/manager/reports", icon: FileText, label: "Laporan" },
  { to: "/manager/activity-logs", icon: ActivityIcon, label: "Activity Logs" },
  { to: "/manager/users", icon: Users, label: "Pengguna" },
];

const STAFF_LINKS = [
  { to: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/staff/materials", icon: Boxes, label: "Bahan Baku" },
  { to: "/staff/recipes", icon: BookOpen, label: "Resep" },
  { to: "/staff/productions", icon: Factory, label: "Produksi" },
  { to: "/staff/inventory", icon: ArrowLeftRight, label: "Inventory" },
  { to: "/staff/stock-movements", icon: ActivityIcon, label: "Stock Movement" },
];

const KASIR_LINKS = [
  { to: "/cashier/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/cashier/pos", icon: ShoppingCart, label: "POS" },
  { to: "/cashier/orders", icon: Package, label: "Pesanan Online" },
];

const CUSTOMER_LINKS = [
  { to: "/customer/dashboard", icon: LayoutDashboard, label: "Pesan Menu" },
  { to: "/customer/cart", icon: ShoppingCart, label: "Keranjang" },
  { to: "/customer/checkout", icon: ClipboardList, label: "Checkout" },
  { to: "/customer/orders", icon: Package, label: "Tracking" },
  { to: "/customer/profile", icon: UserCircle, label: "Profil" },
];

function getRoleLabel(role?: string) {
  if (role === "MANAGER") return "Manager";
  if (role === "STAFF") return "Staff";
  if (role === "KASIR") return "Kasir";
  if (role === "CUSTOMER") return "Customer";
  return "User";
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links =
    user?.role === "MANAGER"
      ? MANAGER_LINKS
      : user?.role === "STAFF"
        ? STAFF_LINKS
        : user?.role === "CUSTOMER"
          ? CUSTOMER_LINKS
          : KASIR_LINKS;

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream shadow-lg shadow-accent/20 ring-1 ring-accent/30">
            <img src={papaLogoRound} alt="Beard Papa's" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold leading-none text-white">Beard Papa's</p>
            <p className="mt-1 truncate text-xs text-accent/80">{getRoleLabel(user?.role)} Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 md:p-4">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 md:py-2.5 ${
                isActive
                  ? "bg-accent text-dark shadow-lg shadow-accent/20"
                  : "text-white/65 hover:bg-accent/10 hover:text-accent"
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 md:p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/55 transition-all hover:bg-red-900/20 hover:text-red-300 md:py-2.5"
        >
          <LogOut size={17} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.aside
        className="fixed left-0 top-0 z-30 hidden h-dvh w-64 flex-col overflow-hidden border-r border-white/10 bg-surface md:flex"
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <SidebarContent />
      </motion.aside>
      <div aria-hidden="true" className="hidden w-64 shrink-0 md:block" />

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-[75] inline-flex items-center gap-2 rounded-2xl border border-accent/25 bg-surface/95 px-4 py-3 text-sm font-bold text-accent shadow-2xl shadow-black/30 backdrop-blur-xl transition-all hover:border-accent hover:bg-accent hover:text-dark md:hidden"
      >
        <Menu size={18} /> Menu
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Tutup menu"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="relative flex h-full w-[86vw] max-w-xs flex-col overflow-hidden border-r border-white/10 bg-surface shadow-2xl shadow-black/40"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-xl bg-white/5 p-2 text-white/55 transition-all hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
