"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import { UserDetails } from "../components/UserDetails";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  createdAt?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Redirect veterinarians to vet dashboard
  if (user.role === "veterinarian") {
    router.push("/dashboard/vet");
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.firstName || user.email}!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Details Card */}
            <div className="lg:col-span-1">
              <UserDetails user={user} />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Appointments</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="text-2xl mb-2">🐾</div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Pets</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="text-2xl mb-2">❤️</div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Donations</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="rounded-lg border border-border bg-background p-4 text-left hover:bg-primary/5 hover:border-primary/30 transition-all">
                    <div className="text-2xl mb-2">📅</div>
                    <div className="font-semibold">Book Appointment</div>
                    <div className="text-sm text-muted-foreground">Schedule a vet visit</div>
                  </button>
                  <button className="rounded-lg border border-border bg-background p-4 text-left hover:bg-primary/5 hover:border-primary/30 transition-all">
                    <div className="text-2xl mb-2">🐾</div>
                    <div className="font-semibold">Add Pet</div>
                    <div className="text-sm text-muted-foreground">Register a new pet</div>
                  </button>
                  <button className="rounded-lg border border-border bg-background p-4 text-left hover:bg-primary/5 hover:border-primary/30 transition-all">
                    <div className="text-2xl mb-2">🆘</div>
                    <div className="font-semibold">Report Lost Pet</div>
                    <div className="text-sm text-muted-foreground">Help find missing pets</div>
                  </button>
                  <button className="rounded-lg border border-border bg-background p-4 text-left hover:bg-primary/5 hover:border-primary/30 transition-all">
                    <div className="text-2xl mb-2">❤️</div>
                    <div className="font-semibold">Donate</div>
                    <div className="text-sm text-muted-foreground">Support animal welfare</div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity</p>
                  <p className="text-sm mt-2">Your activity will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

