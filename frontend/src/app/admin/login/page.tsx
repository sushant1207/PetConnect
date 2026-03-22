"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5555/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      if (data.user.role !== "admin") {
        throw new Error("Access denied. Admin account required.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_50%)]" />
      
      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2rem] mb-6 border border-primary/20 backdrop-blur-sm shadow-2xl">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Admin Terminal</h1>
          <p className="text-slate-400 font-medium">Internal access only • PetConnect Control</p>
        </div>

        <div className="bg-[#141417] rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/5 backdrop-blur-xl">
          {error && (
            <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center gap-3 font-medium animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={onLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Admin ID / Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-4 text-white outline-none transition-all placeholder:text-slate-600 font-medium"
                placeholder="admin@petconnect.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Access Key / Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-4 text-white outline-none transition-all placeholder:text-slate-600 font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-slate-200 rounded-2xl py-4 font-bold shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-4 flex items-center justify-center gap-2 group"
            >
              {loading ? "Authenticating Terminal..." : "Initialize Access"}
              {!loading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-white transition-all">
              Standard User Portal
            </Link>
          </div>
        </div>
        
        <p className="text-center mt-8 text-xs text-slate-600 font-semibold tracking-widest uppercase italic">
          Authorized personnel only • PetConnect Infrastructure
        </p>
      </div>
    </div>
  );
}
