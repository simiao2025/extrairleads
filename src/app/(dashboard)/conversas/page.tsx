import { redirect } from "next/navigation";
import { getConversationsAction } from "@/app/actions";
import { auth } from "@/lib/auth";
import { ConversasClient } from "./client";

export default async function ConversasPage() {
	const session = await auth();
	if (!session?.user) {
		redirect("/login");
	}

	const initialConversations = await getConversationsAction();

	return <ConversasClient initialConversations={initialConversations} />;
}
