"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "../../../components/Sidebar";
import jsPDF from "jspdf";

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
	status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
	paymentStatus: string;
	totalAmount: number;
	items: OrderItem[];
	createdAt: string;
	shippingAddress?: {
		address?: string;
		phone?: string;
	};
}

const TRACK_STAGES = ["pending", "processing", "shipped", "delivered"] as const;

const getStatusBadgeClass = (status: Order["status"]) => {
	switch (status) {
		case "delivered":
			return "bg-green-100 text-green-800 border-green-200";
		case "shipped":
			return "bg-blue-100 text-blue-800 border-blue-200";
		case "processing":
			return "bg-purple-100 text-purple-800 border-purple-200";
		case "pending":
			return "bg-yellow-100 text-yellow-800 border-yellow-200";
		default:
			return "bg-red-100 text-red-800 border-red-200";
	}
};

const getStageIndex = (status: Order["status"]) => {
	const idx = TRACK_STAGES.indexOf(status as (typeof TRACK_STAGES)[number]);
	return idx;
};

export default function PharmacyOrderTrackingPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [invoicePreviewUrl, setInvoicePreviewUrl] = useState("");
	const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);

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
			if (parsed.role === "pharmacy") {
				router.push("/dashboard/pharmacy/orders");
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
			const res = await fetch("http://localhost:5555/api/pharmacy/orders/user", {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (res.ok && data.orders) {
				setOrders(data.orders);
			}
		} catch (error) {
			console.error("Failed to fetch user orders", error);
		}
	};

	const filteredOrders = useMemo(() => {
		return orders.filter((order) => {
			if (statusFilter !== "all" && order.status !== statusFilter) return false;
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			const orderCode = order._id.slice(-8).toLowerCase();
			return (
				order._id.toLowerCase().includes(q) ||
				orderCode.includes(q) ||
				order.status.toLowerCase().includes(q)
			);
		});
	}, [orders, searchQuery, statusFilter]);

	const buildInvoiceDoc = (order: Order) => {
		const doc = new jsPDF();

		doc.setFontSize(20);
		doc.text("PetConnect Pharmacy - Invoice", 105, 20, { align: "center" });

		doc.setFontSize(12);
		doc.text(`Order ID: ${order._id}`, 20, 40);
		doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 50);
		if (order.shippingAddress?.address) {
			doc.text(`Address: ${order.shippingAddress.address}`, 20, 60);
		}

		doc.setFontSize(14);
		doc.text("Items:", 20, 80);

		doc.setFontSize(12);
		let y = 90;
		doc.text("Product", 20, y);
		doc.text("Qty", 120, y);
		doc.text("Price", 140, y);
		doc.text("Total", 170, y);

		y += 5;
		doc.line(20, y, 190, y);
		y += 10;

		order.items.forEach((item) => {
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
		doc.text("Thank you for choosing PetConnect Pharmacy!", 105, y + 25, { align: "center" });

		return doc;
	};

	const downloadInvoice = (order: Order) => {
		const doc = buildInvoiceDoc(order);
		doc.save(`Invoice_${order._id}.pdf`);
	};

	const viewInvoice = (order: Order) => {
		if (invoicePreviewUrl) {
			URL.revokeObjectURL(invoicePreviewUrl);
		}
		const doc = buildInvoiceDoc(order);
		const blob = doc.output("blob");
		const url = URL.createObjectURL(blob);
		setInvoicePreviewUrl(url);
		setInvoicePreviewOpen(true);
	};

	const closeInvoicePreview = () => {
		if (invoicePreviewUrl) {
			URL.revokeObjectURL(invoicePreviewUrl);
		}
		setInvoicePreviewUrl("");
		setInvoicePreviewOpen(false);
	};

	if (loading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-6xl mx-auto">
					<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="text-3xl font-bold mb-2">Order Tracking</h1>
							<p className="text-muted-foreground">Track every pharmacy order stage from pending to delivered.</p>
						</div>
						<Link
							href="/dashboard/pharmacy"
							className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-primary/5"
						>
							Back to Pharmacy
						</Link>
					</div>

					<div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-wrap gap-2">
							{(["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const).map((status) => (
								<button
									key={status}
									onClick={() => setStatusFilter(status)}
									className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
										statusFilter === status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
									}`}
								>
									{status}
								</button>
							))}
						</div>
						<input
							type="text"
							placeholder="Search by order ID or status"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full lg:w-72 rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
						/>
					</div>

					{filteredOrders.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border bg-card/50 p-14 text-center">
							<div className="text-4xl mb-3">📦</div>
							<h3 className="text-xl font-bold mb-2">No orders to track</h3>
							<p className="text-muted-foreground mb-5">Place an order in pharmacy to see live status updates here.</p>
							<Link href="/dashboard/pharmacy" className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
								Browse Products
							</Link>
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
							{filteredOrders.map((order) => {
								const stageIdx = getStageIndex(order.status);
								const stageLabels = ["Pending", "Processing", "Shipped", "Delivered"];
								return (
									<div key={order._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
										<div className="flex items-start justify-between gap-3 mb-4">
											<div>
												<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</p>
												<p className="font-mono text-sm font-bold">#{order._id.slice(-8).toUpperCase()}</p>
												<p className="text-xs text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleString()}</p>
											</div>
											<div className="text-right">
												<span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${getStatusBadgeClass(order.status)}`}>
													{order.status}
												</span>
												<p className="text-xs mt-2 text-muted-foreground">Payment: {order.paymentStatus}</p>
												<p className="text-sm font-bold mt-1">Rs. {order.totalAmount}</p>
											</div>
										</div>

										{order.status === "cancelled" ? (
											<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 font-medium">
												This order was cancelled.
											</div>
										) : (
											<div className="mb-4">
												<div className="flex items-center justify-between">
													{stageLabels.map((label, index) => {
														const active = index <= stageIdx;
														return (
															<div key={label} className="flex flex-col items-center flex-1">
																<div className={`h-7 w-7 rounded-full border text-[11px] font-bold flex items-center justify-center ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"}`}>
																	{index + 1}
																</div>
																<span className={`mt-2 text-[10px] font-semibold uppercase ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
															</div>
														);
													})}
												</div>
											</div>
										)}

										<div className="rounded-lg bg-muted/30 border border-border/50 p-3">
											<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})</p>
											<div className="space-y-1.5">
												{order.items.map((item, idx) => (
													<div key={`${order._id}-${idx}`} className="flex justify-between text-sm">
														<span className="text-muted-foreground">{item.productName} x {item.quantity}</span>
														<span className="font-semibold">Rs. {item.price * item.quantity}</span>
													</div>
												))}
											</div>
										</div>

										<div className="mt-3 flex gap-2">
											<button
												onClick={() => viewInvoice(order)}
												className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-primary/5"
											>
												View Invoice
											</button>
											<button
												onClick={() => downloadInvoice(order)}
												className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-primary/5"
											>
												Download Invoice
											</button>
										</div>

										{order.shippingAddress?.address && (
											<p className="mt-3 text-xs text-muted-foreground">
												Delivery: {order.shippingAddress.address}
											</p>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>

			{invoicePreviewOpen && invoicePreviewUrl && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
					<div className="w-full max-w-5xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
						<div className="flex items-center justify-between border-b border-border px-4 py-3">
							<h3 className="text-sm font-semibold">Invoice Preview</h3>
							<button
								onClick={closeInvoicePreview}
								className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-primary/5"
							>
								Close
							</button>
						</div>
						<iframe
							src={invoicePreviewUrl}
							title="Invoice PDF Preview"
							className="h-[75vh] w-full"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
