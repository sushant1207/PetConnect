"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

interface Pet {
  _id: string;
  petId: string;
  name: string;
  species: string;
  isActive?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [petActionLoadingId, setPetActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [petError, setPetError] = useState("");
  const [petSuccess, setPetSuccess] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFirstName(parsedUser.firstName || "");
      setLastName(parsedUser.lastName || "");
      setPhone(parsedUser.phone || "");
      setAddress(parsedUser.address || "");
      void fetchPets(parsedUser._id);
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPets = async (ownerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/pets/owner/${ownerId}?includeInactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch pets");
      }
      setPets(data.pets || []);
    } catch (err: any) {
      setPetError(err.message || "Failed to fetch pets");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update local storage
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setSuccess("Profile settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivatePet = async (pet: Pet) => {
    if (!user) return;
    const confirmed = window.confirm(`Mark ${pet.name} as inactive? This hides it from active pet lists.`);
    if (!confirmed) return;

    setPetError("");
    setPetSuccess("");
    setPetActionLoadingId(pet._id);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/pets/${pet._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: false }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to make pet inactive");
      }

      setPetSuccess(`${pet.name} is now inactive.`);
      await fetchPets(user._id);
    } catch (err: any) {
      setPetError(err.message || "Failed to make pet inactive");
    } finally {
      setPetActionLoadingId(null);
    }
  };

  const handleDeletePet = async (pet: Pet) => {
    if (!user) return;
    const confirmed = window.confirm(`Delete ${pet.name} permanently? This action cannot be undone.`);
    if (!confirmed) return;

    setPetError("");
    setPetSuccess("");
    setPetActionLoadingId(pet._id);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/pets/${pet._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete pet");
      }

      setPetSuccess(`${pet.name} was deleted.`);
      await fetchPets(user._id);
    } catch (err: any) {
      setPetError(err.message || "Failed to delete pet");
    } finally {
      setPetActionLoadingId(null);
    }
  };

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

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information and contact details</p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-100 border border-green-200 p-3 text-sm text-green-800">
                {success}
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Doe"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg border border-input bg-muted px-4 py-3 outline-none text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your complete address"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-1">Pet Data Management</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You can deactivate a pet (soft delete) or permanently delete pet data.
              </p>

              {petError && (
                <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {petError}
                </div>
              )}

              {petSuccess && (
                <div className="mb-4 rounded-lg bg-green-100 border border-green-200 p-3 text-sm text-green-800">
                  {petSuccess}
                </div>
              )}

              {pets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No pet records found.
                </div>
              ) : (
                <div className="space-y-3">
                  {pets.map((pet) => {
                    const isBusy = petActionLoadingId === pet._id;
                    const inactive = pet.isActive === false;

                    return (
                      <div key={pet._id} className="rounded-lg border border-border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{pet.name}</p>
                          <p className="text-sm text-muted-foreground">{pet.species} • ID: {pet.petId}</p>
                          <p className={`text-xs mt-1 ${inactive ? "text-amber-700" : "text-green-700"}`}>
                            {inactive ? "Inactive" : "Active"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeactivatePet(pet)}
                            disabled={isBusy || inactive}
                            className="rounded-lg border border-amber-500 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
                            {isBusy ? "Please wait..." : inactive ? "Already Inactive" : "Make Inactive"}
                          </button>
                          <button
                            onClick={() => handleDeletePet(pet)}
                            disabled={isBusy}
                            className="rounded-lg border border-destructive px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            {isBusy ? "Please wait..." : "Delete Permanently"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-semibold hover:bg-primary/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
