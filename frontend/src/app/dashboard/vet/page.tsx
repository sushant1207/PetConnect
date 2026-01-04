"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface Appointment {
  _id: string;
  date: string;
  timeSlot: string;
  petName: string;
  petType: string;
  reason: string;
  status: string;
  locationPreference: string;
  address?: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function VetDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

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
      fetchAppointments(parsedUser._id);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let filtered = [...appointments];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }
    
    // Apply date filter for calendar view
    if (viewMode === "calendar" && selectedDate instanceof Date) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.date).toISOString().split("T")[0];
        return aptDate === dateStr;
      });
    }
    
    setFilteredAppointments(filtered);
  }, [selectedDate, appointments, statusFilter, viewMode]);

  const fetchAppointments = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      // First get the doctor profile to get the doctor ID
      const doctorResponse = await fetch(`http://localhost:5555/api/doctors/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (doctorResponse.ok) {
        const doctorData = await doctorResponse.json();
        if (doctorData.doctor && doctorData.doctor._id) {
          // Now fetch appointments using the doctor's _id
          const appointmentsResponse = await fetch(`http://localhost:5555/api/appointments/doctor/${doctorData.doctor._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const appointmentsData = await appointmentsResponse.json();
          if (appointmentsResponse.ok) {
            setAppointments(appointmentsData.appointments || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string, appointmentPetName?: string) => {
    const action = newStatus === "confirmed" ? "approve" : newStatus === "cancelled" ? "reject" : "update";
    const confirmMessage = newStatus === "confirmed" 
      ? `Are you sure you want to approve the appointment for ${appointmentPetName || "this pet"}?`
      : newStatus === "cancelled"
      ? `Are you sure you want to reject/cancel the appointment for ${appointmentPetName || "this pet"}?`
      : `Are you sure you want to mark this appointment as ${newStatus}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAppointments(user!._id);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update appointment");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Failed to update appointment. Please try again.");
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date).toISOString().split("T")[0];
      return aptDate === dateStr;
    }).length;
  };

  const tileContent = ({ date }: { date: Date }) => {
    const count = getAppointmentsForDate(date);
    if (count > 0) {
      return (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
        </div>
      );
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
              <h1 className="text-3xl font-bold mb-2">Veterinarian Dashboard</h1>
              <p className="text-muted-foreground">Manage your appointments and schedule</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "calendar"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border hover:bg-primary/5"
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border hover:bg-primary/5"
                }`}
              >
                📋 List
              </button>
              {viewMode === "list" && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
            </div>
          </div>

          {/* Pending Appointments Alert */}
          {appointments.filter((apt) => apt.status === "pending").length > 0 && (
            <div className="mb-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-900">
                    {appointments.filter((apt) => apt.status === "pending").length} Pending Appointment(s)
                  </h3>
                  <p className="text-sm text-yellow-700">Please review and approve or reject pending appointments</p>
                </div>
                <button
                  onClick={() => setViewMode("list")}
                  className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
                >
                  Review Now
                </button>
              </div>
            </div>
          )}

          {viewMode === "calendar" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="rounded-lg border border-border bg-card p-6">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    tileContent={tileContent}
                    className="rounded-lg border-0 w-full"
                  />
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Appointments for {selectedDate instanceof Date ? selectedDate.toLocaleDateString() : ""}
                  </h2>
                  {filteredAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No appointments for this date</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredAppointments
                        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                        .map((appointment) => (
                          <div
                            key={appointment._id}
                            className={`p-3 rounded-lg border ${
                              appointment.status === "pending" ? "border-yellow-300 bg-yellow-50" : "border-border bg-background"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{appointment.timeSlot}</span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold border capitalize ${getStatusColor(
                                  appointment.status
                                )}`}
                              >
                                {appointment.status}
                              </span>
                            </div>
                            <div className="text-sm">
                              <div className="font-medium">{appointment.petName}</div>
                              <div className="text-muted-foreground">{appointment.reason}</div>
                              <div className="text-muted-foreground text-xs mt-1">
                                {appointment.user.firstName} {appointment.user.lastName}
                              </div>
                            </div>
                            {appointment.status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, "confirmed", appointment.petName)}
                                  className="flex-1 rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, "cancelled", appointment.petName)}
                                  className="flex-1 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-12 rounded-lg border border-border bg-card">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold mb-2">No appointments yet</h3>
                  <p className="text-muted-foreground">Your appointments will appear here</p>
                </div>
              ) : (
                // Sort appointments: pending first, then by date
                filteredAppointments
                  .sort((a, b) => {
                    if (a.status === "pending" && b.status !== "pending") return -1;
                    if (a.status !== "pending" && b.status === "pending") return 1;
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                  })
                  .map((appointment) => (
                  <div
                    key={appointment._id}
                    className={`rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${
                      appointment.status === "pending"
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-xl font-semibold">{appointment.petName}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="ml-2 font-medium">
                              {new Date(appointment.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <span className="ml-2 font-medium">{appointment.timeSlot}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pet Owner:</span>
                            <span className="ml-2 font-medium">
                              {appointment.user.firstName} {appointment.user.lastName}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Contact:</span>
                            <span className="ml-2 font-medium">{appointment.user.email}</span>
                            {appointment.user.phone && (
                              <span className="ml-2">({appointment.user.phone})</span>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pet Type:</span>
                            <span className="ml-2 font-medium capitalize">{appointment.petType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <span className="ml-2 font-medium capitalize">
                              {appointment.locationPreference === "home_visit" ? "Home Visit" : "Clinic"}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Reason:</span>
                            <span className="ml-2 font-medium">{appointment.reason}</span>
                          </div>
                          {appointment.address && (
                            <div className="md:col-span-2">
                              <span className="text-muted-foreground">Address:</span>
                              <span className="ml-2 font-medium">{appointment.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2 min-w-[120px]">
                        {appointment.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(appointment._id, "confirmed", appointment.petName)}
                              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(appointment._id, "cancelled", appointment.petName)}
                              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {appointment.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, "completed", appointment.petName)}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                        {appointment.status === "completed" && (
                          <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold text-center">
                            Completed
                          </span>
                        )}
                        {appointment.status === "cancelled" && (
                          <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold text-center">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

