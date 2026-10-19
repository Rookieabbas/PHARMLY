import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { Loader2, Sun, Moon } from "lucide-react";
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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, password });

      if (response.success) {
        localStorage.setItem("adminToken", response.token);
        toast.success("Welcome back, Admin!");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(response.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--notion-bg)] text-[var(--notion-text)] flex flex-col justify-center py-12 px-4 sm:px-6 font-sans relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)] transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
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
        <form className="space-y-4" onSubmit={handleLogin}>
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
              className="w-full px-3 py-1.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-sm text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:outline-none focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] transition-colors"
              placeholder="admin@gmail.com"
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
              className="w-full px-3 py-1.5 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded text-sm text-[var(--notion-text)] placeholder-[var(--notion-text-light)] focus:outline-none focus:border-[var(--notion-blue)] focus:ring-1 focus:ring-[var(--notion-blue)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-1.5 px-3 rounded text-sm font-medium text-white bg-[var(--notion-blue)] hover:bg-[var(--notion-blue-hover)] focus:outline-none disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Callout */}
        <div className="mt-8 p-3 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] text-xs text-[var(--notion-text)]">
          <p className="font-semibold text-[var(--notion-text)] mb-1 flex items-center gap-1.5">
            <span>🔑</span>
            <span>Demo Credentials</span>
          </p>
          <div className="space-y-0.5 text-[var(--notion-text-muted)] font-mono text-[11px]">
            <p>Email: <span className="text-[var(--notion-text)]">admin@gmail.com</span></p>
            <p>Password: <span className="text-[var(--notion-text)]">123456</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;