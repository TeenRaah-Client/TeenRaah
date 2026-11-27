import { useEffect, useState, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/layout/CartDrawer";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import SearchOverlay from "./components/layout/SearchOverlay";
import ChatWidget from "./components/chat/ChatWidget";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { ProtectedRoute, AdminRoute } from "./components/ui/ProtectedRoute";
import PageTransition from "./components/ui/PageTransition";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Compare from "./pages/Compare";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import MyOrders from "./pages/MyOrders";
import OrderTracking from "./pages/OrderTracking";
import Addresses from "./pages/Addresses";
import Referral from "./pages/Referral";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ShippingReturns from "./pages/ShippingReturns";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminInventoryForecast from "./pages/admin/AdminInventoryForecast";
import AdminCustomerIntelligence from "./pages/admin/AdminCustomerIntelligence";
import AdminMarketingCampaigns from "./pages/admin/AdminMarketingCampaigns";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLayout from "./components/admin/AdminLayout";

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || "/tr-control-9273";

const StorefrontLayout = ({ children, onOpenSearch }) => (
  <div className="min-h-screen flex flex-col bg-paper pb-16 md:pb-0">
    <Navbar onOpenSearch={onOpenSearch} />
    <CartDrawer />
    <main className="flex-1">{children}</main>
    <Footer />
    <MobileBottomNav onOpenSearch={onOpenSearch} />
    <ChatWidget />
  </div>
);

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith(ADMIN_PATH);
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Desktop power-user shortcut: press "/" outside form fields to open search
  useEffect(() => {
    if (isAdminRoute) return;
    const onKeyDown = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || document.activeElement?.isContentEditable) {
        return;
      }
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAdminRoute]);

  const wrapStorefront = (element) => (
    <StorefrontLayout onOpenSearch={openSearch}>
      <PageTransition>{element}</PageTransition>
    </StorefrontLayout>
  );

  return (
    <ErrorBoundary>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0B0B0C",
            color: "#fff",
            fontSize: "14px",
            borderRadius: "999px",
            padding: "10px 18px",
          },
          success: { iconTheme: { primary: "#E3A857", secondary: "#0B0B0C" } },
        }}
      />

      {!isAdminRoute && <SearchOverlay open={searchOpen} onClose={closeSearch} />}

      <AnimatePresence mode="wait">
        {isAdminRoute ? (
          <Routes location={location} key="admin">
            <Route path={`${ADMIN_PATH}/login`} element={<AdminLogin adminPath={ADMIN_PATH} />} />
            <Route
              path={ADMIN_PATH}
              element={
                <AdminRoute>
                  <AdminLayout adminPath={ADMIN_PATH} />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="inventory-forecast" element={<AdminInventoryForecast />} />
              <Route path="customer-intelligence" element={<AdminCustomerIntelligence />} />
              <Route path="marketing" element={<AdminMarketingCampaigns />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        ) : (
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={wrapStorefront(<Home />)} />
            <Route path="/shop" element={wrapStorefront(<Shop />)} />
            <Route path="/compare" element={wrapStorefront(<Compare />)} />
            <Route path="/product/:slug" element={wrapStorefront(<ProductDetail />)} />
            <Route path="/cart" element={wrapStorefront(<Cart />)} />
            <Route path="/login" element={wrapStorefront(<Login />)} />
            <Route path="/register" element={wrapStorefront(<Register />)} />
            <Route path="/verify-otp" element={wrapStorefront(<VerifyOtp />)} />
            <Route path="/privacy" element={wrapStorefront(<Privacy />)} />
            <Route path="/terms" element={wrapStorefront(<Terms />)} />
            <Route path="/shipping-returns" element={wrapStorefront(<ShippingReturns />)} />

            <Route path="/checkout" element={wrapStorefront(<ProtectedRoute><Checkout /></ProtectedRoute>)} />
            <Route path="/orders" element={wrapStorefront(<ProtectedRoute><MyOrders /></ProtectedRoute>)} />
            <Route path="/orders/:id" element={wrapStorefront(<ProtectedRoute><OrderTracking /></ProtectedRoute>)} />
            <Route path="/addresses" element={wrapStorefront(<ProtectedRoute><Addresses /></ProtectedRoute>)} />
            <Route path="/referral" element={wrapStorefront(<ProtectedRoute><Referral /></ProtectedRoute>)} />
            <Route path="/wishlist" element={wrapStorefront(<ProtectedRoute><Wishlist /></ProtectedRoute>)} />
            <Route path="/profile" element={wrapStorefront(<ProtectedRoute><Profile /></ProtectedRoute>)} />

            <Route path="*" element={wrapStorefront(<NotFound />)} />
          </Routes>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;
