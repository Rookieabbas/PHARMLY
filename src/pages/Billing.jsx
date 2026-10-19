import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Search,
  Plus,
  Trash2,
  Receipt,
  ShoppingCart,
  Loader2,
  Package,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { api } from "../utils/api";
import { useVoiceRecognition } from "../utils/useVoiceRecognition";
import { parseVoiceInput } from "../utils/voiceParser";
import { getMedicines } from "../utils/medicineCache";
import { NotionButton } from "../components/ui/NotionButton";
import { NotionTag } from "../components/ui/NotionTag";
import { NotionCallout } from "../components/ui/NotionCallout";
import toast from "react-hot-toast";

function Billing() {
  const [code, setCode] = useState("");
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [allMedicines, setAllMedicines] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const inputRef = useRef(null);

  // Fetch and cache medicines from MongoDB
  useEffect(() => {
    getMedicines().then((meds) => {
      if (meds && meds.length) {
        setAllMedicines(meds);
      }
    });
  }, []);

  // Helper to add medicine object directly into cart
  const addMedicineDirect = useCallback((med, qty = 1) => {
    const today = new Date();
    const expiry = new Date(med.expiryDate);

    if (expiry < today) {
      toast.error(`${med.name} is expired and cannot be sold!`);
      return false;
    }

    if (med.quantity < 10) {
      toast.custom(
        (t) => (
          <div
            className={`p-3 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] shadow-sm flex items-center justify-between text-xs ${
              t.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-2">
              <NotionTag variant="yellow">Low Stock</NotionTag>
              <span className="text-[var(--notion-text)]">
                Only {med.quantity} {med.name} remaining
              </span>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    }

    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item._id === med._id || item.name === med.name
      );
      const currentCartQty = existing ? existing.qty : 0;

      if (currentCartQty + qty > med.quantity) {
        toast.error(`Only ${med.quantity} ${med.name} available in stock`);
        return prevCart;
      }

      if (existing) {
        return prevCart.map((item) =>
          item._id === med._id || item.name === med.name
            ? { ...item, qty: item.qty + qty }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            _id: med._id,
            name: med.name,
            code: med.code,
            price: med.price,
            qty: qty,
            stock: med.quantity,
          },
        ];
      }
    });

    toast.success(`Added ${med.name} (Qty: ${qty})`);
    return true;
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    toast.success("Cart cleared");
  }, []);

  const removeMedicine = useCallback((index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const generateBill = useCallback(async () => {
    if (cart.length === 0) return;

    setSubmitting(true);
    const loadingToast = toast.loading("Processing transaction...");
    try {
      for (const item of cart) {
        await api.put(`/sell/${item._id}`, {
          quantity: item.qty,
        });
      }

      toast.success(`Bill Generated! Total: $${total.toFixed(2)}`, {
        id: loadingToast,
        duration: 5000,
      });
      setCart([]);
    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error("Failed to generate bill. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  }, [cart, total]);

  // Voice speech handler: process ONLY finalized results
  const handleFinalSpeech = useCallback(
    (speechText) => {
      if (!speechText || !speechText.trim()) return;

      const parsed = parseVoiceInput(speechText, allMedicines);
      console.log("Voice Input Processed:", parsed);

      setSuggestions(parsed.suggestions || []);

      // 1. System Commands without medicine
      if (parsed.command === "clear") {
        clearCart();
        setCode("");
        setFeedbackMessage("Command: Cart cleared");
        return;
      }

      if (parsed.command === "bill") {
        if (cart.length > 0) {
          generateBill();
        } else {
          toast.error("Cart is empty");
        }
        setCode("");
        setFeedbackMessage("Command: Bill generated");
        return;
      }

      if (parsed.command === "stop") {
        stopListening();
        toast("Microphone turned off", { icon: "🎙️" });
        setFeedbackMessage("Microphone stopped");
        return;
      }

      // 2. Matched Medicine
      if (parsed.medicine) {
        const med = parsed.medicine;
        setCode(med.name);
        setFeedbackMessage(`Matched: ${med.name}`);

        if (parsed.command === "check_stock") {
          toast.custom(
            (t) => (
              <div
                className={`p-3 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] shadow-md flex items-center gap-3 text-xs ${
                  t.visible ? "opacity-100" : "opacity-0"
                }`}
              >
                <Package size={18} className="text-[var(--notion-blue)] shrink-0" />
                <div>
                  <p className="font-semibold text-[var(--notion-text)]">{med.name}</p>
                  <p className="text-[var(--notion-text-muted)] mt-0.5">
                    Stock:{" "}
                    <span className={med.quantity < 10 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                      {med.quantity} available
                    </span>{" "}
                    {med.code ? `| Code: ${med.code}` : ""}
                  </p>
                </div>
              </div>
            ),
            { duration: 5000 }
          );
          return;
        }

        if (parsed.command === "remove") {
          let found = false;
          setCart((prev) => {
            const index = prev.findIndex(
              (item) => item._id === med._id || item.name === med.name
            );
            if (index !== -1) {
              found = true;
              return prev.filter((_, i) => i !== index);
            }
            return prev;
          });

          if (found) {
            toast.success(`Removed ${med.name} from cart`);
          } else {
            toast.error(`${med.name} is not in the cart`);
          }
          return;
        }

        if (parsed.command === "search") {
          toast.success(`Found ${med.name} in inventory`);
          return;
        }

        // Default command is ADD
        addMedicineDirect(med, parsed.quantity || 1);
        return;
      }

      // 3. No medicine matched
      if (!parsed.medicine) {
        setFeedbackMessage("");
        if (parsed.suggestions && parsed.suggestions.length > 0) {
          toast("Uncertain match. Choose a suggestion below.", { icon: "🔍" });
        } else {
          toast.error("No medicine found matching speech.");
        }
      }
    },
    [allMedicines, cart, clearCart, generateBill, addMedicineDirect]
  );

  // Initialize Speech Recognition Hook
  const {
    isListening,
    isSupported,
    interimText,
    error: voiceError,
    stopListening,
    toggleListening,
  } = useVoiceRecognition({
    onFinalSpeech: handleFinalSpeech,
    lang: "en-IN",
    debounceMs: 300,
  });

  // Manual Add Medicine from input box
  const handleManualAdd = async () => {
    if (!code.trim()) return;

    try {
      const data = await api.get(`/search?name=${encodeURIComponent(code.trim())}`);
      if (!data || data.length === 0) {
        toast.error("Medicine not found in inventory.");
        return;
      }

      addMedicineDirect(data[0], 1);
      setCode("");
      setSuggestions([]);
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      console.error("Error searching medicine:", err);
      toast.error("Error searching medicine");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl w-full">
      {/* Page Header (Notion standard) */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[var(--notion-border)]">
        <div>
          <div className="text-2xl sm:text-3xl mb-1.5 select-none">🧾</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--notion-text)]">
            Point of Sale
          </h1>
          <p className="text-xs sm:text-sm text-[var(--notion-text-muted)] mt-1">
            Scan, type, or speak medicine names to assemble the customer bill.
          </p>
        </div>

        {/* Live Voice Status Pill */}
        <div className="flex items-center gap-2 pt-1 sm:pt-4">
          {isListening ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded min-h-[38px] bg-[var(--tag-red-bg)] text-[var(--tag-red-text)] text-xs font-medium border border-transparent">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="truncate max-w-[200px] sm:max-w-xs">
                {interimText ? `"${interimText}"` : "Listening (en-IN)..."}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded min-h-[38px] bg-[var(--notion-surface)] text-[var(--notion-text-muted)] text-xs border border-[var(--notion-border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--notion-text-light)]"></span>
              <span>Voice offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Voice Error Notice if any */}
      {voiceError && (
        <NotionCallout icon="⚠️">
          <span className="text-xs text-[var(--notion-text)]">{voiceError}</span>
        </NotionCallout>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 w-full">
        {/* Left Column: Search, Mic & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4 w-full">
          <div className="p-4 rounded bg-[var(--notion-bg)] border border-[var(--notion-border)] space-y-4 w-full">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--notion-border)]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--notion-text-muted)]">
                Add Medicine
              </h2>
              {feedbackMessage && (
                <span className="text-xs text-[var(--notion-blue)] font-medium truncate max-w-[180px]">
                  {feedbackMessage}
                </span>
              )}
            </div>

            {/* Input with embedded Mic Icon Button */}
            <div>
              <label className="block text-xs font-medium text-[var(--notion-text-muted)] mb-1">
                Medicine Name or Spoken Phrase
              </label>
              <div className="relative flex items-center">
                <Search
                  size={14}
                  className="absolute left-3 text-[var(--notion-text-light)] pointer-events-none"
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder='e.g. "Paracetamol 500" or tap mic...'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleManualAdd();
                    }
                  }}
                  className="w-full pl-9 pr-11 py-2 text-sm bg-[var(--notion-surface)] border border-[var(--notion-border)] rounded text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] outline-none transition-colors min-h-[42px]"
                />

                {/* Embedded Notion mic button with >=40px touch area */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Stop listening" : "Start voice recognition"}
                  className={`absolute right-1 min-h-[40px] min-w-[40px] flex items-center justify-center rounded transition-colors ${
                    isListening
                      ? "text-red-500 bg-[var(--tag-red-bg)] hover:opacity-80"
                      : "text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover-darker)]"
                  }`}
                >
                  {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
              </div>
            </div>

            {/* Suggestions list when confidence is low */}
            {suggestions.length > 0 && (
              <div className="p-3 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] space-y-2">
                <p className="text-xs font-medium text-[var(--notion-text-muted)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[var(--notion-blue)]" />
                  Suggestions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug) => (
                    <button
                      key={sug._id}
                      type="button"
                      onClick={() => {
                        setCode(sug.name);
                        addMedicineDirect(sug, 1);
                        setSuggestions([]);
                        setFeedbackMessage(`Selected: ${sug.name}`);
                      }}
                      className="px-2.5 py-1.5 text-xs rounded bg-[var(--notion-bg)] hover:bg-[var(--notion-surface-hover)] border border-[var(--notion-border)] text-[var(--notion-text)] transition-colors text-left min-h-[36px]"
                    >
                      {sug.name} <span className="text-[var(--notion-text-muted)]">(${sug.price})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Flat Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <NotionButton
                type="button"
                variant="primary"
                size="md"
                className="flex-1 min-h-[40px]"
                icon={Plus}
                onClick={handleManualAdd}
              >
                Add Item
              </NotionButton>

              <NotionButton
                type="button"
                variant={isListening ? "danger" : "secondary"}
                size="md"
                className="min-h-[40px] px-3.5"
                icon={isListening ? MicOff : Mic}
                onClick={toggleListening}
              >
                {isListening ? "Stop Mic" : "Speak"}
              </NotionButton>
            </div>
          </div>

          {/* Smart Voice Guide (Notion style minimal callout) */}
          <NotionCallout icon="🎙️">
            <div className="space-y-1.5 text-xs text-[var(--notion-text)]">
              <p className="font-semibold text-[var(--notion-text)]">Voice Commands (en-IN)</p>
              <ul className="space-y-1 text-[var(--notion-text-muted)]">
                <li>• <strong className="text-[var(--notion-text)]">"amx 250"</strong> or <strong className="text-[var(--notion-text)]">"add pcm 500"</strong>: Add item</li>
                <li>• <strong className="text-[var(--notion-text)]">"check stock of paracetamol 500"</strong>: Check stock</li>
                <li>• <strong className="text-[var(--notion-text)]">"remove pcm 500"</strong>: Remove from cart</li>
                <li>• <strong className="text-[var(--notion-text)]">"clear cart"</strong> / <strong className="text-[var(--notion-text)]">"generate bill"</strong>: Actions</li>
              </ul>
            </div>
          </NotionCallout>
        </div>

        {/* Right Column: Notion Cart Database Table (7 cols) */}
        <div className="lg:col-span-7 w-full">
          <div className="border border-[var(--notion-border)] rounded bg-[var(--notion-bg)] overflow-hidden flex flex-col min-h-[420px] w-full">
            {/* Table Toolbar */}
            <div className="px-3.5 sm:px-4 py-3 border-b border-[var(--notion-border)] bg-[var(--notion-surface)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-[var(--notion-text-muted)]" />
                <span className="text-xs font-semibold text-[var(--notion-text)] uppercase tracking-wider">
                  Cart Items
                </span>
                <NotionTag variant="gray">{cart.length}</NotionTag>
              </div>

              {cart.length > 0 && (
                <NotionButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  icon={Trash2}
                  className="min-h-[36px]"
                >
                  Clear all
                </NotionButton>
              )}
            </div>

            {/* Cart Items Table Container (Horizontal scroll on phone screens) */}
            <div className="overflow-x-auto w-full flex-1">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-center text-[var(--notion-text-muted)] px-4">
                  <ShoppingCart size={24} className="text-[var(--notion-text-light)] mb-2 opacity-50" />
                  <p className="text-sm font-medium text-[var(--notion-text)]">Cart is empty</p>
                  <p className="text-xs text-[var(--notion-text-muted)] mt-0.5">
                    Search or speak medicine names to build the bill.
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[420px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--notion-surface)] border-b border-[var(--notion-border)] text-[var(--notion-text-muted)] font-medium">
                      <th className="px-3 sm:px-4 py-2 border-r border-[var(--notion-border)] w-[45%]">
                        <span className="flex items-center gap-1 font-normal">
                          <span className="text-[11px] opacity-70">Aa</span> Medicine
                        </span>
                      </th>
                      <th className="px-2.5 sm:px-3 py-2 border-r border-[var(--notion-border)] text-center w-[15%]">
                        <span className="font-normal">Qty</span>
                      </th>
                      <th className="px-2.5 sm:px-3 py-2 border-r border-[var(--notion-border)] text-right w-[18%]">
                        <span className="font-normal">Price</span>
                      </th>
                      <th className="px-2.5 sm:px-3 py-2 border-r border-[var(--notion-border)] text-right w-[18%]">
                        <span className="font-normal">Total</span>
                      </th>
                      <th className="px-2 py-2 text-center w-[4%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--notion-border)]">
                    {cart.map((item, index) => (
                      <tr
                        key={item._id || index}
                        className="hover:bg-[var(--notion-hover)] transition-colors duration-100 group"
                      >
                        <td className="px-3 sm:px-4 py-2.5 border-r border-[var(--notion-border)] font-medium text-[var(--notion-text)]">
                          {item.name}
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 border-r border-[var(--notion-border)] text-center font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] text-[var(--notion-text)]">
                            {item.qty}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 border-r border-[var(--notion-border)] text-right font-mono text-[var(--notion-text-muted)]">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 border-r border-[var(--notion-border)] text-right font-mono font-medium text-[var(--notion-text)]">
                          ${(item.qty * item.price).toFixed(2)}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded text-[var(--notion-text-light)] hover:text-red-500 hover:bg-[var(--tag-red-bg)] transition-colors"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bill Summary Footer (Notion clean totals) */}
            <div className="p-3.5 sm:p-4 border-t border-[var(--notion-border)] bg-[var(--notion-surface)] space-y-3.5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[var(--notion-text-muted)]">Total Items: </span>
                  <span className="text-xs font-semibold text-[var(--notion-text)] font-mono">{totalItems}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--notion-text-muted)] mr-2">Grand Total:</span>
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--notion-text)] font-mono">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <NotionButton
                type="button"
                variant="primary"
                size="lg"
                className="w-full min-h-[46px]"
                disabled={cart.length === 0 || submitting}
                onClick={generateBill}
                icon={submitting ? Loader2 : Receipt}
              >
                {submitting ? "Processing Transaction..." : "Complete Sale & Print Bill"}
              </NotionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;
