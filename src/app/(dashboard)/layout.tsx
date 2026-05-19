import Navbar from "@/components/Navbar";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

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
    .select({ onboardingStatus: users.onboardingStatus })
    .from(users)
    .where(eq(users.email, session.user.email));

  if (dbUser) {
    if (dbUser.onboardingStatus === "PENDING_INFO") {
      redirect("/onboarding/info");
    }
  }

  return (
    <>
      <Navbar user={session?.user} />
      {children}
    </>
  );
}
