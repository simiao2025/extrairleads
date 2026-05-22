import { sql, eq } from "drizzle-orm";
import { Layers, MapPin, Megaphone } from "lucide-react";
import { db } from "@/db";
import { campaigns, leads } from "@/db/schema";
import { auth } from "@/lib/auth";
import { CreateCampaignDialog } from "./create-campaign-dialog";
import { CampaignCardActions } from "./campaign-card-actions";

export default async function CampaignsPage() {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
  if (!userId) return null;

  // Fetch campaigns from DB
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(campaigns.createdAt);

  // Fetch lead stats per campaign
  const leadStats = await db
    .select({
      campaignId: leads.campaignId,
      total: sql<number>`count(${leads.id})`,
      contacted: sql<number>`count(CASE WHEN ${leads.status} = 'contacted' THEN 1 END)`,
    })
    .from(leads)
    .where(eq(leads.userId, userId))
    .groupBy(leads.campaignId);

  const statsMap = leadStats.reduce((acc, curr) => {
    if (curr.campaignId) {
      acc[curr.campaignId] = curr;
    }
    return acc;
  }, {} as Record<number, { total: number; contacted: number }>);

  return (
    <main className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 pt-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-blue-500" />
              Campanhas Ativas
            </h1>
            <p className="text-zinc-400 mt-2">
              Visão geral das suas frentes de extração e prospecção.
            </p>
          </div>
          <CreateCampaignDialog />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCampaigns.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500">
              Nenhuma campanha ativa no momento. Crie sua primeira campanha!
            </div>
          ) : (
            userCampaigns.map((camp) => {
              const stats = statsMap[camp.id] || { total: 0, contacted: 0 };
              return (
                <div
                  key={camp.id}
                  className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 transition-colors shadow-lg group relative flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                      {stats.contacted} / {stats.total} Contatados
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1 truncate group-hover:text-blue-400 transition-colors">
                    {camp.name}
                  </h3>
                  <p className="text-sm text-zinc-500 font-medium">
                    {camp.niche} em {camp.city}, {camp.state}
                  </p>

                  <div className="mt-auto pt-6">
                    <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Layers className="w-4 h-4" />
                        <span>Automação: {camp.autoOutreach === "true" ? "Ativa" : "Pausada"}</span>
                      </div>
                      <CampaignCardActions campaignId={camp.id} autoOutreach={camp.autoOutreach || "false"} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
