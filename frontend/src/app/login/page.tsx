"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Premium sleek SVG icons for the roles
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const VetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/><circle cx="8" cy="4" r="2"/></svg>;
const ShelterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PharmacyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;

const userTypes = [
  { value: "pet_owner", label: "Pet Owner", icon: <UserIcon /> },
  { value: "veterinarian", label: "Vet", icon: <VetIcon /> },
  { value: "shelter", label: "Shelter & NGO", icon: <ShelterIcon /> },
  { value: "pharmacy", label: "Pharmacy", icon: <PharmacyIcon /> },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("pet_owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // States: 'password' (default), 'request_otp', 'verify_otp'
  const [step, setStep] = useState<"password" | "request_otp" | "verify_otp">("password");
  const [otp, setOtp] = useState("");

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5555/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          setSuccess("Please verify your email to log in. We've sent a code.");
          setStep("verify_otp");
          return;
        }
        throw new Error(data.message || "Login failed");
      }

      finishLogin(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onRequestOtpSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email first");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5555/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to request OTP");
      }

      setStep("verify_otp");
      setSuccess("A verification code has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5555/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      finishLogin(data);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  }

  function finishLogin(data: any) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    if (data.user.role === "veterinarian") {
      router.push("/dashboard/vet");
    } else if (data.user.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
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
          <h2 className="text-5xl font-extrabold mb-4 tracking-tight leading-tight">Your pet's health,<br/>simplified.</h2>
          <p className="text-lg font-medium text-white/80 max-w-md leading-relaxed">Join the most trusted network of veterinarians, pharmacies, shelters, and pet lovers.</p>
        </div>
      </div>

      {/* Right side: Interactive Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 relative">
        {/* Subtle decorative background blur element */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-[420px] relative z-10">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight text-slate-900">
              {step === "verify_otp" ? "Verify Code" : "Welcome Back"}
            </h1>
            <p className="text-slate-500 text-base">
              {step === "verify_otp" ? `We sent a code to ${email}` : "Sign in to your PetConnect account"}
            </p>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
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

            {step === "password" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* User Type Selection */}
                <div className="mb-6">
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    I am a...
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {userTypes.map((type) => {
                      const isSelected = userType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setUserType(type.value)}
                          className={`
                            flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300
                            ${isSelected 
                              ? "bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10 -translate-y-1" 
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-100"
                            }
                          `}
                        >
                          <div className={`mb-1 transition-transform duration-300 ${isSelected ? "scale-110" : "scale-100"}`}>
                            {type.icon}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-center">{type.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>   

                <form onSubmit={onPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-slate-700">
                        Password
                      </label>
                      <Link href="/reset-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                        Forgot Password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#111] hover:bg-black text-white rounded-xl py-3.5 font-bold shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.6)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {loading ? "Authenticating..." : "Sign In securely"}
                    </button>
                    
                    <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold">OR</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep("request_otp")}
                      className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl py-3.5 font-bold transition-all active:scale-[0.98]"
                    >
                      Sign In with Magic Code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === "request_otp" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <form onSubmit={onRequestOtpSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                      placeholder="john@example.com"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      We'll send a secure 6-digit code to this email to sign you in.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3.5 font-bold shadow-[0_8px_20px_-8px_rgba(var(--primary),0.5)] hover:shadow-[0_12px_24px_-8px_rgba(var(--primary),0.6)] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Magic Code"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setStep("password")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2"
                    >
                      ← Back to Password Login
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === "verify_otp" && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <form onSubmit={onVerifyOtpSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 text-center">
                      Enter your 6-digit verification code
                    </label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-4 text-center text-4xl tracking-[0.5em] font-mono outline-none transition-all text-slate-900 font-bold"
                      placeholder="••••••"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3.5 font-bold shadow-[0_8px_20px_-8px_rgba(var(--primary),0.5)] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </button>
                    
                    <div className="flex items-center justify-between px-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setStep("password")}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={onRequestOtpSubmit}
                        disabled={loading}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

          {step !== "verify_otp" && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Don't have an account?{" "}
                <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
