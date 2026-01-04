"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface Pet {
  _id: string;
  petId: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  color?: string;
  createdAt: string;
}

export default function PetsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

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
      fetchPets(parsedUser._id);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPets = async (ownerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/pets/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setPets(data.pets || []);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Pets</h1>
              <p className="text-muted-foreground">Manage your registered pets</p>
            </div>
            <Link
              href="/dashboard/pets/register"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Register New Pet
            </Link>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-border bg-card">
              <div className="text-4xl mb-4">🐾</div>
              <h3 className="text-xl font-semibold mb-2">No pets registered yet</h3>
              <p className="text-muted-foreground mb-6">Register your first pet to get started</p>
              <Link
                href="/dashboard/pets/register"
                className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Register Your First Pet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div
                  key={pet._id}
                  className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{pet.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {pet.petId}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPet(pet)}
                      className="text-primary hover:text-primary/80"
                      title="View QR Code"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Species:</span>
                      <span className="font-medium capitalize">{pet.species}</span>
                    </div>
                    {pet.breed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Breed:</span>
                        <span className="font-medium">{pet.breed}</span>
                      </div>
                    )}
                    {pet.age && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{pet.age} years</span>
                      </div>
                    )}
                    {pet.gender && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium capitalize">{pet.gender}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* QR Code Modal */}
          {selectedPet && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPet(null)}>
              <div className="bg-card rounded-lg p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-2">{selectedPet.name}&apos;s QR Code</h3>
                <p className="text-muted-foreground mb-6">Pet ID: {selectedPet.petId}</p>
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG value={selectedPet.petId} size={200} />
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Scan this QR code to access {selectedPet.name}&apos;s medical records
                </p>
                <button
                  onClick={() => setSelectedPet(null)}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

