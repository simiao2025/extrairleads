"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { resetPasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [tokenValid, setTokenValid] = useState<boolean | null>(null);

	const token = searchParams.get("token") || "";
	const email = searchParams.get("email") || "";

	useEffect(() => {
		if (!token || !email) {
			setTokenValid(false);
			setError(
				"Link de recuperação inválido. Solicite um novo link na página de login.",
			);
			return;
		}
		setTokenValid(true);
	}, [token, email]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		if (password.length < 8) {
			setError("A nova senha deve ter pelo menos 8 caracteres.");
			setLoading(false);
			return;
		}

		if (password !== confirmPassword) {
			setError("As senhas não coincidem.");
			setLoading(false);
			return;
		}

		try {
			const result = await resetPasswordAction(token, email, password);

			if (!result.success) {
				setError(result.error || "Erro ao redefinir a senha.");
				return;
			}

			setSuccess(
				"Senha redefinida com sucesso! Redirecionando para o login...",
			);
			setTimeout(() => {
				router.push("/login");
			}, 3000);
		} catch (_err) {
			setError("Erro ao redefinir a senha. Tente novamente.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-2 overflow-x-hidden selection:bg-emerald-500/30">
			{/* ── Esquerda: Branding (Desktop) ── */}
			<div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-[#050505] border-r border-white/5">
				<div className="absolute inset-0 bg-noise opacity-[0.4] mix-blend-overlay pointer-events-none z-0"></div>
				<div className="absolute inset-0 bg-cyber-grid opacity-40 z-0"></div>
				<div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
				<div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

				<div className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none opacity-60 animate-in fade-in duration-[1500ms] delay-300 fill-mode-both">
					<div className="w-full h-full relative">
						<div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-[#050505]/90 z-10"></div>
						<div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/30 to-transparent z-10"></div>
						<img
							src="/robot.png"
							alt="Robô SDR Neural"
							className="w-full h-full object-cover object-center filter brightness-[0.8]"
						/>
					</div>
				</div>

				<div className="relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
					<Link href="/" className="inline-flex items-center gap-3 group">
						<div className="w-14 h-14 bg-transparent flex items-center justify-center transition-all duration-500 group-hover:scale-105 overflow-hidden">
							<img
								src="/scraping.png"
								alt="Logo"
								className="w-full h-full object-contain"
							/>
						</div>
						<span className="font-heading font-black text-2xl tracking-tight text-white">
							ExtrairLeads
						</span>
					</Link>
				</div>

				<div className="relative z-10 space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
					<span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-[11px] font-bold tracking-widest text-zinc-400 uppercase backdrop-blur-md">
						Segurança
					</span>
					<h1 className="font-heading text-5xl font-black leading-[1.1] tracking-tight text-white">
						Redefina sua senha com segurança.
					</h1>
					<p className="text-zinc-400 text-lg leading-relaxed max-w-md">
						Crie uma senha forte para proteger sua conta e seus dados de
						prospecção.
					</p>
				</div>

				<div className="relative z-10 animate-in fade-in duration-1000 delay-500 fill-mode-both">
					<p className="text-zinc-600 text-sm font-medium">
						&copy; {new Date().getFullYear()} ExtrairLeads Inc. Sistemas
						Industriais.
					</p>
				</div>
			</div>

			{/* ── Direita: Formulário ── */}
			<div className="flex flex-col justify-center items-center p-6 lg:p-12 relative min-h-screen lg:min-h-0 bg-background/50">
				<div className="absolute inset-0 bg-noise opacity-[0.2] mix-blend-overlay pointer-events-none z-0"></div>

				{/* Mobile Header */}
				<div className="lg:hidden w-full max-w-[340px] mb-8 flex flex-col items-center gap-4 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
					<Link href="/" className="inline-flex items-center justify-center">
						<div className="w-14 h-14 bg-transparent flex items-center justify-center overflow-hidden">
							<img
								src="/scraping.png"
								alt="Logo"
								className="w-full h-full object-contain"
							/>
						</div>
					</Link>
					<span className="font-heading font-black text-xl tracking-tight text-white">
						ExtrairLeads
					</span>
				</div>

				<div className="w-full max-w-[340px] space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
					<div className="space-y-2 text-center lg:text-left">
						<h2 className="font-heading text-3xl font-black tracking-tight text-white">
							Redefinir Senha
						</h2>
						<p className="text-zinc-500 text-sm">
							{tokenValid
								? `Defina uma nova senha para ${email}.`
								: "Link inválido ou expirado."}
						</p>
					</div>

					{tokenValid && (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-1.5">
								<label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
									Nova Senha
								</label>
								<div className="relative group">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
									<Input
										type="password"
										placeholder="Mínimo 8 caracteres"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="pl-10 h-11 bg-zinc-900/30 border-zinc-800 text-white focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all shadow-inner"
										required
										minLength={8}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
									Confirmar Nova Senha
								</label>
								<div className="relative group">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
									<Input
										type="password"
										placeholder="Repita a nova senha"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="pl-10 h-11 bg-zinc-900/30 border-zinc-800 text-white focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all shadow-inner"
										required
										minLength={8}
									/>
								</div>
							</div>

							{error && (
								<div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
									<AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
									<p className="text-red-400 text-xs font-medium leading-relaxed">
										{error}
									</p>
								</div>
							)}

							{success && (
								<div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
									<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
									<p className="text-emerald-400 text-xs font-medium leading-relaxed">
										{success}
									</p>
								</div>
							)}

							<Button
								type="submit"
								disabled={loading || !!success}
								className="w-full h-11 mt-2 bg-white hover:bg-zinc-200 text-black font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
							>
								{loading ? (
									"Redefinindo..."
								) : (
									<>
										Redefinir Senha
										<ArrowRight className="w-4 h-4 ml-2" />
									</>
								)}
							</Button>
						</form>
					)}

					{!tokenValid && error && (
						<div className="space-y-4">
							<div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
								<AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
								<p className="text-red-400 text-xs font-medium leading-relaxed">
									{error}
								</p>
							</div>
						</div>
					)}

					<div className="text-center pt-2">
						<Link
							href="/login"
							className="text-[13px] text-zinc-400 hover:text-white transition-colors font-medium"
						>
							Voltar para o login
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}
