import { redirect } from "next/navigation";
import { getCampaignDetailsAction } from "@/app/actions";
import { auth } from "@/lib/auth";
import { CampaignDetailsClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const campaignId = parseInt(id, 10);

  if (Number.isNaN(campaignId)) {
    redirect("/campaigns");
  }

  const details = await getCampaignDetailsAction(campaignId);
  if (!details) {
    redirect("/campaigns");
  }

  return (
    <CampaignDetailsClient
      initialCampaign={details.campaign}
      initialStats={details.stats}
      initialLeads={details.leads}
    />
  );
}
