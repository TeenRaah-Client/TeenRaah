import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = ({ adminPath }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-paper">
      <AdminSidebar adminPath={adminPath} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-ink/10 flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-stone">TeenRaah Admin</span>
          <span className="text-sm font-semibold">{user?.name}</span>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
