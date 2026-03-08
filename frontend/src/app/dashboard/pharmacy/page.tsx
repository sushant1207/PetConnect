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

interface Product {
	_id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	stock: number;
	pharmacyId?: { _id: string; firstName: string; lastName: string };
}

interface Vendor {
	pharmacy: { _id: string; firstName: string; lastName: string; email: string };
	products: Product[];
}

interface CartItem extends Product {
	quantity: number;
}

export default function PharmacyPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [vendors, setVendors] = useState<Vendor[]>([]);
	const [loading, setLoading] = useState(true);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [checkoutVendor, setCheckoutVendor] = useState<Vendor | null>(null);
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [shippingAddress, setShippingAddress] = useState({
		firstName: "",
		lastName: "",
		email: "",
		address: "",
		phone: "",
	});
	const [paying, setPaying] = useState(false);

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

	const addToCart = (product: Product, vendor: Vendor) => {
		setCart((prev) => {
			const existing = prev.find((p) => p._id === product._id);
			if (existing) {
				if (existing.quantity >= product.stock) return prev;
				return prev.map((p) =>
					p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p
				);
			}
			return [...prev, { ...product, quantity: 1 }];
		});
		setCheckoutVendor(vendor);
	};

	const updateQuantity = (productId: string, delta: number) => {
		setCart((prev) => {
			const item = prev.find((p) => p._id === productId);
			if (!item) return prev;
			const q = Math.max(0, Math.min(item.stock, item.quantity + delta));
			if (q === 0) return prev.filter((p) => p._id !== productId);
			return prev.map((p) =>
				p._id === productId ? { ...p, quantity: q } : p
			);
		});
	};

	const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

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

	// Pharmacy role: redirect to their dashboard
	if (user.role === "pharmacy") {
		router.push("/dashboard");
		return null;
	}

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-6xl mx-auto">
					<h1 className="text-3xl font-bold mb-2">Pharmacy</h1>
					<p className="text-muted-foreground mb-8">Browse products from pharmacy vendors</p>

					{/* Cart summary */}
					{cart.length > 0 && (
						<div className="fixed top-4 right-8 z-10 rounded-xl border border-border bg-card p-4 shadow-lg min-w-[200px]">
							<p className="font-semibold mb-2">Cart ({cart.length} items)</p>
							<p className="text-xl font-bold text-primary">Rs. {cartTotal}</p>
							<button
								onClick={() => setCheckoutOpen(true)}
								className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
							>
								Checkout
							</button>
						</div>
					)}

					{vendors.length === 0 ? (
						<div className="rounded-xl border border-border bg-card p-12 text-center">
							<p className="text-muted-foreground">No pharmacy vendors with products yet</p>
							<p className="text-sm text-muted-foreground mt-2">
								Pharmacies can add products from their dashboard
							</p>
						</div>
					) : (
						<div className="space-y-10">
							{vendors.map((vendor) => (
								<div key={vendor.pharmacy._id} className="rounded-xl border border-border bg-card p-6">
									<h2 className="text-xl font-semibold mb-4">
										{vendor.pharmacy.firstName} {vendor.pharmacy.lastName}
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{vendor.products.map((p) => (
											<div
												key={p._id}
												className="rounded-lg border border-border bg-background p-4"
											>
												<h3 className="font-semibold">{p.name}</h3>
												<p className="text-sm text-muted-foreground">{p.category}</p>
												<p className="text-lg font-bold text-primary mt-1">Rs. {p.price}</p>
												<p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
												<button
													onClick={() => addToCart(p, vendor)}
													disabled={p.stock === 0}
													className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
												>
													Add to Cart
												</button>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</main>

			{/* Checkout modal */}
			{checkoutOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
						<h2 className="text-xl font-bold mb-4">Checkout</h2>
						<div className="space-y-4 mb-6">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">First Name *</label>
									<input
										type="text"
										required
										value={shippingAddress.firstName}
										onChange={(e) =>
											setShippingAddress({ ...shippingAddress, firstName: e.target.value })
										}
										className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Last Name *</label>
									<input
										type="text"
										value={shippingAddress.lastName}
										onChange={(e) =>
											setShippingAddress({ ...shippingAddress, lastName: e.target.value })
										}
										className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Email *</label>
								<input
									type="email"
									required
									value={shippingAddress.email}
									onChange={(e) =>
										setShippingAddress({ ...shippingAddress, email: e.target.value })
									}
									className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Address *</label>
								<textarea
									required
									rows={2}
									value={shippingAddress.address}
									onChange={(e) =>
										setShippingAddress({ ...shippingAddress, address: e.target.value })
									}
									className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Phone *</label>
								<input
									type="tel"
									required
									value={shippingAddress.phone}
									onChange={(e) =>
										setShippingAddress({ ...shippingAddress, phone: e.target.value })
									}
									className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
								/>
							</div>
						</div>

						<div className="border-t border-border pt-4 mb-4">
							<p className="text-sm font-medium mb-2">Order summary</p>
							{cart.map((item) => (
								<div key={item._id} className="flex justify-between text-sm mb-1">
									<span>
										{item.name} x {item.quantity}
									</span>
									<span>Rs. {item.price * item.quantity}</span>
								</div>
							))}
							<div className="flex justify-between font-bold mt-2">
								<span>Total</span>
								<span>Rs. {cartTotal}</span>
							</div>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setCheckoutOpen(false)}
								className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-primary/5"
							>
								Cancel
							</button>
							<button
								onClick={handlePayWithEsewa}
								disabled={paying}
								className="flex-1 rounded-lg bg-[#60BB46] py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
							>
								{paying ? "Redirecting..." : "Pay with eSewa"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
