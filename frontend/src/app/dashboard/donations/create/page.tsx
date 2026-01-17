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

export default function CreateCampaignPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		goal: 0,
		image: {
			url: ""
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
			if (parsedUser.role !== "shelter") {
				router.push("/dashboard");
				return;
			}
			setUser(parsedUser);
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
			const response = await fetch("http://localhost:5555/api/charity/campaigns", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				router.push("/dashboard/donations");
			} else {
				const data = await response.json();
				setError(data.message || "Failed to create campaign");
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
						<Link href="/dashboard/donations" className="text-sm text-primary hover:underline mb-4 inline-block">
							← Back to Campaigns
						</Link>
						<h1 className="text-3xl font-bold">Create Donation Campaign</h1>
						<p className="text-muted-foreground">Start a new gig to raise funds for your shelter</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm">
						{error && (
							<div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label className="text-sm font-medium">Campaign Name</label>
							<input
								type="text"
								placeholder="e.g. Winter Food Drive for Rescued Dogs"
								className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								required
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Description</label>
							<textarea
								placeholder="Describe what this campaign is for and how the funds will be used..."
								rows={6}
								className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								required
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<label className="text-sm font-medium">Goal Amount (Rs.)</label>
								<input
									type="number"
									placeholder="50000"
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
									value={formData.goal || ""}
									onChange={(e) => setFormData({ ...formData, goal: Number(e.target.value) })}
									required
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Image URL (Optional)</label>
								<input
									type="url"
									placeholder="https://images.unsplash.com/..."
									className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
									value={formData.image.url}
									onChange={(e) => setFormData({ ...formData, image: { ...formData.image, url: e.target.value } })}
								/>
							</div>
						</div>

						<div className="pt-6">
							<button
								type="submit"
								disabled={submitting}
								className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
							>
								{submitting ? "Creating Campaign..." : "Launch Campaign"}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
