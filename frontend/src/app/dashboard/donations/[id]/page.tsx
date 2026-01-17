"use client";

import { useEffect, useState, use } from "react";
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

interface Campaign {
	_id: string;
	name: string;
	description: string;
	goal: number;
	raised: number;
	image?: { url: string };
	ownerId: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [campaign, setCampaign] = useState<Campaign | null>(null);
	const [loading, setLoading] = useState(true);
	const [donationAmount, setDonationAmount] = useState(500);
	const [donating, setDonating] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem("token");
		const userData = localStorage.getItem("user");

		if (!token || !userData) {
			router.push("/login");
			return;
		}

		try {
			const parsedUser = JSON.parse(userData);
			setUser(parsedUser);
			fetchCampaign();
		} catch (error) {
			router.push("/login");
		}
	}, [id, router]);

	const fetchCampaign = async () => {
		try {
			const response = await fetch(`http://localhost:5555/api/charity/campaigns/${id}`);
			const data = await response.json();
			if (response.ok) {
				setCampaign(data);
			}
		} catch (error) {
			console.error("Error fetching campaign:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDonate = async () => {
		setDonating(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch("http://localhost:5555/api/charity/donate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					charityId: id,
					amount: donationAmount,
					userName: `${user?.firstName} ${user?.lastName}`.trim(),
					paymentMethod: "esewa"
				})
			});

			const data = await response.json();
			if (response.ok) {
				// Create and submit eSewa form automatically
				const form = document.createElement("form");
				form.setAttribute("method", "POST");
				form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");

				const fields = data.esewaData;
				for (const key in fields) {
					const input = document.createElement("input");
					input.setAttribute("type", "hidden");
					input.setAttribute("name", key);
					input.setAttribute("value", fields[key]);
					form.appendChild(input);
				}

				document.body.appendChild(form);
				form.submit();
			} else {
				alert(data.message || "Failed to initiate donation");
			}
		} catch (error) {
			console.error("Donation error:", error);
			alert("An error occurred. Please try again.");
		} finally {
			setDonating(false);
		}
	};

	if (loading) return null;
	if (!campaign) return (
		<div className="flex h-screen items-center justify-center">
			<p>Campaign not found</p>
		</div>
	);

	const progress = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
	const isOwner = user?._id === campaign.ownerId._id;

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user!} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-5xl mx-auto">
					<div className="mb-8">
						<Link href="/dashboard/donations" className="text-sm text-primary hover:underline mb-4 inline-block">
							← Back to Campaigns
						</Link>
						<h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
						<p className="text-muted-foreground">Campaign by {campaign.ownerId.firstName} {campaign.ownerId.lastName}</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 space-y-8">
							<div className="rounded-xl overflow-hidden border border-border shadow-sm bg-card aspect-video relative">
								<img 
									src={campaign.image?.url || "https://placehold.co/1200x800?text=Campaign"} 
									alt={campaign.name}
									className="w-full h-full object-cover"
								/>
							</div>

							<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<h2 className="text-xl font-semibold mb-4">About this Campaign</h2>
								<p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
									{campaign.description}
								</p>
							</section>
						</div>

						<div className="space-y-6">
							<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<div className="mb-6">
									<div className="flex justify-between items-end mb-2">
										<span className="text-2xl font-bold">Rs. {campaign.raised}</span>
										<span className="text-sm text-muted-foreground">raised of Rs. {campaign.goal}</span>
									</div>
									<div className="w-full h-3 bg-muted rounded-full overflow-hidden">
										<div 
											className="h-full bg-primary transition-all duration-500" 
											style={{ width: `${progress}%` }}
										/>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground mt-2">
										<span>{progress}% funded</span>
										<span>Goal: Rs. {campaign.goal}</span>
									</div>
								</div>

								{isOwner ? (
									<div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary">
										<p className="font-semibold mb-1 text-center">This is your campaign</p>
										<p className="text-xs text-center">Manage your campaign and track donations from your dashboard.</p>
									</div>
								) : (
									<div className="space-y-4">
										<div>
											<label className="text-sm font-medium block mb-2">Select Donation Amount</label>
											<div className="grid grid-cols-3 gap-2 mb-3">
												{[500, 1000, 5000].map((amt) => (
													<button
														key={amt}
														onClick={() => setDonationAmount(amt)}
														className={`py-2 rounded-lg text-sm border transition-all ${
															donationAmount === amt 
																? "bg-primary border-primary text-primary-foreground font-bold" 
																: "border-border hover:border-primary text-muted-foreground"
														}`}
													>
														Rs. {amt}
													</button>
												))}
											</div>
											<div className="relative">
												<span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rs.</span>
												<input
													type="number"
													className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
													value={donationAmount}
													onChange={(e) => setDonationAmount(Number(e.target.value))}
												/>
											</div>
										</div>

										<button
											onClick={handleDonate}
											disabled={donating || donationAmount <= 0}
											className="w-full bg-[#60BB46] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
										>
											{donating ? (
												<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
											) : (
												<>
													<span>Donate with</span>
													<span className="text-xl font-extrabold tracking-tighter">eSewa</span>
												</>
											)}
										</button>
										<p className="text-[10px] text-center text-muted-foreground">
											You will be redirected to eSewa to complete your payment securely.
										</p>
									</div>
								)}
							</section>

							<section className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Shelter Contact</h3>
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
										{campaign.ownerId.firstName[0]}
									</div>
									<div>
										<p className="font-semibold text-sm">{campaign.ownerId.firstName} {campaign.ownerId.lastName}</p>
										<p className="text-xs text-muted-foreground">{campaign.ownerId.email}</p>
									</div>
								</div>
							</section>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
