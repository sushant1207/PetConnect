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
  { value: "veterinarian", label: "Veterinarian", icon: <VetIcon /> },
  { value: "shelter", label: "Shelter & NGO", icon: <ShelterIcon /> },
  { value: "pharmacy", label: "Pharmacy", icon: <PharmacyIcon /> },
];

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("pet_owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [otp, setOtp] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  async function onRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!acceptTerms) {
      setError("Please accept the Terms & Conditions to continue");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5555/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: userType,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Show OTP step
      setStep("verify");
      setSuccess("Account created successfully. Please check your email for the verification code.");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifySubmit(e: FormEvent) {
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

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect to dashboard
      if (data.user.role === "veterinarian") {
        router.push("/dashboard/vet");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Left side: Premium Image Display */}
      <div className="hidden lg:flex lg:w-1/2 relative group overflow-hidden h-full">
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10 transition-opacity duration-700 opacity-60 group-hover:opacity-40" />
        <img src="/auth-bg.png" alt="Happy Pets" className="w-full h-full object-cover transition-transform duration-1000 scale-100 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20" />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-30 text-white transform transition-transform duration-700 translate-y-0 text-left">
          <div className="w-14 h-14 bg-primary/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <span className="text-2xl">🐾</span>
          </div>
          <h2 className="text-4xl font-extrabold mb-3 tracking-tight leading-tight">Join our growing<br/>community.</h2>
          <p className="text-base font-medium text-white/80 max-w-md leading-relaxed">Connect with pet owners, veterinarians, pharmacies and shelters in one platform.</p>
        </div>
      </div>

      {/* Right side: Interactive Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 h-full overflow-hidden relative">
        <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-[480px] h-full flex flex-col justify-center relative z-10 overflow-y-auto custom-scrollbar px-2 py-4">
          <div className="mb-6 text-center lg:text-left shrink-0">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight text-slate-900">
              {step === "register" ? "Create Account" : "Verify Your Email"}
            </h1>
            <p className="text-slate-500 text-sm">
              {step === "register" ? "Join PetConnect to start connecting" : `We sent a code to ${email}`}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-100 relative overflow-hidden shrink-0">
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 flex items-center gap-2 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700 flex items-center gap-2 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {success}
              </div>
            )}

            {step === "register" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* User Type Selection */}
                <div className="mb-6">
                  <label className="mb-3 block text-xs font-black text-slate-400 uppercase tracking-widest">
                    Identify your role
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {userTypes.map((type) => {
                      const isSelected = userType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setUserType(type.value as any)}
                          className={`
                            flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300
                            ${isSelected 
                              ? "bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/5 -translate-y-0.5" 
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-800 border border-slate-100"
                            }
                          `}
                        >
                          <div className={`mb-1 transition-transform duration-300 ${isSelected ? "scale-105" : "scale-90"}`}>
                            {type.icon}
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-tighter text-center whitespace-nowrap">{type.label.split(' ')[0]}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={onRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                    />
                    <span className="text-xs font-semibold text-slate-600 leading-relaxed">
                      I agree to the <span className="text-slate-900">Terms & Conditions</span>.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !acceptTerms}
                    className="w-full mt-3 bg-slate-900 hover:bg-black text-white rounded-xl py-4 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Initializing..." : "Register Now"}
                  </button>
                </form>
              </div>
            )}

            {step === "verify" && (
              <div className="animate-in fade-in zoom-in-95 duration-500 py-4">
                <form onSubmit={onVerifySubmit} className="space-y-6">
                  <div>
                    <label className="mb-4 block text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                      Security Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-8 focus:ring-primary/5 rounded-[2rem] px-4 py-6 text-center text-5xl tracking-[0.5em] font-black outline-none transition-all text-slate-900"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-5 font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "Authenticating..." : "Complete Setup"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("register")}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                      ← Modify Details
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === "register" && (
              <div className="mt-6 pt-6 border-t border-slate-50 text-center shrink-0">
                <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">
                  Already a member?{" "}
                  <Link href="/login" className="font-black text-slate-900 hover:text-primary transition-colors underline underline-offset-4 decoration-2 decoration-slate-100 hover:decoration-primary/30 ml-1">
                    Sign In
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
