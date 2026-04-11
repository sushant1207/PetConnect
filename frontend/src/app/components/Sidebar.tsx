"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface SidebarProps {
  user: User;
}

const getMenuItems = (role: string) => {
  const baseItems = [
    { icon: "📊", label: "Dashboard", href: role === "veterinarian" ? "/dashboard/vet" : role === "admin" ? "/admin/dashboard" : "/dashboard" },
  ];

  if (role === "pet_owner") {
    return [
      ...baseItems,
      { icon: "🐾", label: "My Pets", href: "/dashboard/pets" },
      { icon: "📅", label: "Appointments", href: "/dashboard/appointments" },
      { icon: "🆘", label: "Lost & Found", href: "/dashboard/lost-found" },
      { icon: "❤️", label: "Donations", href: "/dashboard/donations" },
      { icon: "💊", label: "Pharmacy", href: "/dashboard/pharmacy" },
      { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
    ];
  }

  if (role === "veterinarian") {
    return [
      ...baseItems,
      { icon: "⚙️", label: "Settings", href: "/dashboard/vet/settings" },
    ];
  }

  if (role === "shelter") {
    return [
      ...baseItems,
      { icon: "🆘", label: "Lost & Found", href: "/dashboard/lost-found" },
      { icon: "❤️", label: "Donations", href: "/dashboard/donations" },
      { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
    ];
  }

  if (role === "pharmacy") {
    return [
      ...baseItems,
      { icon: "💊", label: "Products", href: "/dashboard/pharmacy/products" },
      { icon: "📦", label: "Orders", href: "/dashboard/pharmacy/orders" },
      { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
    ];
  }

  if (role === "admin") {
    return [
      ...baseItems,
      { icon: "👥", label: "Users", href: "/admin/users" },
      { icon: "🩺", label: "Vets", href: "/admin/vets" },
      { icon: "💊", label: "Pharmacies", href: "/admin/pharmacies" },
      { icon: "⚙️", label: "Settings", href: "/admin/settings" },
    ];
  }

  return baseItems;
};

const roleLabels: Record<string, string> = {
  pet_owner: "Pet Owner",
  veterinarian: "Veterinarian",
  shelter: "Shelter & NGO",
  pharmacy: "Pharmacy",
  admin: "Administrator",
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);

  const handleLogout = () => {
    if (logoutCountdown !== null) return;
    setLogoutCountdown(5);
  };

  useEffect(() => {
    if (logoutCountdown === null) return;

    if (logoutCountdown === 0) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      localStorage.removeItem("isUsernameSet");
      router.push("/login");
      setLogoutCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setLogoutCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [logoutCountdown, router]);

  const renderSidebarContent = (isMobile = false) => (
    <>
        {/* Logo/Header */}
        <div className="border-b border-border p-6">
          <Link
            href={user.role === "veterinarian" ? "/dashboard/vet" : user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
            className="flex items-center gap-2"
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <div className="text-2xl">🐾</div>
            <div>
              <div className="font-bold text-lg">PetConnect</div>
              <div className="text-xs text-muted-foreground">{user.role === "admin" ? "Admin Panel" : "Dashboard"}</div>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {(user.firstName?.[0] || user.email[0]).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </div>
              <div className="text-xs text-muted-foreground">
                {roleLabels[user.role] || user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {getMenuItems(user.role).map((item) => {
              const isActive = pathname === item.href || (item.href === "/dashboard/vet" && pathname.startsWith("/dashboard/vet"));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-4 space-y-2">
          <button
            onClick={handleLogout}
            disabled={logoutCountdown !== null}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 hover:border-destructive/30 hover:shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{logoutCountdown !== null ? `Logging out in ${logoutCountdown}s...` : "Logout"}</span>
          </button>
          <p className="text-xs text-center text-muted-foreground">
            {user.firstName || user.email}
          </p>
        </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm"
        aria-label="Open menu"
      >
        ☰
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card/95 backdrop-blur-sm">
            <div className="flex h-full flex-col">
              <div className="flex justify-end p-3 border-b border-border">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border"
                  aria-label="Close menu"
                >
                  X
                </button>
              </div>
              {renderSidebarContent(true)}
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden md:block w-64 h-screen border-r border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex h-full flex-col">{renderSidebarContent(false)}</div>
      </aside>
    </>
  );
}

