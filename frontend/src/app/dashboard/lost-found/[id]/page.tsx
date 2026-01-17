"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/Sidebar";
import Link from "next/link";

interface User {
	_id: string;
	email: string;
	role: string;
	firstName?: string;
	lastName?: string;
}

interface LostFoundReport {
	_id: string;
	userId: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	type: "lost" | "found";
	petType: string;
	breed?: string;
	location: string;
	date: string;
	description: string;
	status: "open" | "resolved" | "closed";
	images: Array<{ url: string }>;
	contact: { name: string; email: string; phone?: string };
	additionalDetails?: {
		color?: string;
		size?: string;
		age?: string;
		gender?: string;
		microchipped?: boolean;
		collar?: boolean;
		distinctiveFeatures?: string;
	};
	createdAt: string;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [report, setReport] = useState<LostFoundReport | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);

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
			fetchReport();
		} catch (error) {
			router.push("/login");
		}
	}, [id, router]);

	const fetchReport = async () => {
		try {
			const response = await fetch(`http://localhost:5555/api/lost-found/${id}`);
			const data = await response.json();
			if (response.ok) {
				setReport(data);
			}
		} catch (error) {
			console.error("Error fetching report:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (newStatus: string) => {
		if (!report) return;
		setUpdating(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`http://localhost:5555/api/lost-found/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				fetchReport();
			}
		} catch (error) {
			console.error("Error updating report:", error);
		} finally {
			setUpdating(false);
		}
	};

	if (loading) return null;
	if (!report) return (
		<div className="flex h-screen items-center justify-center">
			<p>Report not found</p>
		</div>
	);

	const isOwner = user?._id === report.userId._id;

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user!} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-4xl mx-auto">
					<div className="mb-8">
						<Link href="/dashboard/lost-found" className="text-sm text-primary hover:underline mb-4 inline-block">
							← Back to Lost & Found
						</Link>
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div>
								<h1 className="text-3xl font-bold mb-2 capitalize">{report.type} {report.petType}</h1>
								<p className="text-muted-foreground">Reported on {new Date(report.createdAt).toLocaleDateString()}</p>
							</div>
							<div className="flex items-center gap-3">
								<span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
									report.type === "lost" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
								}`}>
									{report.type}
								</span>
								<span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
									report.status === "open" ? "border-blue-500/30 bg-blue-500/10 text-blue-500" :
									report.status === "resolved" ? "border-green-500/30 bg-green-500/10 text-green-500" :
									"border-gray-500/30 bg-gray-500/10 text-gray-500"
								}`}>
									{report.status}
								</span>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 space-y-8">
							<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<h2 className="text-xl font-semibold mb-4">Description</h2>
								<p className="text-muted-foreground whitespace-pre-wrap">{report.description}</p>
							</section>

							<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<h2 className="text-xl font-semibold mb-4">Report Details</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
									<div>
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Pet Type</p>
										<p className="font-medium capitalize">{report.petType}</p>
									</div>
									{report.breed && (
										<div>
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Breed</p>
											<p className="font-medium">{report.breed}</p>
										</div>
									)}
									<div>
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Location</p>
										<p className="font-medium">{report.location}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Date</p>
										<p className="font-medium">{new Date(report.date).toLocaleDateString()}</p>
									</div>
									{report.additionalDetails?.color && (
										<div>
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Color</p>
											<p className="font-medium capitalize">{report.additionalDetails.color}</p>
										</div>
									)}
									{report.additionalDetails?.gender && (
										<div>
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Gender</p>
											<p className="font-medium capitalize">{report.additionalDetails.gender}</p>
										</div>
									)}
								</div>
							</section>

							{report.additionalDetails?.distinctiveFeatures && (
								<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
									<h2 className="text-xl font-semibold mb-4">Distinctive Features</h2>
									<p className="text-muted-foreground">{report.additionalDetails.distinctiveFeatures}</p>
								</section>
							)}
						</div>

						<div className="space-y-8">
							<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<h2 className="text-xl font-semibold mb-4">Contact Info</h2>
								<div className="space-y-4">
									<div>
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Name</p>
										<p className="font-medium">{report.contact.name}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Email</p>
										<p className="font-medium break-all">{report.contact.email}</p>
									</div>
									{report.contact.phone && (
										<div>
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Phone</p>
											<p className="font-medium">{report.contact.phone}</p>
										</div>
									)}
									<a
										href={`mailto:${report.contact.email}`}
										className="block w-full text-center bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors"
									>
										Contact via Email
									</a>
								</div>
							</section>

							{isOwner && (
								<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
									<h2 className="text-xl font-semibold mb-4">Manage Report</h2>
									<div className="space-y-3">
										<p className="text-sm text-muted-foreground mb-4">Update the status of your report</p>
										<button
											onClick={() => handleStatusChange("resolved")}
											disabled={updating || report.status === "resolved"}
											className="w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
										>
											Mark as Resolved
										</button>
										<button
											onClick={() => handleStatusChange("closed")}
											disabled={updating || report.status === "closed"}
											className="w-full bg-gray-500 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
										>
											Mark as Closed
										</button>
										<button
											onClick={() => handleStatusChange("open")}
											disabled={updating || report.status === "open"}
											className="w-full border border-blue-500 text-blue-500 font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
										>
											Reopen Report
										</button>
									</div>
								</section>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
