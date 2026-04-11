"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/Sidebar";
import Link from "next/link";
import { ConfirmModal } from "../../../components/ConfirmModal";

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
	images?: Array<string | { public_id?: string; url?: string }>;
}

const getImageUrl = (images?: Array<string | { public_id?: string; url?: string }>) => {
	if (!images || images.length === 0) return "";
	const first = images[0];
	const raw = typeof first === "string" ? first : first?.url || "";
	if (!raw) return "";
	if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
	return `http://localhost:5555${raw}`;
};

export default function PharmacyProductsPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	// Features
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
	const [sortOrder, setSortOrder] = useState<"name" | "stock" | "price">("name");
	const [currentPage, setCurrentPage] = useState(1);
	const [pendingAction, setPendingAction] = useState<
		| { type: "delete"; productId: string; productName: string }
		| { type: "toggle"; product: Product }
		| null
	>(null);
	const ITEMS_PER_PAGE = 8;

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

	const deleteProduct = async (id: string) => {
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

	const toggleStatus = async (p: Product) => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`http://localhost:5555/api/pharmacy/products/${p._id}`, {
				method: "PUT",
				headers: { 
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name: p.name,
					description: p.description,
					price: p.price,
					category: p.category,
					stock: p.stock,
					isActive: !p.isActive
				})
			});
			if (res.ok) {
				fetchProducts(token!);
			} else {
				alert("Failed to update product status.");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const runPendingAction = async () => {
		if (!pendingAction) return;
		if (pendingAction.type === "delete") {
			await deleteProduct(pendingAction.productId);
		} else {
			await toggleStatus(pendingAction.product);
		}
		setPendingAction(null);
	};

	let processed = products.filter(p => {
		if (activeFilter === "active" && !p.isActive) return false;
		if (activeFilter === "inactive" && p.isActive) return false;
		if (searchQuery.trim() !== "") {
			const term = searchQuery.toLowerCase();
			return p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
		}
		return true;
	});

	if (sortOrder === "name") processed.sort((a, b) => a.name.localeCompare(b.name));
	else if (sortOrder === "price") processed.sort((a, b) => a.price - b.price);
	else if (sortOrder === "stock") processed.sort((a, b) => a.stock - b.stock);

	const totalPages = Math.max(1, Math.ceil(processed.length / ITEMS_PER_PAGE));
	const safeCurrentPage = Math.min(currentPage, totalPages);
	if (currentPage !== safeCurrentPage && safeCurrentPage > 0) {
		setCurrentPage(safeCurrentPage);
	}

	const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
	const paginatedProducts = processed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
				<div className="max-w-7xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
						<div>
							<h1 className="text-3xl font-bold mb-2">My Products</h1>
							<p className="text-muted-foreground">Manage your pharmacy inventory, track stock, and toggle visibility.</p>
						</div>
						<Link
							href="/dashboard/pharmacy/products/add"
							className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg flex items-center gap-2 shrink-0"
						>
							<span>+</span> Add Product
						</Link>
					</div>

					{/* Filters & Search */}
					<div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
						<div className="relative w-full lg:w-1/3">
							<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">🔍</span>
							<input
								type="text"
								placeholder="Search your products..."
								value={searchQuery}
								onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
								className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
							/>
						</div>
						
						<div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
							<select
								value={activeFilter}
								onChange={(e) => { setActiveFilter(e.target.value as any); setCurrentPage(1); }}
								className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
							>
								<option value="all">All Status</option>
								<option value="active">Active Only</option>
								<option value="inactive">Inactive Only</option>
							</select>

							<select
								value={sortOrder}
								onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1); }}
								className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
							>
								<option value="name">Sort by: Name (A-Z)</option>
								<option value="price">Sort by: Price (Lowest)</option>
								<option value="stock">Sort by: Stock (Lowest)</option>
							</select>
						</div>
					</div>

					{products.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
							<div className="text-5xl mb-4 opacity-75">🏢</div>
							<p className="text-xl font-bold mb-2">Your inventory is empty</p>
							<p className="text-muted-foreground mb-6">Start selling by adding your first medication or product.</p>
							<Link
								href="/dashboard/pharmacy/products/add"
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
							>
								Add your first product
							</Link>
						</div>
					) : paginatedProducts.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
							<h3 className="text-xl font-semibold mb-2">No products match your filters</h3>
							<p className="text-muted-foreground">Try adjusting your search or filter settings.</p>
						</div>
					) : (
						<div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
							<div className="overflow-x-auto">
								<table className="w-full text-sm text-left">
									<thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
										<tr>
											<th className="px-6 py-4 font-medium">Product Details</th>
											<th className="px-6 py-4 font-medium">Pricing</th>
											<th className="px-6 py-4 font-medium">Stock</th>
											<th className="px-6 py-4 font-medium">Visibility</th>
											<th className="px-6 py-4 font-medium text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{paginatedProducts.map((p) => (
											<tr key={p._id} className="hover:bg-muted/30 transition-colors">
												<td className="px-6 py-4">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
															{getImageUrl(p.images) ? (
																<img src={getImageUrl(p.images)} alt={p.name} className="w-full h-full object-cover" />
															) : (
																<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
															)}
														</div>
														<div>
															<p className="font-bold text-base text-foreground mb-0.5">{p.name}</p>
															<p className="text-xs text-muted-foreground">{p.category}</p>
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className="font-bold text-foreground">Rs. {p.price}</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center gap-2">
														<div className={`w-2 h-2 rounded-full ${p.stock > 10 ? 'bg-green-500' : p.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
														<span className="font-semibold">{p.stock} units</span>
													</div>
													{p.stock === 0 && <span className="text-[10px] text-red-500 font-bold uppercase mt-1 block">Out of Stock</span>}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<button
														onClick={() => setPendingAction({ type: "toggle", product: p })}
														className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
															p.isActive 
																? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
																: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
														}`}
														title="Click to toggle"
													>
														{p.isActive ? "Active" : "Inactive"}
													</button>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-right">
													<div className="flex items-center justify-end gap-2">
														<Link
															href={`/dashboard/pharmacy/products/edit/${p._id}`}
															className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-primary/5 transition-colors"
														>
															Edit
														</Link>
														<button
															onClick={() => setPendingAction({ type: "delete", productId: p._id, productName: p.name })}
															className="rounded-lg bg-red-50 text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 transition-colors"
														>
															Delete
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<div className="flex justify-center items-center gap-2 bg-card border border-border p-2 rounded-xl w-fit mx-auto shadow-sm">
							<button
								onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
								disabled={safeCurrentPage === 1}
								className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
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
								className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
							>
								Next
							</button>
						</div>
					)}
				</div>
			</main>
			<ConfirmModal
				open={pendingAction !== null}
				title={pendingAction?.type === "delete" ? "Confirm Delete" : "Confirm Status Change"}
				message={
					pendingAction?.type === "delete"
						? `Delete ${pendingAction.productName}? This action cannot be undone.`
						: pendingAction?.type === "toggle"
							? `Mark ${pendingAction.product.name} as ${pendingAction.product.isActive ? "Inactive" : "Active"}?`
							: ""
				}
				onCancel={() => setPendingAction(null)}
				onConfirm={runPendingAction}
				confirmLabel={pendingAction?.type === "delete" ? "Delete" : "Confirm"}
				danger={pendingAction?.type === "delete"}
			/>
		</div>
	);
}
