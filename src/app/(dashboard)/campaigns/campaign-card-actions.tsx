"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import {
	deleteCampaignAction,
	toggleCampaignAutomationAction,
} from "@/actions/campaigns";
import { Button } from "@/components/ui/button";

export function CampaignCardActions({
	campaignId,
	autoOutreach,
}: {
	campaignId: number;
	autoOutreach: string;
}) {
	const [isPending, startTransition] = useTransition();

	const handleToggle = () => {
		startTransition(() => {
			toggleCampaignAutomationAction(
				campaignId,
				autoOutreach === "true" ? "false" : "true",
			);
		});
	};

	const handleDelete = () => {
		if (
			confirm(
				"Tem certeza que deseja excluir esta campanha? Os leads não serão excluídos, apenas a campanha.",
			)
		) {
			startTransition(() => {
				deleteCampaignAction(campaignId);
			});
		}
	};

	return (
		<div className="flex items-center gap-3">
			<label className="relative inline-flex items-center cursor-pointer">
				<input
					type="checkbox"
					className="sr-only peer"
					checked={autoOutreach === "true"}
					onChange={handleToggle}
					disabled={isPending}
				/>
				<div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 opacity-80 peer-checked:opacity-100"></div>
			</label>

			<Button
				variant="ghost"
				size="icon-xs"
				className="text-zinc-600 hover:text-red-400"
				onClick={handleDelete}
				disabled={isPending}
				title="Excluir Campanha"
			>
				<Trash2 className="w-4 h-4" />
			</Button>
		</div>
	);
}
