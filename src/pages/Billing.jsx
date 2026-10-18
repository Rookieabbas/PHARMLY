import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Search,
  Plus,
  Trash2,
  Receipt,
  ShoppingCart,
  Loader2,
  Package,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { api } from "../utils/api";
import { useVoiceRecognition } from "../utils/useVoiceRecognition";
import { parseVoiceInput } from "../utils/voiceParser";
import { getMedicines } from "../utils/medicineCache";
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
            className={`bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 px-4 py-3 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.2)] flex items-center justify-between ${
              t.visible ? "animate-enter" : "animate-leave"
            }`}
          >
            <div className="flex items-center">
              <span className="text-amber-400 font-bold mr-2">Low Stock:</span>
              <span className="text-zinc-200">
                Only {med.quantity} {med.name} left
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
        // Search box displays ONLY the matched clean medicine name, never the raw transcript
        setCode(med.name);
        setFeedbackMessage(`Matched: ${med.name}`);

        if (parsed.command === "check_stock") {
          toast.custom(
            (t) => (
              <div
                className={`bg-zinc-900 border border-teal-500/30 p-4 rounded-xl shadow-xl flex items-center gap-3 ${
                  t.visible ? "animate-enter" : "animate-leave"
                }`}
              >
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
                  <Package size={22} />
                </div>
                <div>
                  <p className="font-bold text-zinc-100">{med.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Stock:{" "}
                    <span
                      className={
                        med.quantity < 10
                          ? "text-amber-400 font-bold"
                          : "text-emerald-400 font-bold"
                      }
                    >
                      {med.quantity} available
                    </span>{" "}
                    | Code: <span className="font-mono">{med.code}</span>
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

      // 3. No medicine matched (show only after processing finalized speech fails)
      if (!parsed.medicine) {
        setFeedbackMessage("");
        if (parsed.suggestions && parsed.suggestions.length > 0) {
          toast("Uncertain match. Tap a suggestion below.", { icon: "🔍" });
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
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Point of Sale
          </h1>
          <p className="text-zinc-400 mt-1">
            Process sales with real-time AI voice recognition
          </p>
        </div>

        {/* Voice Recognition Status */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-sm transition-all ${
            isListening
              ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.2)]"
              : "bg-zinc-900/80 border-zinc-800 text-zinc-400"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              isListening
                ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(248,113,113,0.8)]"
                : "bg-zinc-600"
            }`}
          ></div>
          <span className="font-medium text-sm">
            {isListening
              ? interimText
                ? `Speaking: "${interimText}"`
                : "Listening (en-IN)..."
              : "Voice input inactive"}
          </span>
        </div>
      </div>

      {/* Voice Error Notice if any */}
      {voiceError && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-zinc-200 mb-5">Add Item</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Search or Matched Medicine
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter medicine or speak..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleManualAdd();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-zinc-200 placeholder-zinc-500 shadow-inner"
                  />
                  <Search
                    size={18}
                    className="absolute left-3.5 top-3.5 text-zinc-500"
                  />
                </div>
              </div>

              {/* Feedback text */}
              {feedbackMessage && (
                <p className="text-xs font-medium text-emerald-400">
                  {feedbackMessage}
                </p>
              )}

              {/* Suggestions to Tap when confidence is low */}
              {suggestions.length > 0 && (
                <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-teal-400" />
                    Did you mean:
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                        className="text-xs px-3 py-1.5 bg-zinc-900 hover:bg-emerald-500/10 border border-zinc-700 hover:border-emerald-500/30 text-zinc-200 hover:text-emerald-400 rounded-lg transition-all text-left"
                      >
                        {sug.name} (${sug.price})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleManualAdd}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 border border-emerald-500/50"
                >
                  <Plus size={18} />
                  Add
                </button>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 border ${
                    isListening
                      ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(248,113,113,0.3)] border-red-500/50"
                      : "bg-teal-600 hover:bg-teal-500 text-zinc-950 shadow-[0_0_15px_rgba(20,184,166,0.2)] border-teal-500/50"
                  }`}
                >
                  <Mic size={18} />
                  {isListening ? "Stop" : "Speak"}
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                Smart Voice Guide (en-IN)
              </h3>
              <ul className="text-xs text-zinc-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <span>
                    <strong>Add item:</strong> "amx 250" or "please add pcm 500 to the cart"
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1 shrink-0"></div>
                  <span>
                    <strong>Check stock:</strong> "check stock of paracetamol five hundred"
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></div>
                  <span>
                    <strong>Remove:</strong> "remove pcm 650"
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                  <span>
                    <strong>Control:</strong> "clear cart" or "generate bill"
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Cart & Checkout */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-lg overflow-hidden flex flex-col h-[520px]">
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                <ShoppingCart size={20} className="text-emerald-400" />
                Current Cart
              </h2>
              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-zinc-400 hover:text-red-400 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1 bg-zinc-950/50 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-red-500/30"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 bg-zinc-950/20">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p className="font-medium text-zinc-400">Cart is empty</p>
                  <p className="text-sm mt-1">
                    Speak or search medicines to add
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-950/50 sticky top-0 border-b border-zinc-800 z-10">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center">
                        Qty
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Price
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">
                        Total
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-900/30">
                    {cart.map((item, index) => (
                      <tr
                        key={item._id || index}
                        className="hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-200">
                          {item.name}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="bg-zinc-950/50 border border-zinc-800 px-3 py-1 rounded-lg text-zinc-300 font-bold">
                            {item.qty}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-zinc-400">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-zinc-200">
                          ${(item.qty * item.price).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Checkout Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-md relative z-20">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-sm text-zinc-400 mb-1 font-medium">
                    Total Items
                  </p>
                  <p className="text-2xl font-bold text-zinc-200">
                    {totalItems}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400 mb-1 font-medium">
                    Grand Total
                  </p>
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={generateBill}
                disabled={cart.length === 0 || submitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 disabled:cursor-not-allowed text-zinc-950 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 border border-emerald-400/50 disabled:shadow-none disabled:transform-none"
              >
                {submitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Receipt size={24} />
                )}
                {submitting
                  ? "Processing Transaction..."
                  : "Complete Sale & Generate Bill"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;
