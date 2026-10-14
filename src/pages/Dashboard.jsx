import { useState, useEffect } from "react";
import { Package, AlertTriangle, AlertOctagon, TrendingUp, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import toast from "react-hot-toast";

function Dashboard() {
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(false);
        // Fetch all data in parallel using the centralized API utility
        const [medicinesData, lowStockData, expiredData] = await Promise.all([
          api.get("/medicines"),
          api.get("/low-stock"),
          api.get("/expired-medicines"),
        ]);

        setTotalMedicines(medicinesData.length || 0);
        setLowStockCount(lowStockData.length || 0);
        setExpiredCount(expiredData.length || 0);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(true);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-red-500/20 p-6 shadow-lg">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
        <h2 className="text-xl font-bold text-zinc-200">Failed to load data</h2>
        <p className="text-zinc-400 mt-1">Please check your connection or try again later.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-2.5 rounded-xl font-medium transition-all border border-zinc-700 hover:border-zinc-600 hover:shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Medicines",
      value: totalMedicines,
      icon: <Package className="w-8 h-8 text-emerald-400" />,
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      link: "/inventory"
    },
    {
      title: "Low Stock Items",
      value: lowStockCount,
      icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/20",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]",
      link: "/alerts"
    },
    {
      title: "Expired Medicines",
      value: expiredCount,
      icon: <AlertOctagon className="w-8 h-8 text-red-400" />,
      bgColor: "bg-red-500/10",
      textColor: "text-red-400",
      borderColor: "border-red-500/20",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(248,113,113,0.15)]",
      link: "/alerts"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Dashboard Overview</h1>
          <p className="text-zinc-400 mt-1">Monitor Pharmly's key performance metrics</p>
        </div>
        <button 
          onClick={() => navigate('/billing')}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/50"
        >
          <TrendingUp size={18} />
          New Sale
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index}
            onClick={() => navigate(stat.link)}
            className={`bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 transition-all cursor-pointer group ${stat.glowColor} hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-1">{stat.title}</p>
                <h3 className="text-4xl font-bold text-zinc-100 tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3.5 rounded-xl ${stat.bgColor} ${stat.borderColor} border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-lg mt-8">
         <h2 className="text-lg font-bold text-zinc-200 mb-5 tracking-tight">Quick Actions</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button 
                onClick={() => navigate('/inventory')}
                className="flex items-center justify-center gap-3 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-300 font-medium transition-all hover:border-zinc-700 hover:shadow-lg group"
             >
                <Package size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                Manage Inventory
             </button>
             <button 
                onClick={() => navigate('/alerts')}
                className="flex items-center justify-center gap-3 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-300 font-medium transition-all hover:border-zinc-700 hover:shadow-lg group"
             >
                <AlertTriangle size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
                View Alerts
             </button>
         </div>
      </div>
    </div>
  );
}

export default Dashboard;
