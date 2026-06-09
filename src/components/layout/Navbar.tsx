import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardPath } from "../../utils/auth";
import papaLogoText from "../../assets/brand/logo-text.png";

const PUBLIC_LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/products", label: "Produk" },
  { to: "/about", label: "Tentang" },
  { to: "/contact", label: "Kontak" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { items } = useCart();

  const count = items.reduce((sum, item) => sum + (item.qty || 0), 0);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-[70] border-b border-primary/10 bg-white shadow-md shadow-primary/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
          <img
            src={papaLogoText}
            alt="Beard Papa's"
            className="h-9 w-auto max-w-[155px] object-contain"
          />
        </Link>

        {!user && (
          <nav className="hidden items-center gap-8 md:flex">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-bold text-primary/75 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {user?.role === "CUSTOMER" && (
            <Link
              to="/customer/cart"
              onClick={closeMenu}
              className="relative rounded-xl p-2 text-primary transition-colors hover:bg-primary/5"
            >
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-dark">
                  {count}
                </span>
              )}
            </Link>
          )}

          {!user ? (
            <Link
              to="/login"
              onClick={closeMenu}
              className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/15 transition-colors hover:bg-dark md:inline-flex"
            >
              Masuk
            </Link>
          ) : (
            <>
              <Link
                to={getDashboardPath(user.role)}
                onClick={closeMenu}
                className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/15 transition-colors hover:bg-dark sm:flex"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="hidden items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:flex"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}

          {!user && (
            <button
              type="button"
              aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
              aria-expanded={open}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary transition-colors hover:bg-primary/10 md:hidden"
              onClick={() => setOpen((current) => !current)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && !user && (
          <motion.div
            className="border-t border-primary/10 bg-white px-4 py-4 shadow-xl shadow-primary/10 md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="grid gap-2">
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-primary/75 transition-colors hover:bg-primary/5 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                to="/login"
                onClick={closeMenu}
                className="mt-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white"
              >
                Masuk / Daftar
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}