"use client";

import { useEffect, useState } from "react";
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

export default function ReportPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		type: "lost",
		petType: "",
		breed: "",
		location: "",
		date: new Date().toISOString().split("T")[0],
		description: "",
		contact: {
			name: "",
			email: "",
			phone: ""
		},
		additionalDetails: {
			color: "",
			size: "",
			gender: "",
			distinctiveFeatures: ""
		}
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
			setFormData(prev => ({
				...prev,
				contact: {
					name: `${parsedUser.firstName || ""} ${parsedUser.lastName || ""}`.trim() || parsedUser.email,
					email: parsedUser.email,
					phone: ""
				}
			}));
		} catch (error) {
			router.push("/login");
		} finally {
			setLoading(false);
		}
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError("");

		try {
			const token = localStorage.getItem("token");
			const response = await fetch("http://localhost:5555/api/lost-found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				router.push("/dashboard/lost-found");
			} else {
				const data = await response.json();
				setError(data.message || "Failed to submit report");
			}
		} catch (err) {
			setError("An error occurred. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return null;

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user!} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-3xl mx-auto">
					<div className="mb-8">
						<Link href="/dashboard/lost-found" className="text-sm text-primary hover:underline mb-4 inline-block">
							← Back to Lost & Found
						</Link>
						<h1 className="text-3xl font-bold">Report Lost or Found Pet</h1>
						<p className="text-muted-foreground">Fill in the details to help identify the pet</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm">
						{error && (
							<div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
								{error}
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<label className="text-sm font-medium">Report Type</label>
								<select
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
									value={formData.type}
									onChange={(e) => setFormData({ ...formData, type: e.target.value })}
									required
								>
									<option value="lost">Lost Pet</option>
									<option value="found">Found Pet</option>
								</select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Pet Type</label>
								<input
									type="text"
									placeholder="e.g. Dog, Cat, Parrot"
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
									value={formData.petType}
									onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
									required
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Location</label>
								<input
									type="text"
									placeholder="Where was it last seen or found?"
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
									value={formData.location}
									onChange={(e) => setFormData({ ...formData, location: e.target.value })}
									required
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Date</label>
								<input
									type="date"
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
									value={formData.date}
									onChange={(e) => setFormData({ ...formData, date: e.target.value })}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Description</label>
							<textarea
								placeholder="Provide a detailed description of the pet..."
								rows={4}
								className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								required
							/>
						</div>

						<div className="pt-6 border-t border-border">
							<h3 className="text-lg font-semibold mb-4">Contact Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label className="text-sm font-medium">Contact Name</label>
									<input
										type="text"
										className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
										value={formData.contact.name}
										onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, name: e.target.value } })}
										required
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Contact Phone</label>
									<input
										type="tel"
										className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
										value={formData.contact.phone}
										onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
									/>
								</div>
							</div>
						</div>

						<div className="pt-6 border-t border-border">
							<h3 className="text-lg font-semibold mb-4">Additional Details (Optional)</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label className="text-sm font-medium">Color</label>
									<input
										type="text"
										className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
										value={formData.additionalDetails.color}
										onChange={(e) => setFormData({ ...formData, additionalDetails: { ...formData.additionalDetails, color: e.target.value } })}
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Gender</label>
									<select
										className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
										value={formData.additionalDetails.gender}
										onChange={(e) => setFormData({ ...formData, additionalDetails: { ...formData.additionalDetails, gender: e.target.value } })}
									>
										<option value="">Select Gender</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
										<option value="unknown">Unknown</option>
									</select>
								</div>
							</div>
						</div>

						<div className="pt-6">
							<button
								type="submit"
								disabled={submitting}
								className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
							>
								{submitting ? "Submitting..." : "Submit Report"}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
