"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  Target, 
  Workflow, 
  CalendarDays, 
  Sparkles, 
  Sliders, 
  LogOut, 
  User, 
  Menu, 
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { checkWhatsAppConnectionAction } from "@/app/actions";

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{ connected: boolean; state: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Consulta o status do WhatsApp no Evolution Go ao carregar
  useEffect(() => {
    if (user) {
      setCheckingStatus(true);
      checkWhatsAppConnectionAction()
        .then((res) => {
          if (res.success) {
            setWhatsappStatus({ connected: !!res.connected, state: res.state || "DISCONNECTED" });
          }
        })
        .catch((err) => console.error("Erro check connection navbar:", err))
        .finally(() => setCheckingStatus(false));
    }
  }, [user]);

  // Ícones premium atualizados e selecionados a dedo
  const links = [
    { name: "Dashboard", href: "/", icon: LayoutGrid },
    { name: "Leads", href: "/leads", icon: Target },
    { name: "Campanhas", href: "/campaigns", icon: Workflow },
    { name: "Agendamentos", href: "/appointments", icon: CalendarDays },
    { name: "Agentes IA", href: "/agents", icon: Sparkles },
    { name: "Configurações", href: "/settings", icon: Sliders },
  ];

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-zinc-950/60 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-transparent flex items-center justify-center transition-all duration-500 group-hover:scale-105 overflow-hidden">
              <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.15)]" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              ExtrairLeads
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-0.5 bg-zinc-900/40 p-1 rounded-xl border border-zinc-900">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
                >
                  {isActive ? (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-zinc-800/60 rounded-lg border border-zinc-800/40"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : null}
                  <span className={`relative flex items-center gap-2 z-10 ${isActive ? "text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}>
                    <link.icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-500" : "text-zinc-500"}`} />
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {/* Badge Dinâmico de WhatsApp no Desktop */}
            {user && whatsappStatus && (
              <Link 
                href="/settings"
                className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  whatsappStatus.connected 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/10"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${whatsappStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                <span>WhatsApp: {whatsappStatus.connected ? "Conectado" : "Desconectado"}</span>
              </Link>
            )}

            {/* Desktop User Info & SignOut */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-[13px] text-zinc-400">
                  <span className="max-w-[150px] truncate">{user.name || user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all duration-200 text-[13px] font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-black transition-all duration-200 text-[13px] font-bold"
              >
                <User className="w-3.5 h-3.5" />
                Entrar
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs md:hidden"
            />

            {/* Sidebar Container */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0.05, duration: 0.35 }}
              className="fixed top-0 right-0 z-50 h-full w-[280px] bg-zinc-950 border-l border-zinc-900 p-6 shadow-2xl flex flex-col justify-between md:hidden"
            >
              <div className="space-y-6">
                {/* Logo / Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-10 h-10 bg-transparent flex items-center justify-center overflow-hidden">
                      <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-md font-black tracking-tight text-white">
                      ExtrairLeads
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status de Conexão no Celular */}
                {user && whatsappStatus && (
                  <Link 
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                      whatsappStatus.connected 
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                        : "bg-red-500/5 border-red-500/10 text-red-400"
                    }`}
                  >
                    <span className="text-zinc-500 font-medium">WhatsApp:</span>
                    <span className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${whatsappStatus.connected ? "bg-emerald-400" : "bg-red-400"}`} />
                      {whatsappStatus.connected ? "Conectado" : "Desconectado"}
                    </span>
                  </Link>
                )}

                {/* User Info (Mobile Only) */}
                {user && (
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-white border border-zinc-800 font-bold text-sm uppercase">
                      {user.name ? user.name[0] : (user.email ? user.email[0] : "U")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">
                        {user.name || "Usuário"}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Links List */}
                <nav className="flex flex-col gap-1.5">
                  {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-zinc-900 text-white border border-zinc-800/80 font-bold"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-900/30 border border-transparent"
                        }`}
                      >
                        <link.icon className={`w-4 h-4 ${isActive ? "text-emerald-500" : "text-zinc-500"}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom SignOut Button */}
              <div className="pt-4 border-t border-zinc-900">
                {user ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-zinc-100 text-black hover:bg-zinc-200 transition-all text-sm font-bold"
                  >
                    <User className="w-4 h-4" />
                    <span>Entrar no Sistema</span>
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}