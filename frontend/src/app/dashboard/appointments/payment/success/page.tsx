"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
	const searchParams = useSearchParams();
	const appointmentId = searchParams.get("appointmentId");
	const dataParam = searchParams.get("data");
	const [verifying, setVerifying] = useState(true);

	useEffect(() => {
		if (!appointmentId) {
			setVerifying(false);
			return;
		}

		const verifyPayment = async () => {
			try {
				let status = "success";
				let refId: string | null = null;

				if (dataParam) {
					try {
						const decoded = JSON.parse(atob(dataParam));
						status = decoded.status === "COMPLETE" ? "success" : "failed";
						refId = decoded.transaction_code || decoded.refId || null;
					} catch {
						// Use default success if we can't parse eSewa response
					}
				}

				await fetch("http://localhost:5555/api/appointments/pay/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						appointmentId,
						status,
						refId,
					}),
				});
			} catch (error) {
				console.error("Verification error:", error);
			} finally {
				setVerifying(false);
			}
		};

		verifyPayment();
	}, [appointmentId, dataParam]);

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
				<div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-4xl">
					{verifying ? (
						<div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
					) : (
						"✅"
					)}
				</div>
				<h1 className="text-3xl font-bold mb-2">Appointment Confirmed!</h1>
				<p className="text-muted-foreground mb-8">
					{verifying
						? "Verifying your payment..."
						: "Your appointment has been booked and payment was successful."}
				</p>
				<div className="space-y-4">
					<Link
						href="/dashboard/appointments"
						className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
					>
						View Appointments
					</Link>
					<Link
						href="/dashboard"
						className="block w-full text-sm text-muted-foreground hover:text-foreground"
					>
						Go to Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}

export default function AppointmentPaymentSuccessPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<SuccessContent />
		</Suspense>
	);
}
