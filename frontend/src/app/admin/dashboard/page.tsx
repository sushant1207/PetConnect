"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";

interface Analytics {
  stats: {
    users: number;
    doctors: number;
    appointments: number;
    orders: number;
    pendingVets: number;
    donations: number;
    systemHealth: string;
    resources: {
      cpu: number;
      memory: number;
      disk: number;
    }
  };
  recentActivities: {
    users: any[];
    orders: any[];
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      router.push("/admin/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchStats(token);
    const interval = setInterval(() => fetchStats(token), 10000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5555/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 font-black text-center animate-pulse tracking-widest uppercase text-slate-400">Syncing Live Cluster...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar user={JSON.parse(localStorage.getItem("user") || "{}")} />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar transition-all duration-700">
        <div className="max-w-[1400px] mx-auto">
          {/* Real-time Header */}
          <header className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-100 shadow-sm">Live System Cluster v4.0</p>
              <h1 className="text-6xl font-[1000] text-slate-900 tracking-tighter leading-none">PetConnect Control</h1>
              <p className="text-slate-400 font-bold tracking-tight text-xl mt-4 max-w-lg">Advanced real-time analytics and infrastructure orchestration.</p>
            </div>
            <div className="text-right">
               <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-50">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl shadow-inner">⚡</div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Health</p>
                    <p className="text-3xl font-[1000] text-slate-900 tracking-tighter">{data?.stats.systemHealth}%</p>
                  </div>
               </div>
            </div>
          </header>

          {/* Infrastructure Health & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              { label: "Total Platform Users", value: data?.stats.users, icon: "👥", color: "indigo" },
              { label: "Verified Veterinarians", value: data?.stats.doctors, icon: "🩺", color: "blue" },
              { label: "Ongoing Appointments", value: data?.stats.appointments, icon: "📅", color: "amber" },
              { label: "Pharmacy Revenue", value: `Rs. ${data?.stats.donations.toLocaleString()}`, icon: "💰", color: "emerald" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[3.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-150 transition-transform duration-700`}></div>
                <div className="text-3xl mb-6 relative z-10">{stat.icon}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">{stat.label}</p>
                <p className="text-3xl font-[1000] text-slate-900 tracking-tighter relative z-10">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-10">
            {/* Live Threads - Activity Feed */}
            <div>
               <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col h-full h-full">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="w-1.5 h-10 bg-indigo-600 rounded-full"></span>
                       Live Activity Stream
                    </div>
                    <span className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] italic">Updated 10s ago</span>
                  </h3>
                  
                  <div className="space-y-4">
                     {data?.recentActivities.users.map((u, i) => (
                       <div key={i} className="flex items-center justify-between p-6 rounded-[2.5rem] bg-slate-50 hover:bg-white border-2 border-transparent hover:border-slate-100 transition-all group">
                         <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center text-xl uppercase font-black text-slate-300">
                             {u.firstName?.[0] || u.email[0]}
                           </div>
                           <div>
                             <p className="font-extrabold text-slate-900 tracking-tight leading-none mb-1">{u.firstName} {u.lastName || ""}</p>
                             <div className="flex items-center gap-3">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.role}</span>
                               <span className="text-slate-200 text-[8px]">•</span>
                               <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">New Session</span>
                             </div>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(u.createdAt).toLocaleTimeString()}</p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">IP: {u.lastLoginIp || "0.0.0.0"}</p>
                         </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
