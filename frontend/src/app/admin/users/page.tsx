"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginIp?: string;
  lastLoginDate?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
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
    fetchUsers(token);
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5555/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5555/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading User Directory...</div>;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-[900] text-slate-900 tracking-tight">Access Control</h1>
              <p className="text-slate-500 font-medium">Monitor logins and manage platform availability.</p>
            </div>
          </header>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Identified User</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Role Type</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Last Access (IP)</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 uppercase">
                          {u.firstName?.[0] || u.email[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.firstName} {u.lastName || ""}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{u.role}</span>
                    </td>
                    <td className="px-8 py-5">
                      {u.lastLoginDate ? (
                        <div>
                          <p className="text-xs font-bold text-slate-700">{new Date(u.lastLoginDate).toLocaleString()}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">IP: {u.lastLoginIp || "Unknown"}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Never Logged In</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => toggleStatus(u._id)}
                        className={`text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all border ${
                          u.status === "active" 
                          ? "text-red-500 border-red-100 hover:bg-red-50" 
                          : "text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                        }`}
                      >
                        {u.status === "active" ? "Revoke Access" : "Grant Access"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
