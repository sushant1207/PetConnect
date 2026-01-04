"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/Sidebar";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  experience: number;
  clinicAddress?: string;
  bookingFee: number;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function BookAppointmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    petId: "",
    reason: "",
    locationPreference: "clinic" as "clinic" | "home_visit",
    address: "",
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
      fetchDoctors();
      fetchPets(parsedUser._id);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("http://localhost:5555/api/doctors");
      const data = await response.json();
      if (response.ok) {
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

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

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot("");
    setAvailableSlots([]);
  };

  const handleDateChange = async (date: Value) => {
    setSelectedDate(date);
    setSelectedSlot("");
    if (selectedDoctor && date instanceof Date) {
      await fetchAvailability(selectedDoctor._id, date);
    }
  };

  const fetchAvailability = async (doctorId: string, date: Date) => {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch(
        `http://localhost:5555/api/appointments/availability?doctorId=${doctorId}&date=${dateStr}`
      );
      const data = await response.json();
      if (response.ok) {
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedDoctor || !selectedDate || !selectedSlot || !formData.petId || !formData.reason) {
      setError("Please fill in all required fields");
      return;
    }

    const selectedPet = pets.find((p) => p._id === formData.petId);
    if (!selectedPet) {
      setError("Please select a pet");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const dateStr = selectedDate instanceof Date ? selectedDate.toISOString().split("T")[0] : "";

      const response = await fetch("http://localhost:5555/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: user?._id,
          doctor: selectedDoctor._id,
          date: dateStr,
          timeSlot: selectedSlot,
          petName: selectedPet.name,
          petType: selectedPet.species,
          reason: formData.reason,
          locationPreference: formData.locationPreference,
          address: formData.locationPreference === "home_visit" ? formData.address : undefined,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to book appointment");
      }

      router.push("/dashboard/appointments");
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Book Appointment</h1>
            <p className="text-muted-foreground">Schedule an appointment with a veterinarian</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Step 1: Select Pet */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">1. Select Pet</h2>
              {pets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No pets registered yet</p>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/pets/register")}
                    className="text-primary hover:underline"
                  >
                    Register a pet first
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={formData.petId}
                  onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a pet</option>
                  {pets.map((pet) => (
                    <option key={pet._id} value={pet._id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2: Select Veterinarian */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">2. Select Veterinarian</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <button
                    key={doctor._id}
                    type="button"
                    onClick={() => handleDoctorSelect(doctor)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDoctor?._id === doctor._id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="font-semibold text-lg">
                      {doctor.firstName} {doctor.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{doctor.specialization}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {doctor.experience} years experience
                    </div>
                    {doctor.clinicAddress && (
                      <div className="text-sm text-muted-foreground mt-1">{doctor.clinicAddress}</div>
                    )}
                    <div className="text-sm font-medium mt-2">Fee: Rs. {doctor.bookingFee}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Select Date */}
            {selectedDoctor && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">3. Select Date</h2>
                <div className="flex justify-center">
                  <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    minDate={new Date()}
                    className="rounded-lg border border-border"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Select Time Slot */}
            {selectedDoctor && selectedDate && availableSlots.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">4. Select Time Slot</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedSlot === slot
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Appointment Details */}
            {selectedSlot && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h2 className="text-xl font-semibold">5. Appointment Details</h2>

                <div>
                  <label className="mb-2 block text-sm font-medium">Reason for Visit *</label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Annual checkup, Vaccination, etc."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Location Preference *</label>
                  <select
                    required
                    value={formData.locationPreference}
                    onChange={(e) =>
                      setFormData({ ...formData, locationPreference: e.target.value as any })
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="clinic">Clinic Visit</option>
                    <option value="home_visit">Home Visit</option>
                  </select>
                </div>

                {formData.locationPreference === "home_visit" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Address *</label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter your address for home visit"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            {selectedSlot && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/appointments")}
                  className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-semibold hover:bg-primary/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Booking..." : "Book Appointment"}
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

