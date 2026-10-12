import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Bell, LogOut, Activity } from "lucide-react";

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/", { replace: true });
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Billing", path: "/billing", icon: <ShoppingCart size={20} /> },
    { name: "Inventory", path: "/inventory", icon: <Package size={20} /> },
    { name: "Alerts", path: "/alerts", icon: <Bell size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 font-sans text-zinc-200">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900/90 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col shadow-[4px_0_24px_-10px_rgba(0,0,0,0.8)] z-20">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-500" size={24} />
            <h1 className="text-xl font-bold text-emerald-400 tracking-tight">Pharmly</h1>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold shadow-inner shadow-emerald-500/5 border border-emerald-500/20"
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200 border border-transparent"
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800/80 space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
            <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-900/20 border border-emerald-700/50">
              A
            </div>
            <span className="font-medium text-zinc-300">Admin User</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/10 hover:border-red-500/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Navbar */}
        <header className="h-16 bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between px-8 shadow-sm shrink-0">
          <h2 className="text-xl font-semibold text-zinc-100">
            Overview
          </h2>
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="text-sm font-medium bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/50">Admin Session</span>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
