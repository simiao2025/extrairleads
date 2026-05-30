import { db } from "../src/db";
import { leads } from "../src/db/schema";
import { and, eq } from "drizzle-orm";

async function main() {
  const userId = 19;
  const campaignId = 2; // Let's check campaign 2 for user 19 which had 15 raw leads
  
  console.log("Checking leads for user 19, campaign 2, raw");
  const conditions = [eq(leads.status, "raw"), eq(leads.userId, userId)];
  if (campaignId) conditions.push(eq(leads.campaignId, campaignId));

  const rawLeads = await db
    .select()
    .from(leads)
    .where(and(...conditions));
    
  console.log("Result length:", rawLeads.length);
  
  // also check without campaign
  const conditions2 = [eq(leads.status, "raw"), eq(leads.userId, userId)];
  const rawLeads2 = await db.select().from(leads).where(and(...conditions2));
  console.log("Result without campaign length:", rawLeads2.length);
  
  // also check user 17
  const conditions3 = [eq(leads.status, "raw"), eq(leads.userId, 17)];
  const rawLeads3 = await db.select().from(leads).where(and(...conditions3));
  console.log("User 17 Result length:", rawLeads3.length);
}
main();
