import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageLoader } from "./Loader";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

export const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const adminPath = import.meta.env.VITE_ADMIN_PATH || "/tr-control-9273";

  if (loading) return <PageLoader />;
  // Deliberately redirect to the site root (not an obvious "/admin/login")
  // if someone lands here without admin session — the hidden route stays hidden.
  if (!isAdmin) return <Navigate to={`${adminPath}/login`} replace />;
  return children;
};
