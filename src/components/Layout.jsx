import React, { useState, useEffect } from "react";
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
  const { toggleTheme, isDark } = useTheme();

  // Desktop sidebar: starts open (can be collapsed by user)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Mobile drawer: ALWAYS starts closed on mobile (< 768px)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

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

  // Derive current page title for top bar breadcrumb
  const currentNav = navItems.find((item) => item.path === location.pathname) || {
    name: "Dashboard",
    emoji: "📊",
  };

  return (
    <div className="flex h-screen w-full bg-[var(--notion-bg)] text-[var(--notion-text)] overflow-hidden font-sans relative">
      {/* =========================================================================
          1. MOBILE DRAWER & OVERLAY (Screens <= 768px)
         ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-200 ${
          mobileDrawerOpen ? "visible" : "invisible pointer-events-none"
        }`}
        aria-hidden={!mobileDrawerOpen}
      >
        {/* Light dark overlay */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 ${
            mobileDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileDrawerOpen(false)}
        />

        {/* Mobile Slide-in Drawer */}
        <aside
          style={{
            transform: mobileDrawerOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="fixed top-0 bottom-0 left-0 z-50 flex flex-col w-[80vw] min-w-[260px] max-w-[300px] bg-[var(--notion-sidebar)] border-r border-[var(--notion-border)] shadow-[rgba(15,15,15,0.2)_0px_0px_0px_1px,rgba(15,15,15,0.3)_0px_8px_24px]"
          aria-label="Mobile Navigation Drawer"
        >
          {/* Drawer Header */}
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

            {/* Close button with >= 40px tap target */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
              title="Close menu"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--notion-text-muted)] uppercase tracking-wider select-none">
                Workspace
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded min-h-[40px] text-sm transition-colors duration-100 select-none ${
                          isActive
                            ? "bg-[var(--notion-active)] font-medium text-[var(--notion-text)]"
                            : "text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
                        }`
                      }
                    >
                      <Icon size={17} className="shrink-0" />
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
              <div className="space-y-1">
                <a
                  href="https://github.com/Rookieabbas/PHARMLY"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded min-h-[40px] text-sm text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors select-none"
                >
                  <span className="truncate">GitHub Repo</span>
                  <ExternalLink size={14} className="shrink-0 opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-[var(--notion-border)] shrink-0 space-y-2">
            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded text-xs text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors select-none"
            >
              <span className="flex items-center gap-2">
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span>{isDark ? "Light mode" : "Dark mode"}</span>
              </span>
              <span className="text-[10px] font-mono opacity-60">
                {isDark ? "Theme" : "Theme"}
              </span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--notion-border-subtle)]">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="w-7 h-7 rounded bg-[var(--notion-border)] flex items-center justify-center text-xs font-semibold select-none shrink-0">
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
                className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded text-[var(--notion-text-muted)] hover:text-[#EB5757] hover:bg-[var(--tag-red-bg)] transition-colors shrink-0"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          2. DESKTOP STATIC SIDEBAR (Screens > 768px)
         ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col bg-[var(--notion-sidebar)] border-r border-[var(--notion-border)] transition-all duration-150 ease-in-out shrink-0 select-none ${
          desktopSidebarOpen ? "w-60" : "w-0 overflow-hidden border-r-0"
        }`}
        aria-label="Desktop Navigation Sidebar"
      >
        {/* Workspace Brand Header */}
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
            onClick={() => setDesktopSidebarOpen(false)}
            className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
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

          {/* User Profile & Logout */}
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
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          3. MAIN CONTENT (Full width with 12-16px padding on mobile)
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Slim Top Bar */}
        <header className="h-12 border-b border-[var(--notion-border)] flex items-center justify-between px-3 sm:px-6 bg-[var(--notion-bg)] shrink-0 select-none">
          <div className="flex items-center gap-2 text-xs text-[var(--notion-text-muted)] min-w-0">
            {/* Mobile Hamburger Menu button (>= 40px tap target) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text)] -ml-1 mr-0.5"
              title="Open menu"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Desktop un-collapse button */}
            {!desktopSidebarOpen && (
              <button
                type="button"
                onClick={() => setDesktopSidebarOpen(true)}
                className="hidden md:flex p-1.5 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text)] mr-1"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            )}

            {/* Breadcrumbs */}
            <span className="hover:text-[var(--notion-text)] cursor-pointer truncate hidden xs:inline">
              Pharmly
            </span>
            <span className="hidden xs:inline">/</span>
            <span className="font-medium text-[var(--notion-text)] flex items-center gap-1.5 truncate">
              <span>{currentNav.emoji}</span>
              <span className="truncate">{currentNav.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Theme Toggle Button (>= 40px tap target) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Scrollable Page Body (12-16px padding on mobile) */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto py-5 sm:py-8 px-3.5 sm:px-6 md:px-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
