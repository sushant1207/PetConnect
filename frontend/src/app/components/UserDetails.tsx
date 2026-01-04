"use client";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  createdAt?: string;
  phone?: string;
  address?: string;
}

interface UserDetailsProps {
  user: User;
}

const roleLabels: Record<string, string> = {
  pet_owner: "Pet Owner",
  veterinarian: "Veterinarian",
  shelter: "Shelter & NGO",
  pharmacy: "Pharmacy",
};

const roleIcons: Record<string, string> = {
  pet_owner: "🐾",
  veterinarian: "👨‍⚕️",
  shelter: "🏠",
  pharmacy: "💊",
};

export function UserDetails({ user }: UserDetailsProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">User Details</h2>
      
      <div className="space-y-4">
        {/* Avatar/Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
            {roleIcons[user.role] || "👤"}
          </div>
        </div>

        {/* Name */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Name</div>
          <div className="text-sm font-semibold">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name || "Not set"}
          </div>
        </div>

        {/* Email */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Email</div>
          <div className="text-sm">{user.email}</div>
        </div>

        {/* Role */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Role</div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <span>{roleIcons[user.role] || "👤"}</span>
            <span>{roleLabels[user.role] || user.role}</span>
          </div>
        </div>

        {/* Phone */}
        {user.phone && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Phone</div>
            <div className="text-sm">{user.phone}</div>
          </div>
        )}

        {/* Address */}
        {user.address && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Address</div>
            <div className="text-sm">{user.address}</div>
          </div>
        )}

        {/* Member Since */}
        {user.createdAt && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Member Since</div>
            <div className="text-sm">{formatDate(user.createdAt)}</div>
          </div>
        )}

        {/* Edit Button */}
        <button className="w-full mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-all hover:bg-primary/5 hover:border-primary/30">
          Edit Profile
        </button>
      </div>
    </div>
  );
}

