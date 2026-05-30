import { db } from "../src/db";
import { leads } from "../src/db/schema";

async function main() {
  const allLeads = await db.select().from(leads);
  console.log("Status counts:");
  const counts: Record<string, number> = {};
  for (const l of allLeads) {
    const status = l.status || "unknown";
    counts[status] = (counts[status] || 0) + 1;
  }
  console.log(counts);
}
main();
