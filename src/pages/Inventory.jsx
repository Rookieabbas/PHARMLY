import { useState, useEffect } from "react";
import { Search, Plus, PackageOpen, Loader2 } from "lucide-react";
import { api } from "../utils/api";
import { invalidateMedicineCache } from "../utils/medicineCache";
import toast from "react-hot-toast";

function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await api.get("/medicines");
      setMedicines(data);
    } catch (error) {
      toast.error("Failed to fetch medicines");
    } finally {
      setLoading(false);
    }
  };

  const searchMedicine = async () => {
    if (!search.trim()) {
      fetchMedicines();
      return;
    }

    try {
      setLoading(true);
      const data = await api.get(`/search?name=${encodeURIComponent(search)}`);
      setMedicines(data);
    } catch (error) {
      toast.error("Error searching medicine");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchMedicine();
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast.error("Medicine name is required");
      return false;
    }
    
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      toast.error("Please enter a valid positive price");
      return false;
    }

    const numQty = Number(quantity);
    if (!quantity || isNaN(numQty) || numQty <= 0 || !Number.isInteger(numQty)) {
      toast.error("Please enter a valid positive integer for quantity");
      return false;
    }

    if (!expiryDate) {
      toast.error("Expiry date is required");
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(expiryDate);
    
    if (selectedDate <= today) {
      toast.error("Expiry date must be in the future");
      return false;
    }

    return true;
  };

  const addMedicine = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await api.post("/medicine", {
        name: name.trim(),
        price: Number(price),
        quantity: Number(quantity),
        expiryDate,
      });

      setName("");
      setPrice("");
      setQuantity("");
      setExpiryDate("");
      
      toast.success(`${name} added successfully`);
      invalidateMedicineCache();
      fetchMedicines();
    } catch (error) {
      toast.error("Failed to add medicine");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Inventory Management</h1>
        <p className="text-zinc-400 mt-1">Add and manage Pharmly stock</p>
      </div>

      {/* Add Medicine Section */}
      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-lg">
        <h2 className="text-lg font-bold text-zinc-200 mb-5 flex items-center gap-2">
          <Plus size={20} className="text-emerald-400"/>
          Add New Medicine
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Medicine Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner"
              placeholder="e.g., Paracetamol 500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Price ($) <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Quantity <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Expiry Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner [color-scheme:dark]"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={addMedicine}
            disabled={submitting}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {submitting ? "Adding..." : "Add Medicine"}
          </button>
        </div>
      </div>

      {/* Inventory List Section */}
      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
            <PackageOpen size={20} className="text-emerald-400"/>
            Stock Directory
          </h2>
          
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                className="pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all w-full sm:w-64 text-zinc-200 placeholder-zinc-500 shadow-inner"
                placeholder="Search medicine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <Search size={18} className="absolute left-3.5 top-3 text-zinc-500" />
            </div>
            <button 
              onClick={searchMedicine}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-2.5 rounded-xl font-medium transition-all border border-zinc-700 shadow-sm"
            >
              Search
            </button>
            <button 
              onClick={() => { setSearch(""); fetchMedicines(); }}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-5 py-2.5 rounded-xl font-medium transition-all border border-zinc-800"
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={32} className="animate-spin text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 bg-zinc-950/20">
            <PackageOpen size={48} className="text-zinc-600 mb-3" />
            <p className="font-medium">No medicines found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Quantity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
                {medicines.map((med) => (
                  <tr key={med._id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-200">{med.name}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        med.quantity < 10 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      }`}>
                        {med.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium text-right">${med.price?.toFixed(2) || med.price}</td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">{med.expiryDate?.substring(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
