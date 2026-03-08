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

interface Product {
	_id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	stock: number;
	isActive: boolean;
}

export default function PharmacyProductsPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

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
			if (parsed.role !== "pharmacy" && parsed.role !== "admin") {
				router.push("/dashboard");
				return;
			}
			fetchProducts(token);
		} catch {
			router.push("/login");
		} finally {
			setLoading(false);
		}
	}, [router]);

	const fetchProducts = async (token: string) => {
		try {
			const res = await fetch("http://localhost:5555/api/pharmacy/products/my", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (res.ok && data.products) {
				setProducts(data.products);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this product?")) return;
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`http://localhost:5555/api/pharmacy/products/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				setProducts((p) => p.filter((x) => x._id !== id));
			}
		} catch (err) {
			console.error(err);
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
				<div className="max-w-6xl mx-auto">
					<div className="flex justify-between items-center mb-8">
						<div>
							<h1 className="text-3xl font-bold mb-2">Products</h1>
							<p className="text-muted-foreground">Manage your pharmacy products</p>
						</div>
						<Link
							href="/dashboard/pharmacy/products/add"
							className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
						>
							+ Add Product
						</Link>
					</div>

					{products.length === 0 ? (
						<div className="rounded-xl border border-border bg-card p-12 text-center">
							<p className="text-muted-foreground mb-4">No products yet</p>
							<Link
								href="/dashboard/pharmacy/products/add"
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>
								Add your first product
							</Link>
						</div>
					) : (
						<div className="grid gap-4">
							{products.map((p) => (
								<div
									key={p._id}
									className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
								>
									<div>
										<h3 className="font-semibold">{p.name}</h3>
										<p className="text-sm text-muted-foreground">{p.category}</p>
										<p className="text-sm">Rs. {p.price} • Stock: {p.stock}</p>
										{!p.isActive && (
											<span className="inline-block mt-1 text-xs text-amber-600 font-medium">Inactive</span>
										)}
									</div>
									<div className="flex gap-2">
										<Link
											href={`/dashboard/pharmacy/products/edit/${p._id}`}
											className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-primary/5"
										>
											Edit
										</Link>
										<button
											onClick={() => handleDelete(p._id)}
											className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/5"
										>
											Delete
										</button>
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
