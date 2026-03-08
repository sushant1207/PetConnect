"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId");
	const dataParam = searchParams.get("data");
	const [verifying, setVerifying] = useState(true);

	useEffect(() => {
		if (!orderId) {
			setVerifying(false);
			return;
		}

		const verify = async () => {
			try {
				let status = "success";
				let refId: string | null = null;

				if (dataParam) {
					try {
						const decoded = JSON.parse(atob(dataParam));
						status = decoded.status === "COMPLETE" ? "success" : "failed";
						refId = decoded.transaction_code || decoded.refId || null;
					} catch {
						// Use default success
					}
				}

				await fetch("http://localhost:5555/api/pharmacy/orders/pay/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ orderId, status, refId }),
				});
			} catch (err) {
				console.error(err);
			} finally {
				setVerifying(false);
			}
		};

		verify();
	}, [orderId, dataParam]);

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
				<div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-4xl">
					{verifying ? (
						<div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
					) : (
						"✅"
					)}
				</div>
				<h1 className="text-3xl font-bold mb-2">Order Placed!</h1>
				<p className="text-muted-foreground mb-8">
					{verifying ? "Verifying payment..." : "Your order was placed successfully. Payment completed."}
				</p>
				<div className="space-y-4">
					<Link
						href="/dashboard/pharmacy"
						className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90"
					>
						Back to Pharmacy
					</Link>
					<Link href="/dashboard" className="block w-full text-sm text-muted-foreground hover:text-foreground">
						Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}

export default function OrderSuccessPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<SuccessContent />
		</Suspense>
	);
}
