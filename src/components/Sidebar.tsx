"use client";

import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Cpu,
	CreditCard,
	Gem,
	HelpCircle,
	LayoutGrid,
	LogOut,
	Menu,
	MessageSquare,
	Sliders,
	Target,
	Workflow,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
	checkWhatsAppConnectionAction,
	getWhatsAppSettingsAction,
} from "@/app/actions";

interface SidebarProps {
	user?: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
		plan?: string | null;
		leadsBalance?: number | null;
	};
}

export default function Sidebar({ user }: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [whatsappStatus, setWhatsappStatus] = useState<{
		connected: boolean;
		state: string;
	} | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [liveBalance, setLiveBalance] = useState<number>(
		user?.leadsBalance ?? 0,
	);
	const [livePlan, setLivePlan] = useState<string>(user?.plan || "Starter");

	useEffect(() => {
		if (user) {
			checkWhatsAppConnectionAction()
				.then((res) => {
					if (res.success) {
						setWhatsappStatus({
							connected: !!res.connected,
							state: res.state || "DISCONNECTED",
						});
					}
				})
				.catch(() => {});

			// Polling real-time para créditos e plano
			const interval = setInterval(async () => {
				const res = await getWhatsAppSettingsAction();
				if (res.success) {
					setLiveBalance(res.leadsBalance ?? 0);
					setLivePlan(res.plan || "Starter");
				}
			}, 5000);

			return () => clearInterval(interval);
		}
	}, [user]);

	const links = [
		{ name: "Dashboard", href: "/", icon: LayoutGrid },
		{ name: "Leads", href: "/leads", icon: Target },
		{ name: "Campanhas", href: "/campaigns", icon: Workflow },
		{ name: "Agendamentos", href: "/appointments", icon: CalendarDays },
		{ name: "Conversas", href: "/conversas", icon: MessageSquare },
		{
			name: "Agentes IA",
			href: "/agents",
			icon: Cpu,
		},
		{ name: "Configurações", href: "/settings", icon: Sliders },
		{ name: "Suporte", href: "/support", icon: HelpCircle },
	];

	const handleSignOut = async () => {
		await signOut({ redirect: false });
		router.push("/login");
	};

	const getInitials = (name?: string | null, email?: string | null) => {
		if (name) return name.charAt(0).toUpperCase();
		if (email) return email.charAt(0).toUpperCase();
		return "U";
	};

	const bottomLinks = [
		links[0], // Dashboard
		links[1], // Leads
		links[2], // Campanhas
		links[4], // Conversas
		links[5], // Agentes IA
	];

	return (
		<>
			{/* ======================= */}
			{/* MOBILE HEADER (TOP)     */}
			{/* ======================= */}
			<div className="md:hidden">
				<header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-900 bg-zinc-950/95 px-4 py-3 backdrop-blur-md">
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0 flex items-center gap-2">
							<div className="w-8 h-8 flex items-center justify-center">
								{/* biome-ignore lint/performance/noImgElement: Static logo asset */}
								<img
									src="/scraping.png"
									alt="ExtrairLeads"
									className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
								/>
							</div>
							<div>
								<span className="truncate font-black text-[16px] tracking-tight leading-none text-white font-heading">
									ExtrairLeads
								</span>
								<p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-emerald-500 font-bold">
									{liveBalance} Créditos
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							{/* Mobile WhatsApp Indicator */}
							{whatsappStatus && (
								<div
									className={`w-2 h-2 rounded-full ${whatsappStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
								/>
							)}
							<button
								type="button"
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
								aria-label="Abrir menu"
							>
								{isMobileMenuOpen ? (
									<X className="w-5 h-5" />
								) : (
									<Menu className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>
				</header>

				{/* ======================= */}
				{/* MOBILE BOTTOM NAV       */}
				{/* ======================= */}
				<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-900 bg-zinc-950/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 backdrop-blur-md">
					<div className="grid gap-1 grid-cols-5">
						{bottomLinks.map((link) => {
							const isActive = pathname === link.href;
							return (
								<Link
									key={link.name}
									href={link.href}
									className={`flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold transition-all ${
										isActive
											? "text-emerald-400 bg-emerald-500/10"
											: "text-zinc-500 hover:text-zinc-300"
									}`}
								>
									<link.icon
										className="w-[18px] h-[18px]"
										strokeWidth={isActive ? 2.5 : 2}
									/>
									<span className="mt-1 truncate">{link.name}</span>
								</Link>
							);
						})}
					</div>
				</nav>
			</div>

			{/* ======================= */}
			{/* MOBILE FULLSCREEN MENU  */}
			{/* ======================= */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-48 bg-zinc-950 flex flex-col md:hidden pt-20 pb-[calc(env(safe-area-inset-bottom)+5rem)] px-6 overflow-y-auto">
					<div className="flex items-center gap-3 mb-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
						<div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-lg flex items-center justify-center uppercase">
							{getInitials(user?.name, user?.email)}
						</div>
						<div className="overflow-hidden">
							<p className="font-bold text-white text-base truncate">
								{user?.name || "Usuário"}
							</p>
							<p className="text-xs text-zinc-500 truncate">{user?.email}</p>
						</div>
					</div>

					<div className="space-y-2.5 flex-1">
						{links.map((link) => {
							const isActive = pathname === link.href;
							return (
								<Link
									key={link.name}
									href={link.href}
									onClick={() => setIsMobileMenuOpen(false)}
									className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all border ${
										isActive
											? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
											: "text-zinc-400 hover:text-white bg-zinc-900/20 border-transparent hover:bg-zinc-900/40"
									}`}
								>
									<link.icon
										className="w-5 h-5 text-zinc-500"
										strokeWidth={isActive ? 2.5 : 2}
									/>
									<span>{link.name}</span>
								</Link>
							);
						})}
					</div>

					<button
						type="button"
						onClick={handleSignOut}
						className="mt-8 flex items-center justify-center gap-2 w-full bg-red-500/10 text-red-500 font-bold py-3.5 rounded-xl border border-red-500/20"
					>
						<LogOut className="w-5 h-5" /> Sair da Conta
					</button>
				</div>
			)}

			{/* ======================= */}
			{/* DESKTOP SIDEBAR         */}
			{/* ======================= */}
			<aside
				className={`hidden md:flex md:flex-col shrink-0 border-r border-zinc-900 h-screen sticky top-0 z-50 transition-all duration-300 ${isCollapsed ? "w-[72px]" : "w-[240px]"} bg-zinc-950`}
			>
				<div
					className={`flex items-center relative py-5 border-b border-zinc-900/50 ${isCollapsed ? "justify-center px-0" : "px-6"}`}
				>
					<Link
						href="/"
						className={`flex items-center gap-3 group ${isCollapsed ? "justify-center" : ""}`}
					>
						<div className="w-10 h-10 flex items-center justify-center shrink-0 relative">
							<Image
								src="/scraping.png"
								alt="ExtrairLeads"
								fill
								sizes="(max-width: 768px) 40px, 40px"
								priority
								quality={100}
								className="object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] contrast-125 brightness-110 transition-transform group-hover:scale-110"
							/>
						</div>
						{!isCollapsed && (
							<span className="font-black text-[20px] tracking-tight leading-none text-white font-heading truncate">
								EXTRAIRLEADS
							</span>
						)}
					</Link>

					<button
						type="button"
						onClick={() => setIsCollapsed(!isCollapsed)}
						className={`absolute z-10 p-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all ${isCollapsed ? "right-[-12px] top-6" : "right-[-12px] top-6"}`}
					>
						{isCollapsed ? (
							<ChevronRight className="w-4 h-4" />
						) : (
							<ChevronLeft className="w-4 h-4" />
						)}
					</button>
				</div>

				{/* Navigation Section */}
				<nav className="flex-1 px-3 py-3 flex flex-col gap-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
					{links.map((link) => {
						const isActive = pathname === link.href;
						const isExternal = link.href.startsWith("http");
						return (
							<div key={link.name} className="flex flex-col gap-1">
								<Link
									href={link.href}
									target={isExternal ? "_blank" : undefined}
									rel={isExternal ? "noopener noreferrer" : undefined}
									className={`flex items-center rounded-xl text-[14px] font-medium transition-all duration-200 group relative px-3 py-2 ${isCollapsed ? "justify-center" : "gap-3"} ${
										isActive
											? "text-emerald-400 bg-emerald-500/10"
											: "text-zinc-400 hover:text-white hover:bg-zinc-900"
									}`}
									title={isCollapsed ? link.name : undefined}
								>
									{isActive && (
										<span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
									)}
									<link.icon
										className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-emerald-500" : "text-zinc-500 group-hover:text-emerald-500/70"}`}
									/>
									{!isCollapsed && (
										<span className="truncate">{link.name}</span>
									)}
								</Link>

								{/* SubLinks removidos */}
							</div>
						);
					})}

					<div className="h-px bg-zinc-900 my-2 mx-2" />
				</nav>

				{/* Footer Area / Credits / Profile */}
				<div
					className={`flex flex-col gap-3 pb-6 border-t border-zinc-900/50 pt-5 ${isCollapsed ? "px-2" : "px-4"}`}
				>
					{/* Credits Box */}
					{isCollapsed ? (
						<div
							className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-zinc-800 bg-zinc-900/40 cursor-help"
							title={`${liveBalance} leads restantes`}
						>
							<span className="font-mono text-[10px] font-bold text-emerald-400">
								{liveBalance}
							</span>
							<Gem className="w-4 h-4 text-emerald-500" />
						</div>
					) : (
						<div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5">
							<div className="flex items-center justify-between mb-2">
								<span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
									Créditos
								</span>
								<span className="font-mono text-xs font-bold text-emerald-400">
									{liveBalance}
								</span>
							</div>
							<div className="w-full h-1.5 bg-zinc-800 rounded-full mb-2 overflow-hidden">
								<div
									className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all"
									style={{
										width: `${Math.min(100, (liveBalance / 500) * 100)}%`,
									}}
								/>
							</div>
							<p className="text-[10px] text-zinc-400 mb-3">
								{liveBalance} leads restantes
							</p>
							<Link
								href="/settings"
								className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
							>
								<CreditCard className="w-3.5 h-3.5" /> Mais leads
							</Link>
						</div>
					)}

					{isCollapsed ? (
						<Link
							href="/settings"
							className="flex justify-center p-2 rounded-xl hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800"
							title={`Plano ${livePlan}`}
						>
							<Gem className="w-4 h-4 text-emerald-500" />
						</Link>
					) : (
						<Link
							href="/settings"
							className="flex items-center justify-between rounded-xl hover:bg-zinc-900/80 transition-colors px-3 py-2 border border-transparent hover:border-zinc-800"
						>
							<div className="flex items-center gap-2">
								<Gem className="w-3.5 h-3.5 text-emerald-500" />
								<span className="text-xs font-bold text-white">
									Plano {livePlan}
								</span>
							</div>
							<ChevronRight className="w-4 h-4 text-zinc-600" />
						</Link>
					)}

					{/* Profile Dropdown Simulation */}
					<div
						className={`flex items-center mt-1 ${isCollapsed ? "justify-center flex-col gap-3 px-0 py-2" : "gap-3 px-3 py-2"}`}
					>
						<div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-xs font-black shrink-0">
							{getInitials(user?.name, user?.email)}
						</div>
						{!isCollapsed && (
							<div className="flex-1 overflow-hidden">
								<span className="block text-xs font-bold text-zinc-300 truncate">
									{user?.name || "Usuário"}
								</span>
								<span className="block text-[10px] text-zinc-500 truncate">
									{user?.email}
								</span>
							</div>
						)}
						<button
							type="button"
							onClick={handleSignOut}
							className={`rounded-lg hover:bg-red-500/10 hover:text-red-400 text-zinc-500 transition-colors ${isCollapsed ? "p-2" : "p-1.5"}`}
							title="Sair"
						>
							<LogOut className="w-4 h-4" />
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
