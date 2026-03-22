"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";

interface Vet {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  isActive: boolean;
  bookingFee: number;
}

export default function AdminVetsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchVets(token);
  }, [router]);

  const fetchVets = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5555/api/admin/vets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerify = async (id: string, current: boolean) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5555/api/admin/vets/${id}/verify`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setVets(vets.map(v => v._id === id ? { ...v, isActive: !current } : v));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading Vet Directory...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-[900] text-slate-900 tracking-tight">Verified Professionals</h1>
              <p className="text-slate-500 font-medium tracking-tight">Manage and verify veterinarian credentials.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vets.map((v) => (
              <div key={v._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl shadow-inner uppercase font-black text-blue-300">
                    {v.firstName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-[900] text-slate-900 leading-tight">Dr. {v.firstName} {v.lastName}</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Specialist in {v.specialization}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-bold border-b border-slate-50 pb-3">
                    <span className="text-slate-400 uppercase text-[10px] tracking-widest tracking-tighter">Availability</span>
                    <span className={`text-xs uppercase flex items-center gap-2 ${v.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${v.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                      {v.isActive ? "Online" : "Paused"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold border-b border-slate-50 pb-3">
                    <span className="text-slate-400 uppercase text-[10px] tracking-widest">Booking Fee</span>
                    <span className="text-slate-900 font-black">Rs. {v.bookingFee}</span>
                  </div>
                </div>

                <button 
                  onClick={() => toggleVerify(v._id, v.isActive)}
                  className={`w-full p-4 rounded-2xl font-[900] uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                    v.isActive 
                    ? "bg-slate-900 text-white hover:bg-black" 
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
                  }`}
                >
                  {v.isActive ? (
                    <>
                      <span>🛑</span>
                      Suspend Account
                    </>
                  ) : (
                    <>
                      <span>🛡️</span>
                      Verify Credentials
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
