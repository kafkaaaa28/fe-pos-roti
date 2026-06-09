import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import PublicOnlyRoute from "../components/layout/PublicOnlyRoute";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardPath } from "../utils/auth";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import CashierDashboard from "../pages/cashier/Dashboard";
import CashierOrders from "../pages/cashier/Orders";
import POS from "../pages/cashier/POS";

import Cart from "../pages/customer/Cart";
import Checkout from "../pages/customer/Checkout";
import CustomerDashboard from "../pages/customer/Dashboard";
import CustomerOrders from "../pages/customer/Orders";
import Profile from "../pages/customer/Profile";

import ManagerDashboard from "../pages/manager/Dashboard";
import Inventory from "../pages/manager/Inventory";
import ManagerMaterials from "../pages/manager/Materials";
import ManagerProducts from "../pages/manager/Products";
import ManagerProductions from "../pages/manager/Productions";
import Recipes from "../pages/manager/Recipes";
import Reports from "../pages/manager/Reports";
import Users from "../pages/manager/Users";
import ManagerStockMovements from "../pages/manager/StockMovements";
import ActivityLogs from "../pages/manager/ActivityLogs";

import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Home from "../pages/public/Home";
import Products from "../pages/public/Products";

import StaffDashboard from "../pages/staff/Dashboard";
import StaffInventory from "../pages/staff/Inventory";
import StaffMaterials from "../pages/staff/Materials";
import StaffProductions from "../pages/staff/Productions";
import StaffRecipes from "../pages/staff/Recipes";
import StockMovements from "../pages/staff/StockMovements";


function GuestPublicPage({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestPublicPage><Home /></GuestPublicPage>} />
      <Route path="/products" element={<GuestPublicPage><Products /></GuestPublicPage>} />
      <Route path="/about" element={<GuestPublicPage><About /></GuestPublicPage>} />
      <Route path="/contact" element={<GuestPublicPage><Contact /></GuestPublicPage>} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route path="/home" element={<RootRedirect />} />

      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/products"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <ManagerProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/materials"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <ManagerMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/recipes"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <Recipes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/productions"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <ManagerProductions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventory"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/stock-movements"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <ManagerStockMovements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/activity-logs"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <ActivityLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/users"
        element={
          <ProtectedRoute roles={["MANAGER"]}>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute roles={["STAFF"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/materials"
        element={
          <ProtectedRoute roles={["STAFF"]}>
            <StaffMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/recipes"
        element={
          <ProtectedRoute roles={["STAFF"]}>
            <StaffRecipes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/productions"
        element={
          <ProtectedRoute roles={["STAFF"]}>
            <StaffProductions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/inventory"
        element={
          <ProtectedRoute roles={["STAFF"]}>
            <StaffInventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/stock-movements"
        element={
          <ProtectedRoute roles={["STAFF"]}>
            <StockMovements />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier/dashboard"
        element={
          <ProtectedRoute roles={["KASIR"]}>
            <CashierDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cashier/pos"
        element={
          <ProtectedRoute roles={["KASIR"]}>
            <POS />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cashier/orders"
        element={
          <ProtectedRoute roles={["KASIR"]}>
            <CashierOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute roles={["CUSTOMER"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute roles={["CUSTOMER"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/cart"
        element={
          <ProtectedRoute roles={["CUSTOMER"]}>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route path="/cart" element={<Navigate to="/customer/cart" replace />} />
      <Route
        path="/customer/checkout"
        element={
          <ProtectedRoute roles={["CUSTOMER"]}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route path="/checkout" element={<Navigate to="/customer/checkout" replace />} />
      <Route
        path="/customer/orders"
        element={
          <ProtectedRoute roles={["CUSTOMER"]}>
            <CustomerOrders />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
