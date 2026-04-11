"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";

interface Setting {
  _id: string;
  key: string;
  value: any;
  label: string;
  description: string;
  category: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/admin/login");
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUser(parsed);
    fetchSettings(token);
  }, [router]);

  const fetchSettings = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5555/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, newValue: any) => {
    const token = localStorage.getItem("token");
    setUpdating(key);
    try {
      const res = await fetch("http://localhost:5555/api/admin/settings", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ key, value: newValue }),
      });
      if (res.ok) {
        setSettings(settings.map(s => s.key === key ? { ...s, value: newValue } : s));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="p-12 text-center font-bold tracking-widest uppercase animate-pulse text-slate-400">Booting Infrastructure Parameters...</div>;

  const securitySettings = settings.filter(s => s.category === "security" && s.key !== "ip_restriction");
  const commerceSettings = settings.filter(s => s.category === "commerce");

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar transition-all duration-500">
        <div className="max-w-[850px] mx-auto">
          <header className="mb-14">
            <h1 className="text-6xl font-[1000] text-slate-900 tracking-tighter mb-4">Core Controls</h1>
            <p className="text-slate-400 font-bold tracking-tight text-xl">Dynamic governance and platform parameters.</p>
          </header>

          <div className="space-y-12">
            {/* Dynamic Security Section */}
            <div className="bg-white p-12 rounded-[4rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.04)] border border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">🛡️</div>
                Security Protocol
              </h2>
              <div className="space-y-5">
                {securitySettings.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-slate-100 transition-all group relative">
                    {updating === item.key && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                      </div>
                    )}
                    <div className="flex items-center gap-6">
                      <div className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                        {item.key === "ip_restriction" ? "🌐" : "📝"}
                      </div>
                      <div>
                        <p className="font-[900] text-slate-900 text-lg tracking-tight mb-0.5">{item.label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.value ? "text-indigo-500" : "text-slate-300"}`}>
                        {item.value ? "ENABLED" : "DISABLED"}
                      </span>
                      <button 
                        onClick={() => updateSetting(item.key, !item.value)}
                        className={`w-16 h-9 rounded-full relative transition-all shadow-lg ${item.value ? "bg-indigo-600 shadow-indigo-100" : "bg-slate-200 shadow-slate-100"}`}
                      >
                        <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${item.value ? "right-1.5" : "left-1.5"}`}></div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Commerce Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {commerceSettings.map((item) => (
                <div key={item.key} className="bg-[#0f1115] p-12 rounded-[4rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-indigo-600 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000"></div>
                   <div className="relative z-10 text-center">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{item.label}</p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <input 
                          type="number"
                          step="0.1"
                          value={item.value}
                          onChange={(e) => updateSetting(item.key, parseFloat(e.target.value))}
                          className="bg-white/5 border-none text-white font-[1000] text-7xl tracking-tighter w-40 text-center focus:outline-none focus:ring-0"
                        />
                        <span className="text-3xl opacity-50 text-white font-black">%</span>
                      </div>
                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest bg-indigo-400/10 inline-block px-4 py-1.5 rounded-full border border-indigo-400/20">{item.description}</p>
                   </div>
                </div>
              ))}

            </div>
            
            <p className="text-center font-black text-slate-200 text-[10px] uppercase tracking-[0.5em] pt-10 select-none">PetConnect Dynamic Governance v2.5</p>
          </div>
        </div>
      </main>
    </div>
  );
}
