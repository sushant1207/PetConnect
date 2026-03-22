"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // States: 'request' or 'reset'
  const [step, setStep] = useState<"request" | "reset">("request");

  async function onRequestSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5555/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process request");
      }

      setStep("reset");
      setSuccess("If an account exists, a reset code has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function onResetSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5555/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess("Password has been reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Invalid or expired reset code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background font-sans overflow-hidden">
      {/* Left side: Premium Image Display */}
      <div className="hidden lg:flex lg:w-1/2 relative group overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10 transition-opacity duration-700 opacity-60 group-hover:opacity-40" />
        <img src="/auth-bg.png" alt="Happy Pets" className="w-full h-full object-cover transition-transform duration-1000 scale-100 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20" />
        <div className="absolute bottom-0 left-0 right-0 p-16 z-30 text-white transform transition-transform duration-700 translate-y-0 text-left">
          <div className="w-16 h-16 bg-primary/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
            <span className="text-3xl">🐾</span>
          </div>
          <h2 className="text-5xl font-extrabold mb-4 tracking-tight leading-tight">Welcome back.</h2>
          <p className="text-lg font-medium text-white/80 max-w-md leading-relaxed">Let's get you back into your account securely.</p>
        </div>
      </div>

      {/* Right side: Interactive Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        {/* Subtle decorative background blur element */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-[440px] relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 tracking-tight text-slate-900">
              Reset Password
            </h1>
            <p className="text-slate-500 text-lg">
              {step === "request" 
                ? "Enter your email to receive a reset code" 
                : "Enter the code sent to your email and a new password"}
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
            {error && (
              <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-3 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 flex items-center gap-3 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {success}
              </div>
            )}

          {step === "request" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={onRequestSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-4 font-bold shadow-[0_8px_20px_-8px_rgba(var(--primary),0.5)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Reset Code"}
                  </button>
                  <div className="text-center pt-2">
                    <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      ← Back to Login
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          )}

          {step === "reset" && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <form onSubmit={onResetSubmit} className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700 text-center">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-5 text-center text-4xl tracking-widest font-mono outline-none transition-all text-slate-900 font-bold"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111] hover:bg-black text-white rounded-xl py-4 font-bold shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("request")}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      ← Use different email
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
