import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/layout/Navbar";
import AppRoutes from "./routes/AppRoutes";

const PUBLIC_SCROLL_TOP_PATHS = new Set(["/", "/products", "/about", "/contact", "/login", "/register"]);

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const showTopNavbar = !user;

  useEffect(() => {
    if (PUBLIC_SCROLL_TOP_PATHS.has(location.pathname)) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-[#4a0e0e] text-white">
      {showTopNavbar && <Navbar />}

      <main className={showTopNavbar ? "relative z-0 pt-16" : "relative z-0"}>
        <AppRoutes />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
