"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";

interface Pharmacy {
  _id: string;
  firstName: string;
  email: string;
  status: string;
}

interface Order {
  _id: string;
  userName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminPharmaciesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    fetchPharmacies(token);
  }, [router]);

  const fetchPharmacies = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5555/api/admin/pharmacies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (id: string) => {
    const token = localStorage.getItem("token");
    setSelectedPharmacy(id);
    try {
      const res = await fetch(`http://localhost:5555/api/admin/pharmacies/${id}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-10 text-center font-bold">Loading Pharmacy Network...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar transition-all">
        <div className="max-w-[1400px] mx-auto">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-[900] text-slate-900 tracking-tight">Pharmacy Network</h1>
              <p className="text-slate-500 font-medium tracking-tight">Global commerce and order audit system.</p>
            </div>
            {selectedPharmacy && (
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all w-64 shadow-sm"
                />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Pharmacy List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-4">Partner Pharmacies</h2>
              {pharmacies.map((p) => (
                <button 
                  key={p._id}
                  onClick={() => fetchOrders(p._id)}
                  className={`w-full text-left p-6 rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                    selectedPharmacy === p._id 
                    ? "bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20" 
                    : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className={`text-xl font-[900] ${selectedPharmacy === p._id ? "text-white" : "text-slate-900"}`}>{p.firstName}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedPharmacy === p._id ? "text-slate-400" : "text-slate-400"}`}>{p.email}</div>
                  <div className="mt-6 flex items-center justify-between">
                     <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                       p.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                     }`}>
                       {p.status || "ACTIVE"}
                     </span>
                     <span className={`text-xl font-bold transition-transform duration-300 ${selectedPharmacy === p._id ? "text-white translate-x-1" : "text-slate-200 group-hover:translate-x-1"}`}>→</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Order Audit */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] border border-slate-100 p-10 h-full min-h-[600px]">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-[900] text-slate-900 flex items-center gap-3">
                    <span className="w-2.5 h-10 bg-primary rounded-full"></span>
                    Order Ledger
                  </h2>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{filteredOrders.length} Records Match</div>
                </div>

                {!selectedPharmacy ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">📦</div>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Select a pharmacy to view audit trail</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No matching orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((o) => (
                      <div key={o._id} className="p-7 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-slate-900 transition-all cursor-pointer relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-2 transition-all ${
                          o.status === "delivered" ? "bg-emerald-500" : 
                          o.status === "pending" ? "bg-amber-500" : 
                          o.status === "cancelled" ? "bg-red-500" : "bg-blue-500"
                        }`}></div>
                        
                        <div>
                          <p className="font-[900] text-xl tracking-tight text-slate-900 group-hover:text-white transition-colors">{o.userName}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {o._id.slice(-8)}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(o.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-[1000] text-slate-900 group-hover:text-white transition-colors">Rs. {o.totalAmount.toLocaleString()}</p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            o.status === "delivered" ? "bg-emerald-50 text-emerald-600" : 
                            o.status === "pending" ? "bg-amber-50 text-amber-600" : 
                            o.status === "cancelled" ? "bg-red-50 text-red-600" : 
                            "bg-blue-50 text-blue-600"
                          } group-hover:bg-white/10 group-hover:text-white transition-all`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
