import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();
	if (!session?.user?.email) {
		redirect("/login");
	}

	// Consulta em tempo real o status de onboarding no banco
	const [dbUser] = await db
		.select({
			onboardingStatus: users.onboardingStatus,
			leadsBalance: users.leadsBalance,
			plan: users.plan,
		})
		.from(users)
		.where(eq(users.email, session.user.email));

	if (dbUser) {
		if (dbUser.onboardingStatus === "PENDING_INFO") {
			redirect("/onboarding/info");
		}
	}

	// Merge session user with db data to pass to Sidebar
	const sidebarUser = {
		...session.user,
		leadsBalance: dbUser?.leadsBalance,
		plan: dbUser?.plan,
	};

	return (
		<div className="flex min-h-screen flex-col md:flex-row bg-zinc-950">
			<Sidebar user={sidebarUser} />
			<main className="flex-1 overflow-x-hidden pt-[60px] pb-24 md:pt-0 md:pb-0 min-h-screen">
				{children}
			</main>
		</div>
	);
}
