"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";
import Link from "next/link";

interface User {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
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

interface Appointment {
  _id: string;
  date: string;
  timeSlot: string;
  petName: string;
  petType: string;
  reason: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  doctor: Doctor;
  locationPreference?: string;
  address?: string;
}

interface Review {
  _id: string;
  reviewer?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
  } | string;
  targetId: string;
  targetModel: "Doctor" | "Product";
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewByDoctorId, setReviewByDoctorId] = useState<Record<string, Review>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(null);
  const [reviewErrorByAppointment, setReviewErrorByAppointment] = useState<Record<string, string>>({});
  
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
      fetchAppointments(parsedUser._id);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchAppointments = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/appointments/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const list = data.appointments || [];
        setAppointments(list);
        await fetchExistingReviews(list, userId);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchExistingReviews = async (list: Appointment[], userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const completedDoctorIds = Array.from(
        new Set(
          list
            .filter((apt) => apt.status === "completed" && apt.doctor?._id)
            .map((apt) => apt.doctor._id)
        )
      );

      if (completedDoctorIds.length === 0) {
        setReviewByDoctorId({});
        return;
      }

      const entries = await Promise.all(
        completedDoctorIds.map(async (doctorId) => {
          const res = await fetch(
            `http://localhost:5555/api/reviews?targetId=${doctorId}&targetModel=Doctor`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          if (!res.ok) return [doctorId, null] as const;

          const mine = (data.reviews || []).find((r: Review) => {
            if (!r.reviewer) return false;
            if (typeof r.reviewer === "string") return r.reviewer === userId;
            return r.reviewer._id === userId;
          });

          return [doctorId, mine || null] as const;
        })
      );

      const nextMap: Record<string, Review> = {};
      for (const [doctorId, review] of entries) {
        if (review) nextMap[doctorId] = review;
      }
      setReviewByDoctorId(nextMap);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  const handleDraftChange = (appointmentId: string, field: "rating" | "comment", value: string | number) => {
    setReviewDrafts((prev) => {
      const current = prev[appointmentId] || { rating: 5, comment: "" };
      return {
        ...prev,
        [appointmentId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSubmitReview = async (appointment: Appointment) => {
    if (!user) return;

    const draft = reviewDrafts[appointment._id] || { rating: 5, comment: "" };
    if (draft.rating < 1 || draft.rating > 5) {
      setReviewErrorByAppointment((prev) => ({ ...prev, [appointment._id]: "Rating must be between 1 and 5." }));
      return;
    }

    setReviewErrorByAppointment((prev) => ({ ...prev, [appointment._id]: "" }));
    setReviewSubmittingId(appointment._id);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5555/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetId: appointment.doctor._id,
          targetModel: "Doctor",
          rating: draft.rating,
          comment: draft.comment,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setReviewByDoctorId((prev) => ({
        ...prev,
        [appointment.doctor._id]: data.review,
      }));
      setReviewDrafts((prev) => ({
        ...prev,
        [appointment._id]: { rating: 5, comment: "" },
      }));
    } catch (error: any) {
      setReviewErrorByAppointment((prev) => ({
        ...prev,
        [appointment._id]: error.message || "Failed to submit review",
      }));
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5555/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "cancelled", cancellationReason: "Cancelled by pet owner" }),
      });
      if (response.ok) {
        fetchAppointments(user!._id);
      } else {
        alert("Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment", error);
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

  // 1. Filter
  let processed = appointments.filter((app) => statusFilter === "all" || app.status === statusFilter);

  // 2. Doctor Search
  if (doctorSearch.trim() !== "") {
    const term = doctorSearch.toLowerCase();
    processed = processed.filter(
      (app) =>
        app.doctor.firstName.toLowerCase().includes(term) ||
        app.doctor.lastName.toLowerCase().includes(term) ||
        app.doctor.specialization.toLowerCase().includes(term)
    );
  }

  // 3. Date Search
  if (dateFilter) {
    processed = processed.filter((app) => app.date.startsWith(dateFilter));
  }

  // 4. Sort
  processed.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  // 5. Pagination
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  // Reset currentPage if it's out of bounds after filtering
  const safeCurrentPage = Math.min(currentPage, totalPages);
  if (currentPage !== safeCurrentPage && safeCurrentPage > 0) {
    setCurrentPage(safeCurrentPage);
  }

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedAppointments = processed.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
              <p className="text-muted-foreground">Track and manage your upcoming veterinarian visits.</p>
            </div>
            <Link
              href="/dashboard/appointments/book"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg self-start md:self-auto flex items-center gap-2"
            >
              <span>+</span> Book Appointment
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto w-full xl:w-auto p-1 scrollbar-hide">
              {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize whitespace-nowrap transition-all duration-200 ${
                    statusFilter === status
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Sub Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <input 
                type="text" 
                placeholder="Search Doctor..." 
                value={doctorSearch}
                onChange={(e) => {
                  setDoctorSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 flex-1 sm:w-48"
              />
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground"
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {paginatedAppointments.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/50">
              <div className="text-5xl mb-4 opacity-75">📅</div>
              <h3 className="text-xl font-semibold mb-2">No appointments found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {appointments.length === 0 
                  ? "You don't have any appointments booked yet. Schedule a visit to keep your pet healthy."
                  : "No appointments match your filters."}
              </p>
              {appointments.length === 0 && (
                <Link
                  href="/dashboard/appointments/book"
                  className="inline-block rounded-lg border border-primary text-primary px-6 py-3 text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  Schedule Now
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {paginatedAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-200 relative group overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${
                      appointment.status === "confirmed" ? "bg-green-500" :
                      appointment.status === "pending" ? "bg-yellow-500" :
                      appointment.status === "completed" ? "bg-blue-500" :
                      "bg-red-500"
                    }`}></div>
                    
                    <div className="flex flex-col h-full pl-2">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-xl font-bold flex items-center gap-2 truncate">
                            <span className="text-2xl">{appointment.petType.toLowerCase() === 'cat' ? '🐱' : appointment.petType.toLowerCase() === 'dog' ? '🐶' : '🐾'}</span>
                            {appointment.petName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 font-medium bg-foreground/5 inline-block px-2 py-0.5 rounded-md line-clamp-1 max-w-full">
                            {appointment.reason}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border whitespace-nowrap flex-shrink-0 ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <div className="bg-background rounded-xl p-4 border border-border/50 grid grid-cols-2 gap-y-4 gap-x-2 text-sm flex-grow mb-4">
                        <div>
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Doctor</span>
                          <span className="font-semibold text-foreground">
                            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                          </span>
                          <div className="text-xs text-muted-foreground truncate">{appointment.doctor.specialization}</div>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Schedule</span>
                          <span className="font-semibold text-foreground">
                            {new Date(appointment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <div className="text-xs font-medium text-primary mt-0.5">{appointment.timeSlot}</div>
                        </div>

                        <div className="col-span-2 pt-2 border-t border-border/50">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Location</span>
                          <span className="font-medium text-foreground flex items-center gap-1.5">
                            {appointment.locationPreference === "home_visit" ? "🏠 Home Visit" : "🏥 Clinic"}
                          </span>
                          {appointment.address && appointment.locationPreference === "home_visit" && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">{appointment.address}</div>
                          )}
                          {appointment.doctor.clinicAddress && appointment.locationPreference === "clinic" && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">{appointment.doctor.clinicAddress}</div>
                          )}
                        </div>
                      </div>

                      {appointment.status === "pending" && (
                        <div className="flex justify-end mt-auto pt-2 border-t border-border/30">
                          <button
                            onClick={() => handleCancel(appointment._id)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      )}

                      {appointment.status === "completed" && (
                        <div className="mt-auto pt-3 border-t border-border/30">
                          <h4 className="text-sm font-semibold mb-2">Review</h4>

                          {reviewByDoctorId[appointment.doctor._id] ? (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                              <p className="text-sm font-semibold text-green-800">
                                {renderStars(reviewByDoctorId[appointment.doctor._id].rating)}
                              </p>
                              <p className="text-sm text-green-900 mt-1">
                                {reviewByDoctorId[appointment.doctor._id].comment || "No comment provided."}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground">Rating</label>
                                <select
                                  value={reviewDrafts[appointment._id]?.rating ?? 5}
                                  onChange={(e) => handleDraftChange(appointment._id, "rating", Number(e.target.value))}
                                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                                >
                                  <option value={5}>5</option>
                                  <option value={4}>4</option>
                                  <option value={3}>3</option>
                                  <option value={2}>2</option>
                                  <option value={1}>1</option>
                                </select>
                              </div>

                              <textarea
                                value={reviewDrafts[appointment._id]?.comment ?? ""}
                                onChange={(e) => handleDraftChange(appointment._id, "comment", e.target.value)}
                                rows={2}
                                placeholder="Write your review about this completed appointment"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                              />

                              {reviewErrorByAppointment[appointment._id] && (
                                <p className="text-xs text-destructive">{reviewErrorByAppointment[appointment._id]}</p>
                              )}

                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSubmitReview(appointment)}
                                  disabled={reviewSubmittingId === appointment._id}
                                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                  {reviewSubmittingId === appointment._id ? "Submitting..." : "Submit Review"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 bg-card border border-border p-2 rounded-xl w-fit mx-auto shadow-sm">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          safeCurrentPage === pageNum
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

