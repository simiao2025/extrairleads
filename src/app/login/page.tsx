"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { checkEmailVerifiedAction, forgotPasswordAction, registerAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Capturar parâmetros da URL de redirecionamento de confirmação de e-mail
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get("success");
    const errorParam = params.get("error");

    if (successParam === "email_verified") {
      setSuccess("Sua conta foi ativada com sucesso! Faça login abaixo para começar.");
    }
    if (errorParam === "token_expired") {
      setError("O link de ativação expirou. Faça o registro novamente.");
    } else if (errorParam === "token_invalid") {
      setError("O link de ativação é inválido ou já foi utilizado.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showForgot) {
      setForgotLoading(true);
      setForgotError("");
      setForgotSuccess("");
      try {
        const result = await forgotPasswordAction(forgotEmail);
        if (!result.success) {
          setForgotError(result.error || "Erro ao enviar e-mail de recuperação.");
          return;
        }
        setForgotSuccess(result.message || "Verifique sua caixa de entrada.");
      } catch (_err) {
        setForgotError("Erro ao enviar e-mail de recuperação. Tente novamente.");
      } finally {
        setForgotLoading(false);
      }
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // ── Pre-check para e-mail verificado ──
        const check = await checkEmailVerifiedAction(form.email);
        if (check.success && !check.verified) {
          setError(
            "Sua conta ainda não foi ativada. Verifique a caixa de entrada do seu e-mail para confirmar seu cadastro.",
          );
          setLoading(false);
          return;
        }

        // ── Login ──
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          setError("E-mail ou senha incorretos.");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        // ── Registro ──
        const result = await registerAction(form.name, form.email, form.password);

        if (!result.success) {
          setError(result.error || "Erro ao criar conta.");
          return;
        }

        setSuccess(
          "Conta criada com sucesso! Enviamos um link de ativação segura para o seu e-mail. Por favor, confirme seu cadastro para liberar o login.",
        );
        setIsLogin(true);
        setForm({ name: "", email: form.email, password: "" });
      }
    } catch (_err) {
      setError(
        isLogin ? "Erro ao fazer login. Tente novamente." : "Erro ao criar conta. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-2 overflow-x-hidden selection:bg-emerald-500/30">
      {/* ── Esquerda: Branding & Visuals (Apenas Desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-[#050505] border-r border-white/5">
        {/* Texturas e Efeitos */}
        <div className="absolute inset-0 bg-noise opacity-[0.4] mix-blend-overlay pointer-events-none z-0"></div>
        <div className="absolute inset-0 bg-cyber-grid opacity-40 z-0"></div>

        {/* Gradientes Atmosféricos */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* ── Robô Humanoide SDR Neural (Background Full-Bleed Premium) ── */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none opacity-60 animate-in fade-in duration-[1500ms] delay-300 fill-mode-both">
          <div className="w-full h-full relative">
            {/* Máscaras de Gradiente para mesclar o robô no fundo preto perfeitamente */}
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
              <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight text-white">
              ExtrairLeads
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-[11px] font-bold tracking-widest text-zinc-400 uppercase backdrop-blur-md">
            Acesso Restrito
          </span>
          <h1 className="font-heading text-5xl font-black leading-[1.1] tracking-tight text-white">
            O motor neural de prospecção B2B.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            Identifique, qualifique e converta contas enterprise de forma invisível. Nossa
            inteligência artificial trabalha em milissegundos para lotar seu pipeline.
          </p>
        </div>

        <div className="relative z-10 animate-in fade-in duration-1000 delay-500 fill-mode-both">
          <p className="text-zinc-600 text-sm font-medium">
            &copy; {new Date().getFullYear()} ExtrairLeads Inc. Sistemas Industriais.
          </p>
        </div>
      </div>

      {/* ── Direita: Formulário de Autenticação ── */}
      <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative min-h-screen lg:min-h-0 bg-background/50">
        <div className="absolute inset-0 bg-noise opacity-[0.2] mix-blend-overlay pointer-events-none z-0"></div>

        {/* Mobile Header */}
        <div className="lg:hidden w-full max-w-[340px] mb-8 flex flex-col items-center gap-4 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link href="/" className="inline-flex items-center justify-center">
            <div className="w-14 h-14 bg-transparent flex items-center justify-center overflow-hidden">
              <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
          <span className="font-heading font-black text-xl tracking-tight text-white">
            ExtrairLeads
          </span>
        </div>

        <div className="w-full max-w-[340px] space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-heading text-3xl font-black tracking-tight text-white">
              {showForgot ? "Recuperar Senha" : isLogin ? "Acessar Painel" : "Criar Conta"}
            </h2>
            <p className="text-zinc-500 text-sm">
              {showForgot
                ? "Informe seu e-mail para receber o link de redefinição."
                : isLogin
                  ? "Insira suas credenciais corporativas abaixo."
                  : "Inicie sua jornada de prospecção inteligente."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {showForgot ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Email Corporativo
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                    <Input
                      type="email"
                      placeholder="voce@empresa.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10 h-11 bg-zinc-900/30 border-zinc-800 text-white focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs font-medium leading-relaxed">
                      {forgotError}
                    </p>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-emerald-400 text-xs font-medium leading-relaxed">
                      {forgotSuccess}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={forgotLoading || !!forgotSuccess}
                  className="w-full h-11 mt-2 bg-white hover:bg-zinc-200 text-black font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
                >
                  {forgotLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
              </>
            ) : (
              <>
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Nome Completo
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                      <Input
                        placeholder="Seu nome"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="pl-10 h-11 bg-zinc-900/30 border-zinc-800 text-white focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all shadow-inner"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Email Corporativo
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                    <Input
                      type="email"
                      placeholder="voce@empresa.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="pl-10 h-11 bg-zinc-900/30 border-zinc-800 text-white focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Senha
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgot(true);
                          setForgotEmail(form.email);
                          setForgotError("");
                          setForgotSuccess("");
                        }}
                        className="text-[11px] font-medium text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="pl-10 h-11 bg-zinc-900/30 border-zinc-800 text-white focus-visible:ring-zinc-700 focus-visible:border-zinc-700 transition-all shadow-inner"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs font-medium leading-relaxed">{error}</p>
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
                  disabled={loading}
                  className="w-full h-11 mt-2 bg-white hover:bg-zinc-200 text-black font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
                >
                  {loading ? (
                    isLogin ? (
                      "Autenticando..."
                    ) : (
                      "Criando conta..."
                    )
                  ) : (
                    <>
                      {isLogin ? "Acessar Sistema" : "Criar Conta Agora"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
          </form>

          <div className="text-center pt-2">
            {showForgot ? (
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setForgotError("");
                  setForgotSuccess("");
                }}
                className="text-[13px] text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer"
              >
                Voltar para o login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="text-[13px] text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer"
              >
                {isLogin
                  ? "Ainda não tem acesso? Solicite uma conta"
                  : "Já possui credenciais? Faça login"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
