import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/layout/CartDrawer";
import { ProtectedRoute, AdminRoute } from "./components/ui/ProtectedRoute";
import PageTransition from "./components/ui/PageTransition";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
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
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminLayout from "./components/admin/AdminLayout";

// The client hasn't settled on a final domain/name yet, so the admin panel's
// entire path is one env var — nothing in the router below is hardcoded.
const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || "/tr-control-9273";

const StorefrontLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-paper">
    <Navbar />
    <CartDrawer />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith(ADMIN_PATH);

  return (
    <>
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
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="customers" element={<AdminCustomers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        ) : (
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<StorefrontLayout><PageTransition><Home /></PageTransition></StorefrontLayout>} />
            <Route path="/shop" element={<StorefrontLayout><PageTransition><Shop /></PageTransition></StorefrontLayout>} />
            <Route path="/product/:slug" element={<StorefrontLayout><PageTransition><ProductDetail /></PageTransition></StorefrontLayout>} />
            <Route path="/cart" element={<StorefrontLayout><PageTransition><Cart /></PageTransition></StorefrontLayout>} />
            <Route path="/login" element={<StorefrontLayout><PageTransition><Login /></PageTransition></StorefrontLayout>} />
            <Route path="/register" element={<StorefrontLayout><PageTransition><Register /></PageTransition></StorefrontLayout>} />
            <Route path="/verify-otp" element={<StorefrontLayout><PageTransition><VerifyOtp /></PageTransition></StorefrontLayout>} />

            <Route
              path="/checkout"
              element={
                <StorefrontLayout>
                  <PageTransition>
                    <ProtectedRoute><Checkout /></ProtectedRoute>
                  </PageTransition>
                </StorefrontLayout>
              }
            />
            <Route
              path="/orders"
              element={
                <StorefrontLayout>
                  <PageTransition>
                    <ProtectedRoute><MyOrders /></ProtectedRoute>
                  </PageTransition>
                </StorefrontLayout>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <StorefrontLayout>
                  <PageTransition>
                    <ProtectedRoute><OrderTracking /></ProtectedRoute>
                  </PageTransition>
                </StorefrontLayout>
              }
            />
            <Route
              path="/addresses"
              element={
                <StorefrontLayout>
                  <PageTransition>
                    <ProtectedRoute><Addresses /></ProtectedRoute>
                  </PageTransition>
                </StorefrontLayout>
              }
            />
            <Route
              path="/referral"
              element={
                <StorefrontLayout>
                  <PageTransition>
                    <ProtectedRoute><Referral /></ProtectedRoute>
                  </PageTransition>
                </StorefrontLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <StorefrontLayout>
                  <PageTransition>
                    <ProtectedRoute><Profile /></ProtectedRoute>
                  </PageTransition>
                </StorefrontLayout>
              }
            />

            <Route path="*" element={<StorefrontLayout><PageTransition><NotFound /></PageTransition></StorefrontLayout>} />
          </Routes>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
