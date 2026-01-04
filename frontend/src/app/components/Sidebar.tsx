"use client";

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
    { icon: "📊", label: "Dashboard", href: role === "veterinarian" ? "/dashboard/vet" : "/dashboard" },
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
      { icon: "💊", label: "Orders", href: "/dashboard/pharmacy" },
      { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
    ];
  }

  return baseItems;
};

const roleLabels: Record<string, string> = {
  pet_owner: "Pet Owner",
  veterinarian: "Veterinarian",
  shelter: "Shelter & NGO",
  pharmacy: "Pharmacy",
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="w-64 h-screen border-r border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="border-b border-border p-6">
          <Link href={user.role === "veterinarian" ? "/dashboard/vet" : "/dashboard"} className="flex items-center gap-2">
            <div className="text-2xl">🐾</div>
            <div>
              <div className="font-bold text-lg">PetConnect</div>
              <div className="text-xs text-muted-foreground">Dashboard</div>
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 hover:border-destructive/30 hover:shadow-sm"
          >
            <span>Logout</span>
          </button>
          <p className="text-xs text-center text-muted-foreground">
            {user.firstName || user.email}
          </p>
        </div>
      </div>
    </aside>
  );
}

