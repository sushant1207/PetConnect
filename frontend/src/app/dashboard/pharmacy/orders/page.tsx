"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/Sidebar";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface User {
	_id: string;
	email: string;
	role: string;
	firstName?: string;
	lastName?: string;
}

interface OrderItem {
	productName: string;
	price: number;
	quantity: number;
}

interface Order {
	_id: string;
	userName: string;
	items: OrderItem[];
	totalAmount: number;
	status: string;
	paymentStatus: string;
	paymentMethod?: string;
	shippingAddress?: { address?: string; phone?: string; firstName?: string; lastName?: string };
	createdAt: string;
}

export default function PharmacyOrdersPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	
	const [filter, setFilter] = useState<string>("all");
	const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
	const [searchQuery, setSearchQuery] = useState("");

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
			fetchOrders(token);
		} catch {
			router.push("/login");
		} finally {
			setLoading(false);
		}
	}, [router]);

	const fetchOrders = async (token: string) => {
		try {
			const res = await fetch("http://localhost:5555/api/pharmacy/orders", {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (res.ok && data.orders) setOrders(data.orders);
		} catch (err) {
			console.error(err);
		}
	};

	const updateStatus = async (orderId: string, status: string) => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`http://localhost:5555/api/pharmacy/orders/${orderId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ status }),
			});
			if (res.ok) {
				setOrders((prev) =>
					prev.map((o) => (o._id === orderId ? { ...o, status } : o))
				);
			} else {
				const data = await res.json();
				alert(data.message || "Failed to update status");
			}
		} catch {
			alert("Failed to update status");
		}
	};

	const downloadInvoice = async (order: Order) => {
		const doc = new jsPDF();
		
		doc.setFontSize(20);
		doc.text("PetConnect Pharmacy - Invoice", 105, 20, { align: "center" });

		doc.setFontSize(12);
		doc.text(`Order ID: ${order._id}`, 20, 40);
		doc.text(`Customer: ${order.userName || "Customer"}`, 20, 50);
		doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 60);
		if (order.shippingAddress?.address) {
			doc.text(`Address: ${order.shippingAddress.address}`, 20, 70);
		}

		doc.setFontSize(14);
		doc.text("Items:", 20, 90);
		
		doc.setFontSize(12);
		let y = 100;
		doc.text("Product", 20, y);
		doc.text("Qty", 120, y);
		doc.text("Price", 140, y);
		doc.text("Total", 170, y);
		
		y += 5;
		doc.line(20, y, 190, y);
		y += 10;

		order.items.forEach(item => {
			doc.text(item.productName.substring(0, 40), 20, y);
			doc.text(item.quantity.toString(), 120, y);
			doc.text(`Rs. ${item.price}`, 140, y);
			doc.text(`Rs. ${item.price * item.quantity}`, 170, y);
			y += 10;
		});

		y += 5;
		doc.line(20, y, 190, y);
		y += 10;
		
		doc.setFontSize(14);
		doc.text(`Grand Total: Rs. ${order.totalAmount}`, 140, y);
		doc.setFontSize(10);
		doc.setTextColor(100);
		doc.text("Thank you for choosing PetConnect Pharmacy!", 105, y+30, { align: "center" });

		doc.save(`Invoice_${order._id}.pdf`);
	};

	let processed = orders.filter(o => {
		if (filter !== "all" && o.status !== filter) return false;
		if (searchQuery.trim() !== "") {
			const term = searchQuery.toLowerCase();
			return (o.userName || "Customer").toLowerCase().includes(term) ||
				   o._id.toLowerCase().includes(term) ||
				   (o.shippingAddress?.address || "").toLowerCase().includes(term);
		}
		return true;
	});

	processed.sort((a, b) => {
		const timeA = new Date(a.createdAt).getTime();
		const timeB = new Date(b.createdAt).getTime();
		return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
	});

	if (loading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
							<h1 className="text-3xl font-bold mb-2">Customer Orders</h1>
							<p className="text-muted-foreground">Manage order fulfillments, payment statuses, and updates.</p>
						</div>
					</div>

					<div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-8 flex flex-col xl:flex-row gap-4 items-center justify-between">
						<div className="flex gap-2 overflow-x-auto w-full xl:w-auto p-1 scrollbar-hide">
							{["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
								<button
									key={s}
									onClick={() => setFilter(s)}
									className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize whitespace-nowrap transition-all duration-200 ${
										filter === s
											? "bg-primary text-primary-foreground shadow-sm"
											: "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
									}`}
								>
									{s}
								</button>
							))}
						</div>

						<div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
							<div className="relative flex-1">
								<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">🔍</span>
								<input
									type="text"
									placeholder="Search orders..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
								/>
							</div>
							<select
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
								className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
							>
								<option value="newest">Newest First</option>
								<option value="oldest">Oldest First</option>
							</select>
						</div>
					</div>

					{processed.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
							<div className="text-5xl mb-4 opacity-75">🧾</div>
							<h3 className="text-xl font-bold mb-2">No orders found</h3>
							<p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{processed.map((order) => (
								<div
									key={order._id}
									className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col"
								>
									<div className={`absolute top-0 left-0 w-1.5 h-full ${
										order.status === "delivered" ? "bg-green-500" :
										order.status === "shipped" ? "bg-blue-500" :
										order.status === "processing" ? "bg-purple-500" :
										order.status === "pending" ? "bg-yellow-500" : "bg-red-500"
									}`}></div>

									<div className="flex justify-between items-start mb-4 pl-2">
										<div>
											<p className="font-bold text-lg leading-tight mb-1 flex items-center gap-2">
												{order.userName || "Customer"} 
												{order.shippingAddress?.firstName && <span className="text-sm font-normal text-muted-foreground">({order.shippingAddress.firstName} {order.shippingAddress.lastName || ""})</span>}
											</p>
											<p className="text-xs text-muted-foreground">
												<span className="font-mono text-[10px] bg-muted/50 px-1 py-0.5 rounded mr-2">ID: {order._id.substring(order._id.length - 8).toUpperCase()}</span>
												{new Date(order.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}
											</p>
										</div>
										<div className="flex flex-col items-end">
											<span className="text-xl font-black text-foreground">Rs. {order.totalAmount}</span>
											<span className={`text-[10px] uppercase font-bold tracking-wider mt-1 px-2 py-0.5 rounded border ${
												order.paymentStatus === 'completed' ? 'border-green-200 bg-green-50 text-green-700' : 'border-yellow-200 bg-yellow-50 text-yellow-700'
											}`}>
												{order.paymentStatus === 'completed' ? 'Paid' : 'Pending Payment'} ({order.paymentMethod || "esewa"})
											</span>
										</div>
									</div>

									<div className="pl-2 mb-4">
										{order.shippingAddress?.address ? (
											<div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm flex gap-3 items-start">
												<span className="shrink-0 text-muted-foreground">📍</span>
												<div>
													<p className="font-medium text-foreground">{order.shippingAddress.address}</p>
													{order.shippingAddress.phone && <p className="text-muted-foreground mt-0.5 font-mono text-xs">{order.shippingAddress.phone}</p>}
												</div>
											</div>
										) : (
											<div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm flex gap-3 items-start">
												<span className="shrink-0">⚠️</span>
												<p>No shipping address provided.</p>
											</div>
										)}
									</div>

									<div className="pl-2 mb-6 flex-1">
										<p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Order Items ({order.items.reduce((acc, curr) => acc + curr.quantity, 0)})</p>
										<div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-hide">
											{order.items.map((item, i) => (
												<div key={i} className="flex justify-between items-center text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
													<div className="font-medium text-foreground truncate pr-4 flex items-center gap-2">
														<span className="w-5 h-5 bg-primary/10 text-primary font-bold rounded flex items-center justify-center text-[10px] shrink-0">{item.quantity}x</span>
														<span className="truncate">{item.productName}</span>
													</div>
													<div className="font-semibold text-muted-foreground whitespace-nowrap">Rs. {item.price * item.quantity}</div>
												</div>
											))}
										</div>
									</div>

									<div className="mt-auto pl-2 border-t border-border/50 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
										<div className="flex flex-col gap-2">
											<div className="flex items-center gap-2">
												<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
												<span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
													order.status === "delivered" ? "bg-green-100 text-green-800" : 
													order.status === "shipped" ? "bg-blue-100 text-blue-800" :
													order.status === "processing" ? "bg-purple-100 text-purple-800" :
													order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
												}`}>{order.status}</span>
											</div>
											<button 
												onClick={() => downloadInvoice(order)}
												className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
											>
												📄 Download Invoice PDF
											</button>
										</div>

										<div className="flex gap-2 w-full sm:w-auto overflow-x-auto shrink-0 hide-scrollbar pb-1 sm:pb-0">
											{/* Status Progression Workflow */}
											{order.status === "processing" && (
												<button
													onClick={() => updateStatus(order._id, "shipped")}
													className="whitespace-nowrap rounded-lg bg-blue-50 text-blue-700 px-4 py-2 text-sm font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-md transition-all border border-blue-200"
												>
													📦 Mark as Shipped
												</button>
											)}
											{order.status === "shipped" && (
												<button
													onClick={() => updateStatus(order._id, "delivered")}
													className="whitespace-nowrap rounded-lg bg-green-50 text-green-700 px-4 py-2 text-sm font-bold shadow-sm hover:bg-green-600 hover:text-white hover:shadow-md transition-all border border-green-200"
												>
													✅ Mark as Delivered
												</button>
											)}
											{order.status === "pending" && (
												<button
													onClick={() => updateStatus(order._id, "processing")}
													className="whitespace-nowrap rounded-lg bg-purple-50 text-purple-700 px-4 py-2 text-sm font-bold shadow-sm hover:bg-purple-600 hover:text-white hover:shadow-md transition-all border border-purple-200"
												>
													⚙️ Start Processing
												</button>
											)}
										</div>
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
