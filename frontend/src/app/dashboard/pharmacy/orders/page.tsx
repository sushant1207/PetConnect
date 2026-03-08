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
	const [filter, setFilter] = useState<string>("");

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
			fetchOrders(token, filter);
		} catch {
			router.push("/login");
		} finally {
			setLoading(false);
		}
	}, [router, filter]);

	const fetchOrders = async (token: string, statusFilter?: string) => {
		try {
			const url = statusFilter
				? `http://localhost:5555/api/pharmacy/orders?status=${statusFilter}`
				: "http://localhost:5555/api/pharmacy/orders";
			const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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
					<h1 className="text-3xl font-bold mb-2">Orders</h1>
					<p className="text-muted-foreground mb-8">Manage and fulfill customer orders</p>

					<div className="flex gap-2 mb-6">
						{["", "pending", "processing", "shipped", "delivered"].map((s) => (
							<button
								key={s || "all"}
								onClick={() => setFilter(s)}
								className={`rounded-lg px-4 py-2 text-sm font-medium ${
									filter === s
										? "bg-primary text-primary-foreground"
										: "border border-border hover:bg-primary/5"
								}`}
							>
								{s || "All"}
							</button>
						))}
					</div>

					{orders.length === 0 ? (
						<div className="rounded-xl border border-border bg-card p-12 text-center">
							<p className="text-muted-foreground">No orders yet</p>
						</div>
					) : (
						<div className="space-y-4">
							{orders.map((order) => (
								<div
									key={order._id}
									className="rounded-xl border border-border bg-card p-6"
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<p className="font-semibold">
												{order.userName || "Customer"}
												{order.shippingAddress?.firstName &&
													` (${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ""})`}
											</p>
											<p className="text-sm text-muted-foreground">
												{new Date(order.createdAt).toLocaleString()}
											</p>
											<p className="text-sm">
												Status:{" "}
												<span
													className={`font-medium ${
														order.status === "delivered"
															? "text-green-600"
															: order.status === "pending"
															? "text-amber-600"
															: "text-blue-600"
													}`}
												>
													{order.status}
												</span>
											</p>
											<p className="text-sm">
												Payment: {order.paymentStatus} ({order.paymentMethod || "N/A"})
											</p>
											{order.shippingAddress?.address && (
												<p className="text-sm text-muted-foreground mt-1">
													{order.shippingAddress.address}
													{order.shippingAddress.phone && ` • ${order.shippingAddress.phone}`}
												</p>
											)}
										</div>
										<div className="text-right">
											<p className="text-xl font-bold">Rs. {order.totalAmount}</p>
										</div>
									</div>

									<div className="border-t border-border pt-4 mb-4">
										<p className="text-sm font-medium mb-2">Items:</p>
										<ul className="text-sm text-muted-foreground space-y-1">
											{order.items.map((item, i) => (
												<li key={i}>
													{item.productName} x {item.quantity} @ Rs. {item.price}
												</li>
											))}
										</ul>
									</div>

									{order.paymentStatus === "completed" && (
										<div className="flex gap-2 flex-wrap">
											{order.status === "pending" && (
												<button
													onClick={() => updateStatus(order._id, "processing")}
													className="rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20"
												>
													Mark Processing
												</button>
											)}
											{order.status === "processing" && (
												<button
													onClick={() => updateStatus(order._id, "shipped")}
													className="rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20"
												>
													Mark Shipped
												</button>
											)}
											{order.status === "shipped" && (
												<button
													onClick={() => updateStatus(order._id, "delivered")}
													className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700"
												>
													Mark Completed
												</button>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
