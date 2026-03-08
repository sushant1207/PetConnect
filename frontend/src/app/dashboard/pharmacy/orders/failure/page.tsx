"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function FailureContent() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId");

	useEffect(() => {
		if (orderId) {
			fetch("http://localhost:5555/api/pharmacy/orders/pay/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId, status: "failed" }),
			});
		}
	}, [orderId]);

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
				<div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 text-4xl">
					❌
				</div>
				<h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
				<p className="text-muted-foreground mb-8">
					Something went wrong with your payment. Please try again or contact support.
				</p>
				<div className="space-y-4">
					<Link
						href="/dashboard/pharmacy"
						className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90"
					>
						Try Again
					</Link>
					<Link href="/dashboard" className="block w-full text-sm text-muted-foreground hover:text-foreground">
						Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}

export default function OrderFailurePage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<FailureContent />
		</Suspense>
	);
}
