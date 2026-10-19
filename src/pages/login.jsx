import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { Loader2, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "../utils/themeContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const fillDemoCredentials = () => {
    setEmail("demo@pharmly.com");
    setPassword("demo123");
    toast("Demo credentials filled", { icon: "✨" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        email: cleanEmail,
        password: cleanPassword,
      });

      if (response && response.success) {
        localStorage.setItem("adminToken", response.token);
        localStorage.setItem(
          "pharmlyUser",
          JSON.stringify({
            email: response.email || cleanEmail,
            role: response.role || (response.isDemo ? "demo" : "admin"),
            isDemo: !!response.isDemo,
          })
        );
        toast.success(response.isDemo ? "Welcome to Pharmly Demo!" : "Welcome back, Admin!");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(response?.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (error.status === 401) {
        toast.error("Invalid credentials. Use demo: demo@pharmly.com / demo123");
      } else if (
        error.name === "TypeError" ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError")
      ) {
        toast.error("Cannot connect to server. Please check backend connection.");
      } else {
        toast.error(error.message || "Login failed. Please check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--notion-bg)] text-[var(--notion-text)] flex flex-col justify-center py-10 px-4 sm:px-6 font-sans relative w-full">
      {/* Top right theme toggle (>= 40px tap target) */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <div className="sm:mx-auto w-full max-w-sm">
        {/* Logo / Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 flex items-center justify-center rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] text-base select-none">
            🏥
          </span>
          <span className="text-xl font-bold tracking-tight text-[var(--notion-text)]">
            Pharmly
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--notion-text)] mb-1">
          Log in
        </h1>
        <p className="text-xs text-[var(--notion-text-muted)] mb-6">
          Access your pharmacy dashboard, point of sale, and inventory.
        </p>

        {/* Form */}
        <form className="space-y-4 w-full" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-[var(--notion-text)] mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-sm text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:outline-none focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] transition-colors min-h-[42px]"
              placeholder="demo@pharmly.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[var(--notion-text)]"
              >
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-sm text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:outline-none focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] transition-colors min-h-[42px]"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded text-sm font-medium text-white bg-[var(--notion-blue)] hover:bg-[var(--notion-blue-hover)] focus:outline-none disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Callout with One-Click Fill */}
        <div className="mt-8 p-3.5 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] text-xs text-[var(--notion-text)] space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[var(--notion-text)] flex items-center gap-1.5">
              <span>🔑</span>
              <span>Demo Credentials</span>
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--notion-blue)] hover:underline cursor-pointer min-h-[36px] px-2"
            >
              <Sparkles size={13} />
              Auto-fill
            </button>
          </div>

          <div className="space-y-1 text-[var(--notion-text-muted)] font-mono text-[11px] bg-[var(--notion-bg)] p-2.5 rounded border border-[var(--notion-border-subtle)]">
            <p>
              Email: <span className="text-[var(--notion-text)] font-semibold">demo@pharmly.com</span>
            </p>
            <p>
              Password: <span className="text-[var(--notion-text)] font-semibold">demo123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;