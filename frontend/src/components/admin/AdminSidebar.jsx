import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ClipboardList, Tag, Users, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminSidebar = ({ adminPath }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: adminPath, end: true, icon: LayoutDashboard, label: "Dashboard" },
    { to: `${adminPath}/products`, icon: Package, label: "Products" },
    { to: `${adminPath}/orders`, icon: ClipboardList, label: "Orders" },
    { to: `${adminPath}/coupons`, icon: Tag, label: "Coupons" },
    { to: `${adminPath}/customers`, icon: Users, label: "Customers" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate(`${adminPath}/login`);
  };

  return (
    <aside className="w-64 bg-ink text-white flex flex-col shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-topo-dark pointer-events-none" />
      <div className="relative flex items-center gap-2 px-6 h-16 border-b border-white/10 shrink-0">
        <img src="/logo.png" alt="TeenRaah" className="h-8 w-8 rounded-md" />
        <span className="font-display text-lg tracking-wide">CONTROL PANEL</span>
      </div>

      <nav className="relative flex-1 py-6 px-3 space-y-1">
        {links.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-trail-500 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="relative flex items-center gap-3 px-4 py-3 mx-3 mb-6 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        <LogOut className="w-4 h-4" /> Log Out
      </button>
    </aside>
  );
};

export default AdminSidebar;
