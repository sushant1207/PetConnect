"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/Sidebar";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface Doctor {
  _id: string;
  availability: string[];
  appointmentDuration: number;
  bookingFee: number;
  clinicAddress?: string;
  locationPreference: string;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function VetSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [availability, setAvailability] = useState<Record<string, { enabled: boolean; startHour: number; endHour: number }>>({});
  const [appointmentDuration, setAppointmentDuration] = useState(30);
  const [bookingFee, setBookingFee] = useState(500);
  const [clinicAddress, setClinicAddress] = useState("");
  const [locationPreference, setLocationPreference] = useState<"clinic" | "home_visit" | "both">("clinic");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "veterinarian") {
        router.push("/dashboard");
        return;
      }
      setUser(parsedUser);
      fetchDoctorProfile(parsedUser._id);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchDoctorProfile = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/doctors/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.doctor) {
        setDoctor(data.doctor);
        setAppointmentDuration(data.doctor.appointmentDuration || 30);
        setBookingFee(data.doctor.bookingFee || 500);
        setClinicAddress(data.doctor.clinicAddress || "");
        setLocationPreference(data.doctor.locationPreference || "clinic");

        // Parse existing availability
        const parsedAvailability: Record<string, { enabled: boolean; startHour: number; endHour: number }> = {};
        daysOfWeek.forEach((day) => {
          parsedAvailability[day] = { enabled: false, startHour: 10, endHour: 18 };
        });

        if (data.doctor.availability && Array.isArray(data.doctor.availability)) {
          data.doctor.availability.forEach((entry: string) => {
            const match = entry.match(/^([A-Z][a-z]+) (\d+)-(\d+)$/);
            if (match) {
              const [, day, start, end] = match;
              parsedAvailability[day] = {
                enabled: true,
                startHour: parseInt(start),
                endHour: parseInt(end),
              };
            }
          });
        }

        setAvailability(parsedAvailability);
      } else {
        // Doctor profile doesn't exist yet, create a placeholder
        setDoctor({
          _id: userId,
          availability: [],
          appointmentDuration: 30,
          bookingFee: 500,
          locationPreference: "clinic",
        });
        // Initialize availability with defaults
        const parsedAvailability: Record<string, { enabled: boolean; startHour: number; endHour: number }> = {};
        daysOfWeek.forEach((day) => {
          parsedAvailability[day] = { enabled: false, startHour: 10, endHour: 18 };
        });
        setAvailability(parsedAvailability);
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      // Create placeholder if fetch fails
      if (user) {
        setDoctor({
          _id: user._id,
          availability: [],
          appointmentDuration: 30,
          bookingFee: 500,
          locationPreference: "clinic",
        });
        const parsedAvailability: Record<string, { enabled: boolean; startHour: number; endHour: number }> = {};
        daysOfWeek.forEach((day) => {
          parsedAvailability[day] = { enabled: false, startHour: 10, endHour: 18 };
        });
        setAvailability(parsedAvailability);
      }
    }
  };

  const handleSave = async () => {
    if (!doctor || !user) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Format availability array
      const availabilityArray: string[] = [];
      daysOfWeek.forEach((day) => {
        if (availability[day]?.enabled) {
          const { startHour, endHour } = availability[day];
          availabilityArray.push(`${day} ${startHour}-${endHour}`);
        }
      });

      const token = localStorage.getItem("token");
      // Use userId if doctor._id is actually a userId (when doctor profile doesn't exist yet)
      const doctorId = doctor._id.includes("@") || doctor._id === user._id ? user._id : doctor._id;
      
      const response = await fetch(`http://localhost:5555/api/doctors/${doctorId}/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          availability: availabilityArray,
          appointmentDuration,
          bookingFee,
          clinicAddress,
          locationPreference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update settings");
      }

      // Refresh doctor data
      if (data.doctor) {
        setDoctor(data.doctor);
      }

      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const updateDayAvailability = (day: string, updates: Partial<{ enabled: boolean; startHour: number; endHour: number }>) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
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

  if (!user || !doctor) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Veterinarian Settings</h1>
            <p className="text-muted-foreground">Manage your availability and appointment settings</p>
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

            {/* Availability Settings */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Weekly Availability</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Set your working hours for each day. Appointments will be available in 30-minute slots.
              </p>

              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        id={`day-${day}`}
                        checked={availability[day]?.enabled || false}
                        onChange={(e) => updateDayAvailability(day, { enabled: e.target.checked })}
                        className="h-5 w-5 rounded border-input"
                      />
                      <label htmlFor={`day-${day}`} className="font-medium w-24">
                        {day}
                      </label>
                    </div>

                    {availability[day]?.enabled && (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">From:</label>
                          <select
                            value={availability[day]?.startHour || 10}
                            onChange={(e) =>
                              updateDayAvailability(day, { startHour: parseInt(e.target.value) })
                            }
                            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                              <option key={hour} value={hour}>
                                {formatTime(hour)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">To:</label>
                          <select
                            value={availability[day]?.endHour || 18}
                            onChange={(e) =>
                              updateDayAvailability(day, { endHour: parseInt(e.target.value) })
                            }
                            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 9).map((hour) => (
                              <option key={hour} value={hour}>
                                {formatTime(hour)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          ({Math.floor(((availability[day]?.endHour || 18) - (availability[day]?.startHour || 10)) * 60 / 30)} slots)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment Settings */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Appointment Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Appointment Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={appointmentDuration}
                    onChange={(e) => setAppointmentDuration(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Each appointment slot will be {appointmentDuration} minutes long
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Booking Fee (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookingFee}
                    onChange={(e) => setBookingFee(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Location Preference</label>
                  <select
                    value={locationPreference}
                    onChange={(e) => setLocationPreference(e.target.value as any)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="clinic">Clinic Only</option>
                    <option value="home_visit">Home Visit Only</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Clinic Address</label>
                  <textarea
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your clinic address"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/dashboard/vet")}
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

