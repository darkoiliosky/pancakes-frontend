import React, { ReactNode } from "react";
import Navbar from "./components/Navbar";
import MaintenanceBanner from "./components/MaintenanceBanner";
import Footer from "./components/Footer";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import PublicMenu from "./public/pages/Menu";
import PublicCart from "./public/pages/Cart";
import PublicCheckout from "./public/pages/Checkout";
import PublicMyOrders from "./public/pages/MyOrders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import EmailChangeConfirm from "./pages/EmailChangeConfirm";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./admin/layout/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Users from "./admin/pages/Users";
import ShopSettings from "./admin/pages/ShopSettings";
import MenuItems from "./admin/pages/MenuItems";
import Orders from "./admin/pages/Orders";
import Deliveries from "./admin/pages/Deliveries";
import MyDeliveries from "./courier/pages/MyDeliveries";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;
  return <>{children}</>;
}

function CustomerRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if ((user.role || "").toLowerCase() !== "customer") return <Navigate to="/" />;
  return <>{children}</>;
}

function CourierRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if ((user.role || "").toLowerCase() !== "courier") return <Navigate to="/" />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col pt-16 bg-[#fffdf8] text-gray-800">
        <MaintenanceBanner />
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<PublicMenu />} />
            <Route path="/korpa" element={<PublicCart />} />
            <Route
              path="/checkout"
              element={
                <CustomerRoute>
                  <PublicCheckout />
                </CustomerRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <CustomerRoute>
                  <PublicMyOrders />
                </CustomerRoute>
              }
            />
            <Route
              path="/courier"
              element={
                <CourierRoute>
                  <MyDeliveries />
                </CourierRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/email-change" element={<EmailChangeConfirm />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="shop" element={<ShopSettings />} />
              <Route path="menu-items" element={<MenuItems />} />
              <Route path="orders" element={<Orders />} />
              <Route path="deliveries" element={<Deliveries />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
