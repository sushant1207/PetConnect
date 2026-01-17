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

interface Campaign {
	_id: string;
	name: string;
	description: string;
	goal: number;
	raised: number;
	image?: { url: string };
	ownerId: {
		firstName: string;
		lastName: string;
	};
}

export default function DonationsPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [loading, setLoading] = useState(true);

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
			fetchCampaigns();
		} catch (error) {
			router.push("/login");
		}
	}, [router]);

	const fetchCampaigns = async () => {
		try {
			const response = await fetch("http://localhost:5555/api/charity/campaigns");
			const data = await response.json();
			if (response.ok) {
				setCampaigns(data);
			}
		} catch (error) {
			console.error("Error fetching campaigns:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) return null;
	if (!user) return null;

	const isShelter = user.role === "shelter";

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar user={user} />
			<main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
				<div className="max-w-7xl mx-auto">
					<div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold mb-2">Donation Campaigns</h1>
							<p className="text-muted-foreground">Support animal shelters and NGOs</p>
						</div>
						{isShelter && (
							<Link
								href="/dashboard/donations/create"
								className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								+ Create Campaign
							</Link>
						)}
					</div>

					{campaigns.length === 0 ? (
						<div className="text-center py-12 rounded-lg border border-border bg-card">
							<div className="text-4xl mb-4">❤️</div>
							<h3 className="text-xl font-semibold mb-2">No active campaigns</h3>
							<p className="text-muted-foreground">Check back later for new donation gigs</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{campaigns.map((campaign) => {
								const progress = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
								return (
									<div key={campaign._id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
										<div className="h-48 overflow-hidden bg-muted">
											<img 
												src={campaign.image?.url || "https://placehold.co/600x400?text=Campaign"} 
												alt={campaign.name}
												className="w-full h-full object-cover"
											/>
										</div>
										<div className="p-6 flex-1 flex flex-col">
											<h3 className="text-xl font-bold mb-2">{campaign.name}</h3>
											<p className="text-sm text-muted-foreground line-clamp-2 mb-4">
												{campaign.description}
											</p>
											
											<div className="mt-auto space-y-4">
												<div>
													<div className="flex justify-between text-sm mb-1">
														<span className="font-medium">Rs. {campaign.raised} raised</span>
														<span className="text-muted-foreground">Goal: Rs. {campaign.goal}</span>
													</div>
													<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
														<div 
															className="h-full bg-primary transition-all duration-500" 
															style={{ width: `${progress}%` }}
														/>
													</div>
													<div className="text-right text-[10px] text-muted-foreground mt-1">
														{progress}% complete
													</div>
												</div>

												<Link
													href={`/dashboard/donations/${campaign._id}`}
													className="block w-full text-center bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors"
												>
													{isShelter && campaign.ownerId === user._id ? "Manage Campaign" : "Donate Now"}
												</Link>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
