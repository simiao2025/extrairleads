"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campaigns, leads } from "@/db/schema";
import { auth } from "@/lib/auth";
import { qualifyLeadsAction, startOutreachAction } from "./outreach";

export async function searchLeadsAction({
  niche,
  city,
  state,
  onlyScrape = false,
  campaignId,
}: {
  niche: string;
  city: string;
  state: string;
  onlyScrape?: boolean;
  campaignId: number;
}) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return { success: false, error: "SerpApi Key ausente." };

  try {
    const params = new URLSearchParams({
      engine: "google_maps",
      q: `${niche} em ${city}, ${state}`,
      type: "search",
      api_key: apiKey,
    });
    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    const data = await response.json();
    const localResults = data.local_results || [];

    const leadsToInsert = [];
    for (const result of localResults) {
      const phone = result.phone?.replace(/\D/g, "") || null;
      if (phone) {
        const [existing] = await db.select().from(leads).where(eq(leads.phone, phone));
        if (existing) continue;
      }
      leadsToInsert.push({
        campaignId,
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
    }

    if (leadsToInsert.length === 0) return { success: true, count: 0 };

    const inserted = await db.insert(leads).values(leadsToInsert).returning();

    if (!onlyScrape) {
      await qualifyLeadsAction(inserted.map((l) => l.id));

      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
      if (campaign?.autoOutreach === "true") {
        await startOutreachAction(campaignId);
      }
    }

    revalidatePath("/");
    return { success: true, count: inserted.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
