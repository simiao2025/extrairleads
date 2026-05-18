"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Lock, Mail, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // ── Login ──
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Email ou senha incorretos.");
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

        // Auto-login após registro bem-sucedido
        const loginResult = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (loginResult?.error) {
          // Conta criada mas falhou o auto-login — direciona para login manual
          setSuccess("Conta criada com sucesso! Faça login.");
          setIsLogin(true);
          setForm({ name: "", email: form.email, password: "" });
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch {
      setError(isLogin ? "Erro ao fazer login. Tente novamente." : "Erro ao criar conta. Tente novamente.");
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

        <div className="relative z-10 animate-in fade-in slide-in-from-top-8 duration-1000">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-zinc-900/50 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10 group-hover:shadow-emerald-500/20 transition-all duration-500 border border-white/10 group-hover:scale-105 overflow-hidden p-2">
              <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight text-white">ExtrairLeads</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold tracking-widest text-emerald-400 uppercase backdrop-blur-md">
            <span className="pulse-dot" />
            Acesso Restrito
          </span>
          <h1 className="font-heading text-5xl font-black leading-[1.1] tracking-tight text-white">
            O motor neural de prospecção B2B.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            Identifique, qualifique e converta contas enterprise de forma invisível. Nossa inteligência artificial trabalha em milissegundos para lotar seu pipeline.
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
            <div className="w-12 h-12 bg-zinc-900/50 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10 border border-white/10 overflow-hidden p-2">
              <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
          <span className="font-heading font-black text-xl tracking-tight text-white">ExtrairLeads</span>
        </div>

        <div className="w-full max-w-[340px] space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
          
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-heading text-3xl font-black tracking-tight text-white">
              {isLogin ? "Acessar Painel" : "Criar Conta"}
            </h2>
            <p className="text-zinc-500 text-sm">
              {isLogin
                ? "Insira suas credenciais corporativas abaixo."
                : "Inicie sua jornada de prospecção inteligente."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Nome Completo
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10 h-11 bg-zinc-950/50 border-white/10 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all shadow-inner"
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type="email"
                  placeholder="voce@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10 h-11 bg-zinc-950/50 border-white/10 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all shadow-inner"
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
                  <button type="button" className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300">
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 h-11 bg-zinc-950/50 border-white/10 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all shadow-inner"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                <p className="text-red-400 text-xs font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                <p className="text-emerald-400 text-xs font-medium text-center">
                  {success}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300"
            >
              {loading ? (
                isLogin ? "Autenticando..." : "Criando conta..."
              ) : (
                <>
                  {isLogin ? "Acessar Sistema" : "Criar Conta Agora"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="text-[13px] text-zinc-400 hover:text-white transition-colors font-medium"
            >
              {isLogin
                ? "Ainda não tem acesso? Solicite uma conta"
                : "Já possui credenciais? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}