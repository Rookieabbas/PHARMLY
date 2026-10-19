import { useState, useEffect } from "react";
import { Package, AlertTriangle, AlertOctagon, ArrowRight, Plus, RefreshCw, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { NotionButton } from "../components/ui/NotionButton";
import { NotionTag } from "../components/ui/NotionTag";
import { NotionCallout } from "../components/ui/NotionCallout";
import toast from "react-hot-toast";

function Dashboard() {
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(false);
      // Fetch all data in parallel using the centralized API utility
      const [medicinesData, lowStockData, expiredData] = await Promise.all([
        api.get("/medicines"),
        api.get("/low-stock"),
        api.get("/expired-medicines"),
      ]);

      setTotalMedicines(medicinesData.length || 0);
      setLowStockCount(lowStockData.length || 0);
      setExpiredCount(expiredData.length || 0);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(true);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-[var(--notion-text-muted)] gap-3">
        <div className="w-5 h-5 border-2 border-[var(--notion-border)] border-t-[var(--notion-blue)] rounded-full animate-spin"></div>
        <span className="text-xs">Loading workspace metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <NotionCallout icon="⚠️">
          <div>
            <p className="font-semibold text-sm">Unable to connect to database</p>
            <p className="text-xs text-[var(--notion-text-muted)] mt-1">
              Check server connection and MongoDB status, then try again.
            </p>
            <div className="mt-3">
              <NotionButton size="sm" variant="secondary" onClick={fetchDashboardData} icon={RefreshCw}>
                Retry Connection
              </NotionButton>
            </div>
          </div>
        </NotionCallout>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Medicines",
      value: totalMedicines,
      icon: Package,
      tag: "Catalog",
      tagVariant: "blue",
      description: "Active pharmaceutical items",
      link: "/inventory",
    },
    {
      title: "Low Stock Items",
      value: lowStockCount,
      icon: AlertTriangle,
      tag: lowStockCount > 0 ? "Restock" : "Optimal",
      tagVariant: lowStockCount > 0 ? "yellow" : "green",
      description: "Quantity below 10 units",
      link: "/alerts",
    },
    {
      title: "Expired Medicines",
      value: expiredCount,
      icon: AlertOctagon,
      tag: expiredCount > 0 ? "Urgent" : "None",
      tagVariant: expiredCount > 0 ? "red" : "gray",
      description: "Past expiration date",
      link: "/alerts",
    },
  ];

  const quickLinks = [
    {
      title: "Point of Sale",
      description: "Process new customer sales and voice-assisted billing",
      icon: ShoppingCart,
      link: "/billing",
      tag: "POS",
    },
    {
      title: "Inventory Catalog",
      description: "Add new medicines, adjust quantities, and search stock",
      icon: Package,
      link: "/inventory",
      tag: "Database",
    },
    {
      title: "Alerts & Disposals",
      description: "Review expired batches and items needing reorder",
      icon: AlertTriangle,
      link: "/alerts",
      tag: "Warnings",
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header (Notion standard: big title + optional icon + brief subtitle) */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--notion-border)]">
        <div>
          <div className="text-3xl mb-2 select-none">📊</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--notion-text)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--notion-text-muted)] mt-1">
            Overview of pharmacy inventory, active alerts, and dispensary operations.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-6">
          <NotionButton
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate("/billing")}
          >
            New Sale
          </NotionButton>
        </div>
      </div>

      {/* Notion Stat Blocks (flat, 1px border, calm text, pastel tag) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--notion-text-muted)]">
            Key Metrics
          </h2>
          <span className="text-xs text-[var(--notion-text-light)]">Updated real-time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(stat.link)}
                className="group p-4 rounded bg-[var(--notion-bg)] hover:bg-[var(--notion-surface-hover)] border border-[var(--notion-border)] transition-colors duration-100 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-[var(--notion-text-muted)] flex items-center gap-1.5">
                      <Icon size={14} className="text-[var(--notion-text-muted)]" />
                      {stat.title}
                    </span>
                    <NotionTag variant={stat.tagVariant}>{stat.tag}</NotionTag>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-[var(--notion-text)]">
                    {stat.value}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[var(--notion-border-subtle)] flex items-center justify-between text-xs text-[var(--notion-text-muted)] group-hover:text-[var(--notion-text)]">
                  <span>{stat.description}</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operations Directory (Notion-style linked database rows) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--notion-text-muted)]">
            Quick Operations
          </h2>
        </div>

        <div className="border border-[var(--notion-border)] rounded divide-y divide-[var(--notion-border)] bg-[var(--notion-bg)] overflow-hidden">
          {quickLinks.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(item.link)}
                className="flex items-center justify-between p-3.5 hover:bg-[var(--notion-hover)] transition-colors duration-100 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] flex items-center justify-center text-[var(--notion-text-muted)] group-hover:text-[var(--notion-text)] shrink-0">
                    <ItemIcon size={15} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--notion-text)] flex items-center gap-2">
                      {item.title}
                      <NotionTag variant="gray">{item.tag}</NotionTag>
                    </div>
                    <div className="text-xs text-[var(--notion-text-muted)]">
                      {item.description}
                    </div>
                  </div>
                </div>

                <ArrowRight
                  size={15}
                  className="text-[var(--notion-text-light)] group-hover:text-[var(--notion-text)] group-hover:translate-x-0.5 transition-all"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Pharmacy Note / System status callout */}
      <NotionCallout icon="💡">
        <div>
          <span className="font-medium">Voice Recognition Enabled:</span> You can dictate medicine additions and stock checks directly inside the{" "}
          <span
            onClick={() => navigate("/billing")}
            className="text-[var(--notion-blue)] underline cursor-pointer hover:opacity-80"
          >
            Point of Sale
          </span>{" "}
          page using natural voice commands.
        </div>
      </NotionCallout>
    </div>
  );
}

export default Dashboard;
