"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/Sidebar";
import { QRCodeSVG } from "qrcode.react";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export default function RegisterPetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [petId, setPetId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    species: "dog" as "dog" | "cat" | "bird" | "rabbit" | "other",
    breed: "",
    age: "",
    gender: "unknown" as "male" | "female" | "unknown",
    color: "",
    microchipped: false,
    notes: "",
  });

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
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5555/api/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId: user?._id,
          ...formData,
          age: formData.age ? parseInt(formData.age) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register pet");
      }

      setPetId(data.pet.petId);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
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

  if (success && petId) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg border border-border bg-card p-8 shadow-lg text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold mb-2">Pet Registered Successfully!</h1>
              <p className="text-muted-foreground mb-8">
                {formData.name} has been registered with Pet ID: <strong>{petId}</strong>
              </p>
              <div className="flex justify-center mb-8">
                <div className="bg-white p-6 rounded-lg">
                  <QRCodeSVG value={petId} size={250} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Save this QR code for quick access to {formData.name}&apos;s medical records
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/dashboard/pets")}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  View All Pets
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setPetId("");
                    setFormData({
                      name: "",
                      species: "dog",
                      breed: "",
                      age: "",
                      gender: "unknown",
                      color: "",
                      microchipped: false,
                      notes: "",
                    });
                  }}
                  className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-primary/5"
                >
                  Register Another Pet
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Register New Pet</h1>
            <p className="text-muted-foreground">Add your pet to PetConnect and get a unique QR code</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">Pet Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter pet name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Species *</label>
                <select
                  required
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value as any })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Breed</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g., Golden Retriever"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Age (years)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g., 3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g., Brown, White, Black"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="microchipped"
                checked={formData.microchipped}
                onChange={(e) => setFormData({ ...formData, microchipped: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="microchipped" className="text-sm font-medium">
                Microchipped
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Any additional information about your pet..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/pets")}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-semibold hover:bg-primary/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Registering..." : "Register Pet"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

