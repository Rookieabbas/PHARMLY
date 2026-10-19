import React, { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Bell,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "../utils/themeContext";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/", { replace: true });
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, emoji: "📊" },
    { name: "Point of Sale", path: "/billing", icon: ShoppingCart, emoji: "🧾" },
    { name: "Inventory", path: "/inventory", icon: Package, emoji: "📦" },
    { name: "Alerts", path: "/alerts", icon: Bell, emoji: "🔔" },
  ];

  // Derive current page title for breadcrumb
  const currentNav = navItems.find((item) => item.path === location.pathname) || {
    name: "Dashboard",
    emoji: "📊",
  };

  return (
    <div className="flex h-screen w-full bg-[var(--notion-bg)] text-[var(--notion-text)] overflow-hidden font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col w-60 bg-[var(--notion-sidebar)] border-r border-[var(--notion-border)] transition-transform duration-150 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-translate-x-60 lg:w-0 lg:border-r-0"
        } ${mobileMenuOpen ? "translate-x-0" : ""}`}
      >
        {/* Workspace Switcher / Brand Header */}
        <div className="h-12 flex items-center justify-between px-3.5 border-b border-[var(--notion-border)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 flex items-center justify-center rounded bg-[var(--notion-border)] text-xs font-bold select-none">
              🏥
            </span>
            <span className="font-semibold text-sm tracking-tight truncate text-[var(--notion-text)]">
              Pharmly
            </span>
            <span className="text-[10px] font-medium text-[var(--notion-text-muted)] bg-[var(--notion-border)] px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setMobileMenuOpen(false);
            }}
            className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--notion-text-muted)] uppercase tracking-wider select-none">
              Workspace
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm transition-colors duration-100 select-none ${
                        isActive
                          ? "bg-[var(--notion-active)] font-medium text-[var(--notion-text)]"
                          : "text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
                      }`
                    }
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--notion-text-muted)] uppercase tracking-wider select-none">
              Quick Resources
            </div>
            <div className="space-y-0.5">
              <a
                href="https://github.com/Rookieabbas/PHARMLY"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-sm text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors select-none"
              >
                <span className="truncate">GitHub Repo</span>
                <ExternalLink size={13} className="shrink-0 opacity-60" />
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[var(--notion-border)] shrink-0 space-y-2">
          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors select-none"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </span>
            <span className="text-[10px] font-mono opacity-60">
              {isDark ? "Ctrl+L" : "Ctrl+D"}
            </span>
          </button>

          {/* User info & Logout */}
          <div className="flex items-center justify-between pt-1 border-t border-[var(--notion-border-subtle)]">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <div className="w-6 h-6 rounded bg-[var(--notion-border)] flex items-center justify-center text-xs font-semibold select-none shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--notion-text)] truncate">
                  Admin User
                </p>
                <p className="text-[11px] text-[var(--notion-text-muted)] truncate">
                  admin@gmail.com
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded text-[var(--notion-text-muted)] hover:text-[#EB5757] hover:bg-[var(--tag-red-bg)] transition-colors shrink-0"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Slim Top Bar */}
        <header className="h-11 border-b border-[var(--notion-border)] flex items-center justify-between px-4 sm:px-6 bg-[var(--notion-bg)] shrink-0 select-none">
          <div className="flex items-center gap-2 text-xs text-[var(--notion-text-muted)]">
            {/* Desktop un-collapse button */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex p-1 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text)] mr-1"
                title="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text)] mr-1"
            >
              <Menu size={16} />
            </button>

            <span className="hover:text-[var(--notion-text)] cursor-pointer">
              Pharmly
            </span>
            <span>/</span>
            <span className="font-medium text-[var(--notion-text)] flex items-center gap-1.5">
              <span>{currentNav.emoji}</span>
              <span>{currentNav.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto py-8 px-6 sm:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
