import {
	BookOpen,
	ExternalLink,
	HelpCircle,
	MessageSquare,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Suporte e Central de Ajuda | ExtrairLeads",
	description:
		"Precisa de ajuda? Fale com o nosso atendimento ou consulte o manual de uso.",
};

export default function SupportPage() {
	return (
		<div className="relative min-h-screen bg-background text-foreground p-4 md:p-8 overflow-hidden">
			{/* Grid de Efeito de Fundo - Extremamente Sutil */}
			<div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none z-0" />

			<div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-500">
				{/* Cabeçalho */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3 font-heading">
							<HelpCircle className="w-8 h-8 text-white" />
							Suporte e Ajuda
						</h1>
						<p className="text-zinc-400 text-sm mt-1">
							Como podemos te ajudar hoje? Escolha uma das opções abaixo.
						</p>
					</div>
				</div>

				{/* Módulos de Suporte em Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Card 1: Falar com Suporte (WhatsApp) */}
					<div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
						<div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
						<div className="space-y-6">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
									<MessageSquare className="w-6 h-6" />
								</div>
								<div>
									<h2 className="text-xl font-bold text-white font-heading">
										Falar com Suporte
									</h2>
									<p className="text-zinc-500 text-xs mt-0.5">
										Tire dúvidas e resolva problemas por chat.
									</p>
								</div>
							</div>

							<p className="text-zinc-300 text-sm leading-relaxed">
								Inicie uma conversa direta via WhatsApp com a nossa equipe de
								atendimento técnico e comercial. Estamos prontos para te
								auxiliar com qualquer detalhe da plataforma.
							</p>

							<div className="pt-2">
								<a
									href="https://wa.me/5563985112006"
									target="_blank"
									rel="noopener noreferrer"
									className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
								>
									<MessageSquare className="w-4 h-4" />
									Chamar no WhatsApp
									<ExternalLink className="w-3.5 h-3.5 opacity-60" />
								</a>
							</div>
						</div>
					</div>

					{/* Card 2: Manual de Uso */}
					<div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
						<div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none" />
						<div className="space-y-6">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
									<BookOpen className="w-6 h-6" />
								</div>
								<div>
									<h2 className="text-xl font-bold text-white font-heading">
										Manual de Uso
									</h2>
									<p className="text-zinc-500 text-xs mt-0.5">
										Explore a documentação do ExtrairLeads.
									</p>
								</div>
							</div>

							<p className="text-zinc-300 text-sm leading-relaxed">
								Consulte o nosso guia passo a passo completo. Aprenda como
								configurar sua conta, emparelhar o WhatsApp, gerenciar créditos,
								criar campanhas e extrair leads.
							</p>

							<div className="pt-2">
								<Link
									href="/manual"
									target="_blank"
									rel="noopener noreferrer"
									className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors border border-zinc-700/50"
								>
									<BookOpen className="w-4 h-4" />
									Abrir Manual de Uso
									<ExternalLink className="w-3.5 h-3.5 opacity-60" />
								</Link>
							</div>
						</div>
					</div>
				</div>

				<div className="text-center pt-8 border-t border-zinc-900">
					<p className="text-xs text-zinc-600 leading-relaxed">
						Seu sucesso é nossa prioridade. Caso precise de suporte técnico
						avançado ou comercial,
						<br />
						nosso time de atendimento está disponível em dias úteis das 09h às
						18h.
					</p>
				</div>
			</div>
		</div>
	);
}
