"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const userTypes = [
  { value: "pet_owner", label: "Pet Owner", icon: "🐾", description: "Manage your pets and appointments" },
  { value: "veterinarian", label: "Veterinarian", icon: "👨‍⚕️", description: "Manage your practice and patients" },
  { value: "shelter", label: "Shelter & NGO", icon: "🏠", description: "Manage rescues and donations" },
  { value: "pharmacy", label: "Pharmacy", icon: "💊", description: "Manage medicines and orders" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("pet_owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
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
        throw new Error(data.message || "Login failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect to dashboard
<<<<<<< Updated upstream
      router.push("/dashboard");
=======
      if (data.user.role === "veterinarian") {
        router.push("/dashboard/vet");
      } else {
        router.push("/dashboard");
      }
>>>>>>> Stashed changes
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">Sign in to your PetConnect account</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 shadow-xl">
          {/* User Type Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-foreground">
              I am a
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {userTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setUserType(type.value)}
                  className={`relative rounded-lg border-2 p-4 text-center transition-all duration-200 ${
                    userType === type.value
                      ? "border-primary bg-primary/10 shadow-md scale-105"
                      : "border-border hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
