"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "../../../../../components/Sidebar";
import Link from "next/link";

interface User {
	_id: string;
	email: string;
	role: string;
	firstName?: string;
	lastName?: string;
}

const CATEGORIES = ["Food", "Toys", "Accessories", "Health", "Grooming"];

export default function EditProductPage() {
	const router = useRouter();
	const params = useParams();
	const id = params.id as string;
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState({
		name: "",
		description: "",
		price: "",
		category: "Health",
		stock: "0",
		isActive: true,
	});

	useEffect(() => {
		const token = localStorage.getItem("token");
		const userData = localStorage.getItem("user");
		if (!token || !userData) {
			router.push("/login");
			return;
		}
		try {
			const parsed = JSON.parse(userData);
			setUser(parsed);
			if (parsed.role !== "pharmacy" && parsed.role !== "admin") router.push("/dashboard");
			else fetchProduct(token);
		} catch {
			router.push("/login");
		} finally {
			setLoading(false);
		}
	}, [id, router]);

	const fetchProduct = async (token: string) => {
		try {
			const res = await fetch(`http://localhost:5555/api/pharmacy/products/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (res.ok && data.product) {
				const p = data.product;
				setForm({
					name: p.name,
					description: p.description || "",
					price: String(p.price),
					category: p.category || "Health",
					stock: String(p.stock),
					isActive: p.isActive !== false,
				});
			} else {
				router.push("/dashboard/pharmacy/products");
			}
		} catch {
			router.push("/dashboard/pharmacy/products");
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`http://localhost:5555/api/pharmacy/products/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: form.name,
					description: form.description,
					price: Number(form.price),
					category: form.category,
					stock: Number(form.stock),
					isActive: form.isActive,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				router.push("/dashboard/pharmacy/products");
			} else {
				alert(data.message || "Failed to update product");
			}
		} catch {
			alert("Failed to update product");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-xl mx-auto">
					<Link
						href="/dashboard/pharmacy/products"
						className="text-sm text-primary hover:underline mb-6 inline-block"
					>
						← Back to Products
					</Link>
					<h1 className="text-2xl font-bold mb-6">Edit Product</h1>
					<form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
						<div>
							<label className="block text-sm font-medium mb-2">Name *</label>
							<input
								type="text"
								required
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								className="w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">Description *</label>
							<textarea
								required
								rows={4}
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-2">Price (Rs.) *</label>
								<input
									type="number"
									required
									min={0}
									value={form.price}
									onChange={(e) => setForm({ ...form, price: e.target.value })}
									className="w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Stock *</label>
								<input
									type="number"
									required
									min={0}
									value={form.stock}
									onChange={(e) => setForm({ ...form, stock: e.target.value })}
									className="w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">Category *</label>
							<select
								value={form.category}
								onChange={(e) => setForm({ ...form, category: e.target.value })}
								className="w-full rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
							>
								{CATEGORIES.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="isActive"
								checked={form.isActive}
								onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
								className="rounded border-input"
							/>
							<label htmlFor="isActive" className="text-sm font-medium">
								Active (visible to customers)
							</label>
						</div>
						<div className="flex gap-3 pt-4">
							<button
								type="submit"
								disabled={submitting}
								className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{submitting ? "Saving..." : "Save Changes"}
							</button>
							<Link
								href="/dashboard/pharmacy/products"
								className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-primary/5"
							>
								Cancel
							</Link>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
