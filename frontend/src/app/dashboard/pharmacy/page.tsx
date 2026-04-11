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

interface ProductImage {
	public_id?: string;
	url?: string;
}

interface Product {
	_id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	stock: number;
	images?: Array<string | ProductImage>;
	pharmacyId?: { _id: string; firstName: string; lastName: string };
}

interface Vendor {
	pharmacy: { _id: string; firstName: string; lastName: string; email: string };
	products: Product[];
}

interface CartItem extends Product {
	quantity: number;
}

const toAbsoluteImageUrl = (rawUrl: string) => {
	if (!rawUrl) return "";
	if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
	return `http://localhost:5555${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
};

const getProductImageUrls = (images?: Array<string | ProductImage>) => {
	if (!images || images.length === 0) return [];
	return images
		.map((img) => (typeof img === "string" ? img : img?.url || ""))
		.filter(Boolean)
		.map((url) => toAbsoluteImageUrl(url));
};

export default function PharmacyPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [vendors, setVendors] = useState<Vendor[]>([]);
	const [loading, setLoading] = useState(true);
	
	const [cart, setCart] = useState<CartItem[]>([]);
	const [stockError, setStockError] = useState("");
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [shippingAddress, setShippingAddress] = useState({
		firstName: "",
		lastName: "",
		email: "",
		address: "",
		phone: "",
	});
	const [paying, setPaying] = useState(false);

	// Filters, Search, Sort, Pagination
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [maxPrice, setMaxPrice] = useState<number | "">("");
	const [sortOrder, setSortOrder] = useState<"default" | "price_asc" | "price_desc" | "name">("default");
	const [currentPage, setCurrentPage] = useState(1);
	const [imageIndexByProduct, setImageIndexByProduct] = useState<Record<string, number>>({});
	const ITEMS_PER_PAGE = 12;

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
			if (parsed.firstName) setShippingAddress((s) => ({ ...s, firstName: parsed.firstName }));
			if (parsed.lastName) setShippingAddress((s) => ({ ...s, lastName: parsed.lastName }));
			if (parsed.email) setShippingAddress((s) => ({ ...s, email: parsed.email }));
			fetchVendors();
		} catch {
			router.push("/login");
		} finally {
			setLoading(false);
		}
	}, [router]);

	const fetchVendors = async () => {
		try {
			const res = await fetch("http://localhost:5555/api/pharmacy/vendors");
			const data = await res.json();
			if (res.ok && data.vendors) setVendors(data.vendors);
		} catch (err) {
			console.error(err);
		}
	};

	const showStockExceeded = (productName: string, maxStock: number) => {
		setStockError(`Cannot add more than ${maxStock} unit${maxStock === 1 ? "" : "s"} of ${productName}. Exceeded amount is not in stock.`);
	};

	const addToCart = (product: Product, _vendor: Vendor) => {
		if (product.stock <= 0) {
			showStockExceeded(product.name, 0);
			return;
		}

		setCart((prev) => {
			const existing = prev.find((p) => p._id === product._id);
			if (existing) {
				if (existing.quantity >= product.stock) {
					showStockExceeded(product.name, product.stock);
					return prev;
				}
				return prev.map((p) =>
					p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p
				);
			}
			setStockError("");
			return [...prev, { ...product, quantity: 1 }];
		});
	};

	const updateCartQuantity = (productId: string, delta: number) => {
		setCart((prev) => {
			const item = prev.find((p) => p._id === productId);
			if (!item) return prev;

			if (delta > 0 && item.quantity >= item.stock) {
				showStockExceeded(item.name, item.stock);
				return prev;
			}

			setStockError("");
			const q = Math.max(0, Math.min(item.stock, item.quantity + delta));
			if (q === 0) return prev.filter((p) => p._id !== productId);
			return prev.map((p) =>
				p._id === productId ? { ...p, quantity: q } : p
			);
		});
	};

	const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

	const moveSlider = (productId: string, totalImages: number, direction: 1 | -1) => {
		if (totalImages <= 1) return;
		setImageIndexByProduct((prev) => {
			const current = prev[productId] ?? 0;
			const next = (current + direction + totalImages) % totalImages;
			return { ...prev, [productId]: next };
		});
	};

	useEffect(() => {
		if (!stockError) return;
		const timer = window.setTimeout(() => setStockError(""), 3000);
		return () => window.clearTimeout(timer);
	}, [stockError]);

	const handlePayWithEsewa = async () => {
		if (cart.length === 0 || !user) return;
		if (!shippingAddress.firstName || !shippingAddress.address || !shippingAddress.phone) {
			alert("Please fill in required shipping details");
			return;
		}

		setPaying(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("http://localhost:5555/api/pharmacy/orders/pay/esewa", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					items: cart.map((c) => ({ productId: c._id, quantity: c.quantity })),
					shippingAddress,
					paymentMethod: "esewa",
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				alert(data.message || "Failed to initiate payment");
				setPaying(false);
				return;
			}

			if (data.esewaData) {
				const form = document.createElement("form");
				form.setAttribute("method", "POST");
				form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");
				for (const key in data.esewaData) {
					const input = document.createElement("input");
					input.setAttribute("type", "hidden");
					input.setAttribute("name", key);
					input.setAttribute("value", String(data.esewaData[key]));
					form.appendChild(input);
				}
				document.body.appendChild(form);
				form.submit();
			}
		} catch (err) {
			alert("Failed to initiate payment");
			setPaying(false);
		}
	};

	if (loading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (user.role === "pharmacy") {
		router.push("/dashboard");
		return null;
	}

	// 1. Flatten products
	const allProducts = vendors.flatMap(v => 
		v.products.map(p => ({ ...p, vendorName: `${v.pharmacy.firstName} ${v.pharmacy.lastName}`, vendorObj: v }))
	);

	const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category)));

	// 2. Filter
	let processed = allProducts.filter(p => {
		if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
		if (maxPrice !== "" && p.price > Number(maxPrice)) return false;
		if (searchQuery.trim() !== "") {
			const term = searchQuery.toLowerCase();
			return p.name.toLowerCase().includes(term) || 
				   p.description.toLowerCase().includes(term) ||
				   p.vendorName.toLowerCase().includes(term) ||
				   p.category.toLowerCase().includes(term);
		}
		return true;
	});

	// 3. Sort
	if (sortOrder === "price_asc") processed.sort((a, b) => a.price - b.price);
	else if (sortOrder === "price_desc") processed.sort((a, b) => b.price - a.price);
	else if (sortOrder === "name") processed.sort((a, b) => a.name.localeCompare(b.name));

	// 4. Pagination
	const totalPages = Math.max(1, Math.ceil(processed.length / ITEMS_PER_PAGE));
	const safeCurrentPage = Math.min(currentPage, totalPages);
	if (currentPage !== safeCurrentPage && safeCurrentPage > 0) {
		setCurrentPage(safeCurrentPage);
	}

	const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
	const paginatedProducts = processed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-7xl mx-auto">
					{stockError && (
						<div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
							{stockError}
						</div>
					)}

					{/* Header */}
					<div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold mb-2">Pharmacy</h1>
							<p className="text-muted-foreground">Browse high-quality products from trusted pharmacy vendors.</p>
						</div>
						<Link
							href="/dashboard/pharmacy/tracking"
							className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-primary/5"
						>
							Track Orders
						</Link>
					</div>

					{/* Filters & Search Bar */}
					<div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
						<div className="relative w-full lg:w-1/3">
							<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">🔍</span>
							<input
								type="text"
								placeholder="Search products, vendors..."
								value={searchQuery}
								onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
								className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
							/>
						</div>
						
						<div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
							<select
								value={categoryFilter}
								onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
								className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
							>
								<option value="all">All Categories</option>
								{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
							</select>
							
							<div className="relative">
								<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm font-medium">Max Rs.</span>
								<input 
									type="number"
									min="0"
									placeholder="Any Price"
									value={maxPrice}
									onChange={(e) => { setMaxPrice(e.target.value === "" ? "" : Number(e.target.value)); setCurrentPage(1); }}
									className="w-full sm:w-32 rounded-lg border border-input bg-background pl-16 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>

							<select
								value={sortOrder}
								onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1); }}
								className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
							>
								<option value="default">Sort by: Default</option>
								<option value="price_asc">Price: Low to High</option>
								<option value="price_desc">Price: High to Low</option>
								<option value="name">Name: A to Z</option>
							</select>
						</div>
					</div>

					<div className="flex flex-col xl:flex-row gap-8 items-start">
						
						{/* Products Grid */}
						<div className="flex-1 w-full">
							{paginatedProducts.length === 0 ? (
								<div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
									<div className="text-5xl mb-4 opacity-75">📦</div>
									<h3 className="text-xl font-semibold mb-2">No products found</h3>
									<p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
									{paginatedProducts.map((p) => (
										<div
											key={p._id}
											className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
										>
											<div className="h-40 bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
													{getProductImageUrls(p.images).length > 0 ? (
														<img
															src={getProductImageUrls(p.images)[imageIndexByProduct[p._id] ?? 0]}
															alt={p.name}
															className="w-full h-full object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300"
														/>
												) : (
													<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
												)}
													{getProductImageUrls(p.images).length > 1 && (
														<>
															<button
																onClick={() => moveSlider(p._id, getProductImageUrls(p.images).length, -1)}
																className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background/90 border border-border text-xs font-bold"
																title="Previous image"
															>
																&lt;
															</button>
															<button
																onClick={() => moveSlider(p._id, getProductImageUrls(p.images).length, 1)}
																className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background/90 border border-border text-xs font-bold"
																title="Next image"
															>
																&gt;
															</button>
														</>
													)}
												<span className="absolute top-3 right-3 bg-background/90 backdrop-blur border border-border text-xs font-semibold px-2 py-1 rounded-md text-foreground shadow-sm">
													{p.category}
												</span>
											</div>
											<div className="p-5 flex-1 flex flex-col">
												<div className="mb-1 text-xs font-medium text-primary line-clamp-1">{p.vendorName}</div>
												<h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{p.name}</h3>
												<p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{p.description}</p>
												
												<div className="flex items-end justify-between mt-auto pt-4 border-t border-border/50">
													<div>
														<p className="text-2xl font-black text-foreground">Rs. {p.price}</p>
														<p className={`text-xs mt-1 font-medium ${p.stock > 0 ? "text-green-600" : "text-destructive"}`}>
															{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
														</p>
													</div>
													<button
														onClick={() => addToCart(p, p.vendorObj)}
														disabled={p.stock === 0}
														className="rounded-lg bg-primary h-10 w-10 flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-colors"
														title="Add to Cart"
													>
														<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}

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
						</div>

						{/* Cart Sidebar */}
						{cart.length > 0 && (
							<div className="w-full xl:w-80 rounded-2xl border border-border bg-card shadow-lg shrink-0 sticky top-6 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
								<div className="p-5 border-b border-border bg-muted/30">
									<h2 className="text-xl font-bold flex items-center justify-between">
										Your Cart
										<span className="bg-primary text-primary-foreground text-sm px-2.5 py-0.5 rounded-full">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
									</h2>
								</div>
								
								<div className="overflow-y-auto p-5 flex-1 space-y-4 min-h-[150px]">
									{cart.map((item) => (
										<div key={item._id} className="flex gap-3 items-start">
											<div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
												{getProductImageUrls(item.images).length > 0 ? (
													<img src={getProductImageUrls(item.images)[0]} alt={item.name} className="w-full h-full object-cover" />
												) : (
													<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold text-sm leading-tight truncate">{item.name}</h4>
												<div className="text-primary font-bold text-sm mt-1">Rs. {item.price}</div>
												<div className="flex items-center gap-2 mt-2">
													<button onClick={() => updateCartQuantity(item._id, -1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors">-</button>
													<span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
													<button
														onClick={() => updateCartQuantity(item._id, 1)}
														disabled={item.quantity >= item.stock}
														className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														title={item.quantity >= item.stock ? "Exceeded amount is not in stock" : "Increase quantity"}
													>
														+
													</button>
												</div>
												{item.quantity >= item.stock && item.stock > 0 && (
													<p className="mt-1 text-[10px] font-semibold text-destructive">Max limit reached</p>
												)}
											</div>
											<div className="font-bold text-sm whitespace-nowrap">Rs. {item.price * item.quantity}</div>
										</div>
									))}
								</div>

								<div className="p-5 bg-muted/30 border-t border-border">
									<div className="flex justify-between items-center mb-4 text-lg">
										<span className="font-medium text-muted-foreground">Total</span>
										<span className="font-black text-2xl text-foreground">Rs. {cartTotal}</span>
									</div>
									<button
										onClick={() => setCheckoutOpen(true)}
										className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
									>
										Proceed to Checkout
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</main>

			{/* Checkout modal */}
			{checkoutOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh]">
						<div className="flex justify-between items-center mb-6 shrink-0">
							<h2 className="text-2xl font-bold">Checkout</h2>
							<button onClick={() => setCheckoutOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
						</div>

						<div className="overflow-y-auto pr-2 -mr-2 flex-1 scrollbar-hide">
							<div className="space-y-4 mb-8">
								<h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Shipping Details</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-xs font-medium mb-1.5 text-muted-foreground">First Name <span className="text-destructive">*</span></label>
										<input
											type="text"
											required
											value={shippingAddress.firstName}
											onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
											className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium mb-1.5 text-muted-foreground">Last Name <span className="text-destructive">*</span></label>
										<input
											type="text"
											value={shippingAddress.lastName}
											onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
											className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</div>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1.5 text-muted-foreground">Email Address <span className="text-destructive">*</span></label>
									<input
										type="email"
										required
										value={shippingAddress.email}
										onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
										className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1.5 text-muted-foreground">Delivery Address <span className="text-destructive">*</span></label>
									<textarea
										required
										rows={2}
										value={shippingAddress.address}
										onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
										className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1.5 text-muted-foreground">Phone Number <span className="text-destructive">*</span></label>
									<input
										type="tel"
										required
										value={shippingAddress.phone}
										onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
										className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
									/>
								</div>
							</div>

							<div className="mb-6">
								<h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-4">Order Summary</h3>
								<div className="space-y-3">
									{cart.map((item) => (
										<div key={item._id} className="flex justify-between text-sm">
											<span className="font-medium text-muted-foreground">
												{item.name} <span className="text-xs px-1">x</span> {item.quantity}
											</span>
											<span className="font-semibold">Rs. {item.price * item.quantity}</span>
										</div>
									))}
									<div className="flex justify-between items-center pt-4 border-t border-border/50">
										<span className="font-semibold">Total Amount</span>
										<span className="text-xl font-black text-primary">Rs. {cartTotal}</span>
									</div>
								</div>
							</div>
						</div>

						<div className="pt-6 border-t border-border shrink-0">
							<button
								onClick={handlePayWithEsewa}
								disabled={paying}
								className={`w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg ${paying ? 'bg-muted text-muted-foreground cursor-wait' : 'bg-[#60BB46] hover:bg-[#52a33b]'}`}
							>
								{paying ? "Processing Payment..." : "Pay Securely via eSewa"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
