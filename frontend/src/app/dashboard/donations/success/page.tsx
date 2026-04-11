"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const dataParam = searchParams.get("data");
	const donationIdParam = searchParams.get("donationId");

	const [verifying, setVerifying] = useState(true);

	useEffect(() => {
		let resolvedDonationId: string | null = donationIdParam;
		let decodedStatus: string | undefined;
		let decodedTxnUuid: string | undefined;

		if (dataParam) {
			try {
				const normalizeBase64 = (value: string) => {
					const base64 = value.trim().replace(/\s/g, "+").replace(/-/g, "+").replace(/_/g, "/");
					const padLength = (4 - (base64.length % 4)) % 4;
					return base64 + "=".repeat(padLength);
				};
				const decoded = JSON.parse(atob(normalizeBase64(dataParam)));
				decodedTxnUuid = decoded.transaction_uuid || decoded.transactionUuid;
				decodedStatus = decoded.status;
				if (!resolvedDonationId && decodedTxnUuid) {
					resolvedDonationId = decodedTxnUuid;
				}
			} catch (e) {
				console.error("Failed to decode eSewa data parameter:", e);
			}
		}

		if (resolvedDonationId) {
			verifyPayment(resolvedDonationId, decodedStatus, decodedTxnUuid, dataParam || undefined);
		} else if (dataParam) {
			verifyPayment("", decodedStatus, decodedTxnUuid, dataParam);
		} else {
			setVerifying(false);
		}
	}, [donationIdParam, dataParam]);

	const verifyPayment = async (id: string, decodedStatus?: string, decodedTxnUuid?: string, rawData?: string) => {
		try {
			const normalized = String(decodedStatus || "COMPLETE").toUpperCase();
			const status = normalized === "COMPLETE" || normalized === "SUCCESS" ? "success" : "failed";

			const response = await fetch("http://localhost:5555/api/charity/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ donationId: id || undefined, status, transactionUuid: decodedTxnUuid, data: rawData })
			});
			if (response.ok) {
				// Payment verified
			}
		} catch (error) {
			console.error("Verification error:", error);
		} finally {
			setVerifying(false);
		}
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
				<div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 text-4xl">
					{verifying ? (
						<div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
					) : "✅"}
				</div>
				<h1 className="text-3xl font-bold mb-2">Thank You!</h1>
				<p className="text-muted-foreground mb-8">
					{verifying ? "Verifying your donation..." : "Your donation was successful. Your support means the world to the animals!"}
				</p>
				<div className="space-y-4">
					<Link
						href="/dashboard/donations"
						className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
					>
						Back to Campaigns
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

export default function DonationSuccessPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<SuccessContent />
		</Suspense>
	);
}
