import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import InfoForm from "./info-form";

export default async function OnboardingInfoPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Busca dados atuais do usuário no banco
  const [dbUser] = await db.select().from(users).where(eq(users.email, session.user.email));

  if (!dbUser) {
    redirect("/login");
  }

  // Se o onboarding já passou dessa fase, redireciona correspondente
  if (dbUser.onboardingStatus === "COMPLETED") {
    redirect("/");
  }

  return (
    <main className="min-h-screen w-full bg-[#050505] text-zinc-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Grid de Efeito de Fundo - Extremamente Sutil B2B */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="w-full max-w-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo da Marca - Intacto */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/scraping.png"
            alt="Logo"
            className="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]"
          />
          <span className="font-heading font-black text-2xl tracking-tight text-white">
            ExtrairLeads
          </span>
        </div>

        {/* Card Principal de Onboarding */}
        <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-2 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              Passo Único
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Complete seu cadastro</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Olá, <strong className="text-zinc-200">{dbUser.name}</strong>! Preencha as informações
              adicionais para liberar sua conta.
            </p>
          </div>

          {/* Componente Client Form para pesquisa de CEP e submissão */}
          <InfoForm
            initialData={{
              name: dbUser.name || "",
              email: dbUser.email || "",
              cpfCnpj: dbUser.cpfCnpj || "",
            }}
          />
        </div>

        <div className="text-center mt-6">
          <p className="text-zinc-600 text-xs font-medium">
            &copy; {new Date().getFullYear()} ExtrairLeads Inc. Conexão Segura B2B.
          </p>
        </div>
      </div>
    </main>
  );
}
