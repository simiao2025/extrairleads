const { db } = require('./src/db/index.js');
const { leads, chatHistory } = require('./src/db/schema.js');
const { eq, and } = require('drizzle-orm');

async function test() {
  const contactedLeads = await db.select().from(leads).where(eq(leads.status, 'contacted'));
  console.log("Contacted leads:", contactedLeads.length);
  for (const lead of contactedLeads) {
    console.log(`Lead: ${lead.name} (${lead.id}) - Phone: ${lead.phone}`);
    const history = await db.select().from(chatHistory).where(eq(chatHistory.leadId, lead.id));
    const hasUserReply = history.some((h) => h.role === "user");
    console.log(`  History length: ${history.length}`);
    console.log(`  Has user reply? ${hasUserReply}`);
  }
  process.exit(0);
}
test().catch(console.error);
