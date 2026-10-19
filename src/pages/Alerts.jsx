import { useState, useEffect } from "react";
import { AlertTriangle, AlertOctagon, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../utils/api";
import { invalidateMedicineCache } from "../utils/medicineCache";
import { NotionButton } from "../components/ui/NotionButton";
import { NotionTag } from "../components/ui/NotionTag";
import toast from "react-hot-toast";

function Alerts() {
  const [expired, setExpired] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAllAlerts();
  }, []);

  const fetchAllAlerts = async () => {
    setLoading(true);
    await Promise.all([fetchExpired(), fetchLowStock()]);
    setLoading(false);
  };

  const fetchExpired = async () => {
    try {
      const data = await api.get("/expired-medicines");
      setExpired(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching expired medicines", error);
      toast.error("Failed to load expired medicines");
    }
  };

  const fetchLowStock = async () => {
    try {
      const data = await api.get("/low-stock");
      setLowStock(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching low stock medicines", error);
      toast.error("Failed to load low stock medicines");
    }
  };

  const removeExpiredMedicine = async (id) => {
    if (!window.confirm("Are you sure you want to remove this expired medicine from the system?")) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/medicine/${id}`);
      toast.success("Expired medicine removed");
      invalidateMedicineCache();
      await fetchExpired(); // Refresh the list
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast.error(error.message || "Failed to delete medicine.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl w-full">
      {/* Page Header (Notion standard) */}
      <div className="pb-3 border-b border-[var(--notion-border)]">
        <div className="text-2xl sm:text-3xl mb-1.5 select-none">🔔</div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--notion-text)]">
          System Alerts
        </h1>
        <p className="text-xs sm:text-sm text-[var(--notion-text-muted)] mt-1">
          Review batches requiring disposal or inventory items nearing depletion.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--notion-text-muted)] gap-2">
          <div className="w-5 h-5 border-2 border-[var(--notion-border)] border-t-[var(--notion-blue)] rounded-full animate-spin"></div>
          <span className="text-xs">Checking inventory alerts...</span>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8 w-full">
          {/* Section 1: Expired Medicines Database */}
          <div className="space-y-2 w-full">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <AlertOctagon size={16} className="text-[#EB5757] shrink-0" />
                <h2 className="text-sm font-semibold text-[var(--notion-text)]">
                  Expired Medicines
                </h2>
                <NotionTag variant={expired.length > 0 ? "red" : "gray"}>
                  {expired.length} {expired.length === 1 ? "item" : "items"}
                </NotionTag>
              </div>
              <span className="text-[11px] text-[var(--notion-text-muted)]">Action required: Dispose & remove</span>
            </div>

            <div className="border border-[var(--notion-border)] rounded bg-[var(--notion-bg)] overflow-hidden w-full">
              {expired.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--notion-text-muted)] px-4">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-2 opacity-80" />
                  <p className="text-sm font-medium text-[var(--notion-text)]">No expired medicines</p>
                  <p className="text-xs text-[var(--notion-text-muted)] mt-0.5">
                    All stocked items are within valid shelf-life dates.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[500px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--notion-surface)] border-b border-[var(--notion-border)] text-[var(--notion-text-muted)] font-medium">
                        <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[45%]">
                          <span className="flex items-center gap-1 font-normal">
                            <span className="text-[11px] opacity-70">Aa</span> Medicine Name
                          </span>
                        </th>
                        <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[25%]">
                          <span className="font-normal">Expiry Date</span>
                        </th>
                        <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[15%]">
                          <span className="font-normal">Status</span>
                        </th>
                        <th className="px-4 py-2 text-right w-[15%]">
                          <span className="font-normal">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--notion-border)]">
                      {expired.map((med) => (
                        <tr
                          key={med._id}
                          className="hover:bg-[var(--notion-hover)] transition-colors duration-100 group"
                        >
                          <td className="px-4 py-2.5 border-r border-[var(--notion-border)] font-medium text-[var(--notion-text)]">
                            {med.name}
                          </td>
                          <td className="px-4 py-2.5 border-r border-[var(--notion-border)] font-mono text-[var(--notion-text-muted)]">
                            {med.expiryDate ? String(med.expiryDate).split("T")[0] : "—"}
                          </td>
                          <td className="px-4 py-2.5 border-r border-[var(--notion-border)]">
                            <NotionTag variant="red">Expired</NotionTag>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <NotionButton
                              size="sm"
                              variant="danger"
                              disabled={deletingId === med._id}
                              icon={deletingId === med._id ? Loader2 : Trash2}
                              onClick={() => removeExpiredMedicine(med._id)}
                              className="min-h-[36px]"
                            >
                              Remove
                            </NotionButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Low Stock Warnings Database */}
          <div className="space-y-2 w-full">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#E29A23] shrink-0" />
                <h2 className="text-sm font-semibold text-[var(--notion-text)]">
                  Low Stock Warnings
                </h2>
                <NotionTag variant={lowStock.length > 0 ? "yellow" : "gray"}>
                  {lowStock.length} {lowStock.length === 1 ? "item" : "items"}
                </NotionTag>
              </div>
              <span className="text-[11px] text-[var(--notion-text-muted)]">Threshold: Under 10 units</span>
            </div>

            <div className="border border-[var(--notion-border)] rounded bg-[var(--notion-bg)] overflow-hidden w-full">
              {lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--notion-text-muted)] px-4">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-2 opacity-80" />
                  <p className="text-sm font-medium text-[var(--notion-text)]">Stock levels are healthy</p>
                  <p className="text-xs text-[var(--notion-text-muted)] mt-0.5">
                    All inventory items have sufficient units on hand.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[480px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--notion-surface)] border-b border-[var(--notion-border)] text-[var(--notion-text-muted)] font-medium">
                        <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[50%]">
                          <span className="flex items-center gap-1 font-normal">
                            <span className="text-[11px] opacity-70">Aa</span> Medicine Name
                          </span>
                        </th>
                        <th className="px-4 py-2 border-r border-[var(--notion-border)] text-right w-[25%]">
                          <span className="font-normal">Quantity Remaining</span>
                        </th>
                        <th className="px-4 py-2 w-[25%]">
                          <span className="font-normal">Status</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--notion-border)]">
                      {lowStock.map((med) => (
                        <tr
                          key={med._id}
                          className="hover:bg-[var(--notion-hover)] transition-colors duration-100 group"
                        >
                          <td className="px-4 py-2.5 border-r border-[var(--notion-border)] font-medium text-[var(--notion-text)]">
                            {med.name}
                          </td>
                          <td className="px-4 py-2.5 border-r border-[var(--notion-border)] text-right font-mono font-medium text-[var(--notion-text)]">
                            {med.quantity}
                          </td>
                          <td className="px-4 py-2.5">
                            <NotionTag variant={med.quantity === 0 ? "red" : "yellow"}>
                              {med.quantity === 0 ? "Out of Stock" : `Low Stock (${med.quantity})`}
                            </NotionTag>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;