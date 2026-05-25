"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campaigns, leads, scrapingJobs } from "@/db/schema";
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
    await db.update(scrapingJobs).set({ status: "failed" }).where(eq(scrapingJobs.id, jobId));
    return { success: false, error: "SerpApi Key ausente." };
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
      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      const data = await response.json();
      const localResults = data.local_results || [];

      if (localResults.length === 0) break;

      for (const result of localResults) {
        if (currentCount >= limit) break;

        const phone = result.phone?.replace(/\D/g, "") || null;
        if (phone) {
          const [existing] = await db.select().from(leads).where(eq(leads.phone, phone));
          if (existing) continue;
        }

        leadsToInsert.push({
          campaignId: campaignId || null,
          userId,
          name: result.title,
          phone,
          website: result.website || null,
          niche,
          city,
          state,
          status: "raw" as const,
          metadata: { rating: result.rating, reviews: result.reviews, address: result.address },
        });

        currentCount++;
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

      if (!onlyScrape) {
        await db
          .update(scrapingJobs)
          .set({ status: "qualifying" })
          .where(eq(scrapingJobs.id, jobId));

        // Qualify all at once for simplicity, or chunk it. Here we use the existing action.
        await qualifyLeadsAction(inserted.map((l) => l.id));

        if (campaignId) {
          const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
          if (campaign?.autoOutreach === "true") {
            await startOutreachAction(campaignId);
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
    await db.update(scrapingJobs).set({ status: "failed" }).where(eq(scrapingJobs.id, jobId));
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
