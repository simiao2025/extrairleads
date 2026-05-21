import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { auth } from "@/lib/auth";
import { LeadsClient } from "./client";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const search = params.search || "";
  const status = params.status || "";

  const allLeads = userId
    ? await db.select().from(leads).where(eq(leads.userId, userId)).orderBy(asc(leads.createdAt))
    : [];

  const filteredLeads = allLeads.filter((lead) => {
    const matchSearch =
      !search ||
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.website?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !status || lead.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <main className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 pt-12">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Gerenciar Leads</h1>
                <p className="text-sm text-zinc-500">{filteredLeads.length} leads encontrados</p>
              </div>
            </div>
          </div>
        </div>

        <LeadsClient
          initialSearch={search}
          initialStatus={status}
          filteredLeads={filteredLeads}
          currentPage={page}
        />
      </div>
    </main>
  );
}
