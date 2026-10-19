import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  Package,
  Calendar,
  Hash,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { api } from "../utils/api";
import { invalidateMedicineCache } from "../utils/medicineCache";
import { NotionButton } from "../components/ui/NotionButton";
import { NotionTag } from "../components/ui/NotionTag";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 25;

function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await api.get("/medicines");
      setMedicines(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
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
      const data = await api.get(`/search?name=${encodeURIComponent(search.trim())}`);
      setMedicines(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error searching medicine:", error);
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

  // Helper to calculate stock and expiry tags
  const getStatusTags = (med) => {
    const tags = [];
    const qty = Number(med.quantity) || 0;

    // Stock Status: 0 = out of stock, 1-9 = low stock, 10 or more = in stock
    if (qty === 0) {
      tags.push({ key: "stock-out", text: "Out of stock", variant: "red" });
    } else if (qty < 10) {
      tags.push({ key: "stock-low", text: `Low stock (${qty})`, variant: "yellow" });
    } else {
      tags.push({ key: "stock-in", text: "In stock", variant: "green" });
    }

    // Expiry Status: Expired or Expiring soon
    if (med.expiryDate) {
      const expiry = new Date(med.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        tags.push({ key: "exp-expired", text: "Expired", variant: "red" });
      } else if (diffDays <= 30) {
        tags.push({ key: "exp-soon", text: "Expiring soon", variant: "yellow" });
      }
    }

    return tags;
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
    if (quantity === "" || isNaN(numQty) || numQty < 0 || !Number.isInteger(numQty)) {
      toast.error("Please enter a valid non-negative integer for quantity");
      return false;
    }

    if (!expiryDate) {
      toast.error("Expiry date is required");
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
        code: code.trim() || undefined,
        price: Number(price),
        quantity: Number(quantity),
        expiryDate,
      });

      setName("");
      setCode("");
      setPrice("");
      setQuantity("");
      setExpiryDate("");
      setShowAddForm(false);

      toast.success(`${name} added to inventory`);
      invalidateMedicineCache();
      fetchMedicines();
    } catch (error) {
      console.error("Failed to add medicine:", error);
      toast.error("Failed to add medicine");
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(medicines.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, medicines.length);
  const currentItems = useMemo(() => {
    return medicines.slice(startIndex, endIndex);
  }, [medicines, startIndex, endIndex]);

  const goToPage = (page) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
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
                Code / SKU
              </label>
              <input
                type="text"
                className="w-full px-3 py-1.5 text-sm bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors uppercase font-mono"
                placeholder="e.g. PCM500"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
                min="0"
                step="1"
                className="w-full px-3 py-1.5 text-sm bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
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
              placeholder="Search by name or code..."
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

        <div className="flex items-center gap-3 text-xs text-[var(--notion-text-muted)]">
          <span>
            {medicines.length === 0
              ? "0 medicines"
              : `Showing ${startIndex + 1}–${endIndex} of ${medicines.length} medicines`}
          </span>
          <span className="text-[var(--notion-border)]">|</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Notion Database Table View */}
      <div className="border border-[var(--notion-border)] rounded bg-[var(--notion-bg)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--notion-text-muted)] gap-2">
            <div className="w-5 h-5 border-2 border-[var(--notion-border)] border-t-[var(--notion-blue)] rounded-full animate-spin"></div>
            <span className="text-xs">Loading medicines from database...</span>
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--notion-text-muted)]">
            <Package size={28} className="text-[var(--notion-text-light)] mb-2 opacity-60" />
            <p className="text-sm font-medium text-[var(--notion-text)]">No medicines found</p>
            <p className="text-xs text-[var(--notion-text-muted)] mt-0.5">
              {search
                ? "No items match your filter query. Click 'Clear' to restore the full list."
                : "Database is empty. Click '+ New Medicine' above to record stock."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--notion-surface)] border-b border-[var(--notion-border)] text-[var(--notion-text-muted)] font-medium">
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[32%]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <span className="text-[11px] opacity-70">Aa</span> Medicine Name
                    </span>
                  </th>
                  <th className="px-3 py-2 border-r border-[var(--notion-border)] w-[12%]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Hash size={12} className="opacity-70" /> Code
                    </span>
                  </th>
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] w-[26%]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <span className="text-[11px] opacity-70">🏷️</span> Status
                    </span>
                  </th>
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] text-right w-[12%]">
                    <span className="flex items-center justify-end gap-1.5 font-normal">
                      <Hash size={12} className="opacity-70" /> Quantity
                    </span>
                  </th>
                  <th className="px-4 py-2 border-r border-[var(--notion-border)] text-right w-[10%]">
                    <span className="flex items-center justify-end gap-1.5 font-normal">
                      <DollarSign size={12} className="opacity-70" /> Price
                    </span>
                  </th>
                  <th className="px-4 py-2 w-[18%]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Calendar size={12} className="opacity-70" /> Expiry
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--notion-border)]">
                {currentItems.map((med) => {
                  const statusTags = getStatusTags(med);
                  return (
                    <tr
                      key={med._id || med.code}
                      className="hover:bg-[var(--notion-hover)] transition-colors duration-100 group"
                    >
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)] font-medium text-[var(--notion-text)]">
                        {med.name}
                      </td>
                      <td className="px-3 py-2.5 border-r border-[var(--notion-border)] font-mono text-[var(--notion-text-muted)] text-[11px]">
                        {med.code || "—"}
                      </td>
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)]">
                        <div className="flex flex-wrap gap-1">
                          {statusTags.map((tag) => (
                            <NotionTag key={tag.key} variant={tag.variant}>
                              {tag.text}
                            </NotionTag>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)] text-right font-mono text-[var(--notion-text)]">
                        {med.quantity}
                      </td>
                      <td className="px-4 py-2.5 border-r border-[var(--notion-border)] text-right font-mono text-[var(--notion-text)]">
                        ${Number(med.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--notion-text-muted)] font-mono">
                        {med.expiryDate ? String(med.expiryDate).substring(0, 10) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Notion Pagination Controls Footer */}
        {medicines.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[var(--notion-border)] bg-[var(--notion-surface)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[var(--notion-text-muted)] select-none">
              Showing <span className="font-semibold text-[var(--notion-text)]">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-[var(--notion-text)]">{endIndex}</span> of{" "}
              <span className="font-semibold text-[var(--notion-text)]">{medicines.length}</span> medicines
            </div>

            <div className="flex items-center gap-1 select-none">
              <button
                type="button"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-2 py-0.5 text-xs font-medium text-[var(--notion-text)] bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
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
