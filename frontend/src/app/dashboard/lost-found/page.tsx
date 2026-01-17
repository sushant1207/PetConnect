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

interface LostFoundReport {
	_id: string;
	type: "lost" | "found";
	petType: string;
	breed?: string;
	location: string;
	date: string;
	description: string;
	status: "open" | "resolved" | "closed";
	images: Array<{ url: string }>;
	contact: { name: string; email: string; phone?: string };
	createdAt: string;
}

export default function LostFoundPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [reports, setReports] = useState<LostFoundReport[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState({ type: "", petType: "", status: "open" });

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
			fetchReports();
		} catch (error) {
			router.push("/login");
		} finally {
			setLoading(false);
		}
	}, [router]);

	const fetchReports = async () => {
		try {
			const query = new URLSearchParams(filter).toString();
			const response = await fetch(`http://localhost:5555/api/lost-found?${query}`);
			const data = await response.json();
			if (response.ok) {
				setReports(data || []);
			}
		} catch (error) {
			console.error("Error fetching reports:", error);
		}
	};

	useEffect(() => {
		if (user) {
			fetchReports();
		}
	}, [filter, user]);

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
					<div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold mb-2">Lost & Found</h1>
							<p className="text-muted-foreground">Help reunite pets with their owners</p>
						</div>
						<div className="flex gap-3">
							<Link
								href="/dashboard/lost-found/report"
								className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								+ Report Lost/Found Pet
							</Link>
						</div>
					</div>

					<div className="mb-6 flex flex-wrap gap-4 bg-card p-4 rounded-lg border border-border">
						<select
							className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							value={filter.type}
							onChange={(e) => setFilter({ ...filter, type: e.target.value })}
						>
							<option value="">All Types</option>
							<option value="lost">Lost</option>
							<option value="found">Found</option>
						</select>

						<select
							className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							value={filter.status}
							onChange={(e) => setFilter({ ...filter, status: e.target.value })}
						>
							<option value="open">Open</option>
							<option value="resolved">Resolved</option>
							<option value="closed">Closed</option>
							<option value="">All Status</option>
						</select>

						<input
							type="text"
							placeholder="Filter by pet type (e.g. Dog)"
							className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							value={filter.petType}
							onChange={(e) => setFilter({ ...filter, petType: e.target.value })}
						/>
					</div>

					{reports.length === 0 ? (
						<div className="text-center py-12 rounded-lg border border-border bg-card">
							<div className="text-4xl mb-4">🔍</div>
							<h3 className="text-xl font-semibold mb-2">No reports found</h3>
							<p className="text-muted-foreground mb-6">Try adjusting your filters or create a new report</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{reports.map((report) => (
								<div
									key={report._id}
									className={`rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col`}
								>
									<div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${
										report.type === "lost" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
									}`}>
										{report.type}
									</div>
									<div className="p-6 flex-1">
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="text-xl font-semibold mb-1 capitalize">{report.petType}</h3>
												<p className="text-sm text-muted-foreground">{report.location}</p>
											</div>
											<span className={`px-2 py-1 rounded text-[10px] font-medium border ${
												report.status === "open" ? "border-blue-500/30 bg-blue-500/10 text-blue-500" :
												report.status === "resolved" ? "border-green-500/30 bg-green-500/10 text-green-500" :
												"border-gray-500/30 bg-gray-500/10 text-gray-500"
											}`}>
												{report.status}
											</span>
										</div>
										<p className="text-sm line-clamp-3 mb-4 text-muted-foreground">
											{report.description}
										</p>
										<div className="space-y-2 text-sm border-t border-border pt-4">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Date:</span>
												<span className="font-medium">{new Date(report.date).toLocaleDateString()}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Contact:</span>
												<span className="font-medium">{report.contact.name}</span>
											</div>
										</div>
									</div>
									<div className="px-6 py-4 bg-muted/30 border-t border-border mt-auto">
										<Link
											href={`/dashboard/lost-found/${report._id}`}
											className="block text-center text-sm font-semibold text-primary hover:underline"
										>
											View Details
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
