import { db } from "../src/db";
import { leads } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allLeads = await db.select().from(leads);
  console.log("Total leads:", allLeads.length);
  const rawLeads = allLeads.filter(l => l.status === "raw");
  console.log("Raw leads:", rawLeads.length);
  for (const l of rawLeads) {
    console.log(`- ID: ${l.id}, Name: ${l.name}, Status: ${l.status}, CampaignID: ${l.campaignId}, UserID: ${l.userId}`);
  }
}
main();
