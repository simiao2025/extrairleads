import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { campaigns, leads } from "@/db/schema";
import { auth } from "@/lib/auth";
import { LeadsClient } from "./client";

interface PageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		status?: string;
		campaignId?: string;
		niche?: string;
	}>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

	const params = await searchParams;
	const page = Math.max(1, parseInt(params.page || "1", 10));
	const search = params.search || "";
	const status = params.status || "";
	const campaignId = params.campaignId ? parseInt(params.campaignId, 10) : undefined;
	const niche = params.niche || "";

	const allLeads = userId
		? await db
				.select()
				.from(leads)
				.where(eq(leads.userId, userId))
				.orderBy(asc(leads.createdAt))
		: [];

	const userCampaigns = userId
		? await db
				.select({ id: campaigns.id, name: campaigns.name })
				.from(campaigns)
				.where(eq(campaigns.userId, userId))
				.orderBy(asc(campaigns.name))
		: [];

	const uniqueNiches = Array.from(
		new Set(
			allLeads
				.map((l) => l.niche)
				.filter((n): n is string => n !== null && n !== "")
		)
	).sort();

	const filteredLeads = allLeads.filter((lead) => {
		const matchSearch =
			!search ||
			lead.name?.toLowerCase().includes(search.toLowerCase()) ||
			lead.phone?.includes(search) ||
			lead.website?.toLowerCase().includes(search.toLowerCase());
		const matchStatus = !status || lead.status === status;
		const matchCampaign = !campaignId || lead.campaignId === campaignId;
		const matchNiche = !niche || lead.niche === niche;
		return matchSearch && matchStatus && matchCampaign && matchNiche;
	});

	return (
		<div className="min-h-screen bg-transparent text-white p-4 md:p-8">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link href="/">
							<Button
								variant="ghost"
								size="icon-sm"
								className="text-zinc-400 hover:text-white"
							>
								<ArrowLeft className="w-5 h-5" />
							</Button>
						</Link>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-emerald-500/10 rounded-lg">
								<Users className="w-6 h-6 text-emerald-400" />
							</div>
							<div>
								<h1 className="text-2xl font-black tracking-tight">
									Gerenciar Leads
								</h1>
								<p className="text-sm text-zinc-500">
									{filteredLeads.length} leads encontrados
								</p>
							</div>
						</div>
					</div>
				</div>

				<LeadsClient
					initialSearch={search}
					initialStatus={status}
					initialCampaignId={params.campaignId || ""}
					initialNiche={niche}
					filteredLeads={filteredLeads}
					campaigns={userCampaigns}
					niches={uniqueNiches}
					currentPage={page}
				/>
			</div>
		</div>
	);
}
