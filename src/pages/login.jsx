import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { Activity, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 shadow-lg shadow-emerald-900/20">
          <Activity size={36} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-zinc-100 tracking-tight">
          Pharmly
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Sign in to your administration panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl shadow-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                  placeholder="admin@gmail.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl shadow-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-zinc-950 border-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950 rounded cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-zinc-400 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] text-sm font-semibold text-zinc-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-emerald-500 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  "Sign in to Dashboard"
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 border-t border-zinc-800 pt-6">
             <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
               <div className="flex flex-col items-center">
                 <h3 className="text-sm font-semibold text-emerald-400 mb-2">Test Credentials</h3>
                 <div className="text-sm text-zinc-400 space-y-1 text-center">
                   <p><span className="text-zinc-500 mr-2">Email:</span> <span className="text-zinc-300 font-mono bg-zinc-950 px-2 py-0.5 rounded">admin@gmail.com</span></p>
                   <p><span className="text-zinc-500 mr-2">Pass:</span> <span className="text-zinc-300 font-mono bg-zinc-950 px-2 py-0.5 rounded">123456</span></p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;