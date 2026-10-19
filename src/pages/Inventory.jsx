import { useState, useEffect } from "react";
import { Search, Plus, X, Package, Calendar, Hash, DollarSign, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { api } from "../utils/api";
import { invalidateMedicineCache } from "../utils/medicineCache";
import { NotionButton } from "../components/ui/NotionButton";
import { NotionTag } from "../components/ui/NotionTag";
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
  const [showAddForm, setShowAddForm] = useState(false);

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
    if (e.key === "Enter") {
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

  const addMedicine = async (e) => {
    if (e) e.preventDefault();
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
      setShowAddForm(false);

      toast.success(`${name} added to inventory`);
      invalidateMedicineCache();
      fetchMedicines();
    } catch (error) {
      toast.error("Failed to add medicine");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header (Notion standard) */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--notion-border)]">
        <div>
          <div className="text-3xl mb-2 select-none">📦</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--notion-text)]">
            Inventory
          </h1>
          <p className="text-sm text-[var(--notion-text-muted)] mt-1">
            Database of pharmacy medicines, stock levels, pricing, and expiration dates.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-6">
          <NotionButton
            variant={showAddForm ? "secondary" : "primary"}
            size="md"
            icon={showAddForm ? X : Plus}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "New Medicine"}
          </NotionButton>
        </div>
      </div>

      {/* Notion Form (Simple labeled inputs with 1px border, blue focus ring) */}
      {showAddForm && (
        <form
          onSubmit={addMedicine}
          className="p-5 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--notion-border)]">
            <span className="text-sm font-semibold text-[var(--notion-text)] flex items-center gap-2">
              <Plus size={16} className="text-[var(--notion-blue)]" />
              Add Medicine Record
            </span>
            <span className="text-xs text-[var(--notion-text-muted)]">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--notion-text-muted)] mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors"
                placeholder="e.g. Paracetamol 500mg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--notion-text-muted)] mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="w-full px-3 py-1.5 text-sm bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--notion-text-muted)] mb-1">
                Quantity in Stock *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full px-3 py-1.5 text-sm bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--notion-text-muted)] mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                className="w-full px-3 py-1.5 text-sm bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <NotionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </NotionButton>
            <NotionButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              icon={submitting ? Loader2 : Plus}
            >
              {submitting ? "Saving..." : "Add to Database"}
            </NotionButton>
          </div>
        </form>
      )}

      {/* Database Toolbar (Filter, Search, Row count) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2 text-[var(--notion-text-light)]" />
            <input
              type="text"
              className="pl-8 pr-3 py-1 text-xs bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors w-48 sm:w-64"
              placeholder="Filter by medicine name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <NotionButton size="sm" variant="secondary" onClick={searchMedicine}>
            Search
          </NotionButton>

          {search && (
            <NotionButton
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch("");
                fetchMedicines();
              }}
            >
              Clear
            </NotionButton>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--notion-text-muted)]">
          <span>{medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}</span>
        </div>
      </div>

      {/* Notion Database Table View */}
      <div className="border border-[var(--notion-border)] rounded bg-[var(--notion-bg)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--notion-text-muted)] gap-2">
            <div className="w-5 h-5 border-2 border-[var(--notion-border)] border-t-[var(--notion-blue)] rounded-full animate-spin"></div>
            <span className="text-xs">Fetching medicine records...</span>
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--notion-text-muted)]">
            <Package size={28} className="text-[var(--notion-text-light)] mb-2 opacity-60" />
            <p className="text-sm font-medium text-[var(--notion-text)]">No medicines found</p>
            <p className="text-xs text-[var(--notion-text-muted)] mt-0.5">
              {search ? "No items match your filter query." : "Database is empty. Click '+ New Medicine' above to record stock."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--notion-surface)] border-b border-[var(--notion-border)] text-[var(--notion-text-muted)] font-medium">
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[40%]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <span className="text-[11px] opacity-70">Aa</span> Medicine Name
                    </span>
                  </th>
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[18%]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <span className="text-[11px] opacity-70">🏷️</span> Stock Status
                    </span>
                  </th>
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] text-right w-[14%]">
                    <span className="flex items-center justify-end gap-1.5 font-normal">
                      <Hash size={12} className="opacity-70" /> Quantity
                    </span>
                  </th>
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] text-right w-[14%]">
                    <span className="flex items-center justify-end gap-1.5 font-normal">
                      <DollarSign size={12} className="opacity-70" /> Price
                    </span>
                  </th>
                  <th className="px-4 py-2 w-[14%]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Calendar size={12} className="opacity-70" /> Expiry
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--notion-border)]">
                {medicines.map((med) => {
                  const isLow = med.quantity < 10;
                  return (
                    <tr
                      key={med._id}
                      className="hover:bg-[var(--notion-hover)] transition-colors duration-100 group"
                    >
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)] font-medium text-[var(--notion-text)]">
                        {med.name}
                      </td>
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)]">
                        <NotionTag variant={isLow ? "yellow" : "green"}>
                          {isLow ? `Low stock (${med.quantity})` : "In stock"}
                        </NotionTag>
                      </td>
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)] text-right font-mono text-[var(--notion-text)]">
                        {med.quantity}
                      </td>
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)] text-right font-mono text-[var(--notion-text)]">
                        ${med.price?.toFixed(2) || med.price}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--notion-text-muted)] font-mono">
                        {med.expiryDate?.substring(0, 10)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Notion-style bottom row: "+ New" */}
        <div
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] cursor-pointer border-t border-[var(--notion-border)] transition-colors select-none"
        >
          <Plus size={14} />
          <span>New row</span>
        </div>
      </div>
    </div>
  );
}

export default Inventory;
