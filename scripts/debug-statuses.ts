import { db } from "../src/db";
import { leads } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const allLeads = await db.select().from(leads);
  console.log("Status counts:");
  const counts: Record<string, number> = {};
  for (const l of allLeads) {
    counts[l.status] = (counts[l.status] || 0) + 1;
  }
  console.log(counts);
}
main();
