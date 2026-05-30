"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campaigns, leads, scrapingJobs, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { qualifyLeadsAction, startOutreachAction } from "./outreach";

export async function createScrapingJobAction({
	campaignId,
	limit = 20,
	onlyScrape = false,
}: {
	campaignId?: number | null;
	limit?: number;
	onlyScrape?: boolean;
}) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	const [job] = await db
		.insert(scrapingJobs)
		.values({
			campaignId: campaignId || null,
			userId,
			status: "scraping",
			totalExpected: limit,
			currentProgress: 0,
			jobType: onlyScrape ? "scrape_only" : "full",
		})
		.returning();

	return { success: true, jobId: job.id };
}

export async function runScrapingJobAction({
	jobId,
	campaignId,
	niche,
	city,
	state,
	limit = 20,
	onlyScrape = false,
}: {
	jobId: number;
	campaignId?: number | null;
	niche: string;
	city: string;
	state: string;
	limit?: number;
	onlyScrape?: boolean;
}) {
	const session = await auth();
	const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
	if (!userId) return { success: false, error: "Usuário não autenticado." };

	const apiKey = process.env.SERPAPI_KEY;
	if (!apiKey) {
		await db
			.update(scrapingJobs)
			.set({ status: "failed" })
			.where(eq(scrapingJobs.id, jobId));
		return { success: false, error: "SerpApi Key ausente." };
	}

	// Verificar saldo do usuário
	const [currentUser] = await db
		.select({ leadsBalance: users.leadsBalance })
		.from(users)
		.where(eq(users.id, userId));
	let currentBalance = currentUser?.leadsBalance || 0;

	if (currentBalance <= 0) {
		await db
			.update(scrapingJobs)
			.set({ status: "failed" })
			.where(eq(scrapingJobs.id, jobId));
		return {
			success: false,
			error:
				"Saldo de leads esgotado. Por favor, adquira mais créditos na página de Configurações.",
		};
	}

	try {
		let currentCount = 0;
		const leadsToInsert = [];
		let start = 0;

		// Loop for pagination
		while (currentCount < limit) {
			const params = new URLSearchParams({
				engine: "google_maps",
				q: `${niche} em ${city}, ${state}`,
				type: "search",
				api_key: apiKey,
				start: start.toString(),
			});
			const response = await fetch(
				`https://serpapi.com/search.json?${params.toString()}`,
			);
			const data = await response.json();
			const localResults = data.local_results || [];

			if (localResults.length === 0) break;

			// Otimização de Performance: Buscar todos os telefones duplicados em uma única query (N+1 fix)
			const phonesToCheck = localResults
				.map((r: any) => r.phone?.replace(/\D/g, "") || null)
				.filter(Boolean);

			let existingPhones = new Set<string>();
			if (phonesToCheck.length > 0) {
				const existingLeads = await db
					.select({ phone: leads.phone })
					.from(leads)
					.where(inArray(leads.phone, phonesToCheck));
				existingPhones = new Set(
					existingLeads
						.map((l) => l.phone)
						.filter((p): p is string => p !== null),
				);
			}

			for (const result of localResults) {
				if (currentCount >= limit) break;

				const phone = result.phone?.replace(/\D/g, "") || null;
				if (!phone) continue;

				if (existingPhones.has(phone)) continue;

				leadsToInsert.push({
					campaignId: campaignId || null,
					userId,
					name: result.title,
					phone,
					website: result.website || null,
					niche,
					city,
					state,
					imageUrl: result.thumbnail || null,
					status: "raw" as const,
					metadata: {
						rating: result.rating,
						reviews: result.reviews,
						address: result.address,
					},
				});

				currentCount++;
				currentBalance--;

				if (currentBalance <= 0) {
					break; // Saldo acabou durante a raspagem
				}
			}

			await db
				.update(scrapingJobs)
				.set({ currentProgress: currentCount })
				.where(eq(scrapingJobs.id, jobId));

			if (!data.serpapi_pagination?.next) break;
			start += 20;
		}

		if (leadsToInsert.length > 0) {
			const inserted = await db.insert(leads).values(leadsToInsert).returning();

			// Desconta o saldo do usuário pelo número de leads inseridos com sucesso
			await db
				.update(users)
				.set({ leadsBalance: currentBalance })
				.where(eq(users.id, userId));

			if (!onlyScrape) {
				await db
					.update(scrapingJobs)
					.set({
						status: "qualifying",
						currentProgress: 0,
						totalExpected: inserted.length,
					})
					.where(eq(scrapingJobs.id, jobId));

				// Qualify sequentially to avoid API Rate Limits and update tracking progress
				await qualifyLeadsAction(
					inserted.map((l) => l.id),
					jobId,
				);

				if (campaignId) {
					const [campaign] = await db
						.select()
						.from(campaigns)
						.where(eq(campaigns.id, campaignId));
					if (campaign?.autoOutreach === "true") {
						await startOutreachAction(campaignId, userId);
					}
				}
			}
		}

		await db
			.update(scrapingJobs)
			.set({ status: "completed", currentProgress: limit })
			.where(eq(scrapingJobs.id, jobId));

		revalidatePath("/");
		return { success: true, count: leadsToInsert.length };
	} catch (error: unknown) {
		await db
			.update(scrapingJobs)
			.set({ status: "failed" })
			.where(eq(scrapingJobs.id, jobId));
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	}
}
