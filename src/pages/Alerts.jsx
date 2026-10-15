import { useState, useEffect } from "react";
import { AlertTriangle, AlertOctagon, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../utils/api";
import { invalidateMedicineCache } from "../utils/medicineCache";
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
      setExpired(data);
    } catch (error) {
      console.error("Error fetching expired medicines", error);
      toast.error("Failed to load expired medicines");
    }
  };

  const fetchLowStock = async () => {
    try {
      const data = await api.get("/low-stock");
      setLowStock(data);
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
      toast.error("Failed to delete medicine.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">System Alerts</h1>
        <p className="text-zinc-400 mt-1">Manage expired and low stock inventory</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 size={40} className="animate-spin text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Expired Medicines Section */}
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-lg overflow-hidden flex flex-col hover:border-red-500/40 transition-colors">
            <div className="p-6 bg-red-500/10 border-b border-red-500/20 flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.2)]">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-100">Expired Medicines</h2>
                <p className="text-sm text-red-400 font-medium mt-0.5">{expired.length} items require immediate removal</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {expired.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-zinc-500 bg-zinc-950/30">
                  <CheckCircle2 size={48} className="mb-3 text-emerald-500/50 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  <p className="font-medium text-zinc-400">No expired medicines</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-950/50 border-b border-zinc-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Medicine Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                    {expired.map((med) => (
                      <tr key={med._id} className="hover:bg-red-500/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-200">{med.name}</td>
                        <td className="px-6 py-4 text-red-400 font-medium">
                          {med.expiryDate?.split("T")[0]}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => removeExpiredMedicine(med._id)}
                            disabled={deletingId === med._id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === med._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Low Stock Section */}
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-amber-500/20 shadow-lg overflow-hidden flex flex-col hover:border-amber-500/40 transition-colors">
            <div className="p-6 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-100">Low Stock Warnings</h2>
                <p className="text-sm text-amber-400 font-medium mt-0.5">{lowStock.length} items need restocking</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-zinc-500 bg-zinc-950/30">
                  <CheckCircle2 size={48} className="mb-3 text-emerald-500/50 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  <p className="font-medium text-zinc-400">Stock levels are healthy</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-950/50 border-b border-zinc-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Medicine Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Quantity Left</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
                    {lowStock.map((med) => (
                      <tr key={med._id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-200">{med.name}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-block min-w-[2.5rem] text-center font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg shadow-inner">
                            {med.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                            {med.quantity === 0 ? "Out of Stock" : "Low Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default Alerts;