import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, scoutMemory, users, leads } from "@/db/schema";

export async function getScoutContext(userId: number) {
	const [user] = await db
		.select({
			name: users.name,
			plan: users.plan,
			leadsBalance: users.leadsBalance,
		})
		.from(users)
		.where(eq(users.id, userId));

	if (!user) {
		throw new Error("User not found");
	}

	// Busca as campanhas recentes e agrega a contagem de leads de cada uma
	const recentCampaigns = await db
		.select({
			id: campaigns.id,
			name: campaigns.name,
			niche: campaigns.niche,
			city: campaigns.city,
			status: campaigns.status,
			createdAt: campaigns.createdAt,
			leadsCount: sql<number>`count(${leads.id})::int`,
		})
		.from(campaigns)
		.leftJoin(leads, eq(leads.campaignId, campaigns.id))
		.where(eq(campaigns.userId, userId))
		.groupBy(campaigns.id, campaigns.name, campaigns.niche, campaigns.city, campaigns.status, campaigns.createdAt)
		.orderBy(desc(campaigns.createdAt))
		.limit(3);

	const memories = await db
		.select()
		.from(scoutMemory)
		.where(eq(scoutMemory.userId, userId))
		.orderBy(desc(scoutMemory.createdAt))
		.limit(10);

	return {
		user,
		recentCampaigns,
		memories,
	};
}
