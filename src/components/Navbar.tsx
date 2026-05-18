"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, Settings, Bot, Megaphone, Users, Calendar, LogOut, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { useState } from "react";

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

  const links = [
    { name: "Dashboard", href: "/", icon: Layers },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Campanhas", href: "/campaigns", icon: Megaphone },
    { name: "Agendamentos", href: "/appointments", icon: Calendar },
    { name: "Agentes IA", href: "/agents", icon: Bot },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-background/60 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-zinc-900/50 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/10 group-hover:shadow-emerald-500/20 transition-all duration-500 group-hover:scale-105 border border-white/10 overflow-hidden p-1.5">
              <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              ExtrairLeads
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-0.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
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
                      className="absolute inset-0 bg-white/[0.08] rounded-lg border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : null}
                  <span className={`relative flex items-center gap-2 z-10 ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                    <link.icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : ""}`} />
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop User Info & SignOut */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-[13px] text-zinc-500">
                  <span className="max-w-[150px] truncate">{user.name || user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 text-[13px] font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 text-[13px] font-bold"
              >
                <User className="w-3.5 h-3.5" />
                Entrar
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
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
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Sidebar Container */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
              className="fixed top-0 right-0 z-50 h-full w-[280px] bg-zinc-950 border-l border-white/[0.06] p-6 shadow-2xl flex flex-col justify-between md:hidden"
            >
              <div className="space-y-6">
                {/* Logo / Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-zinc-900/50 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden p-1.5">
                      <img src="/scraping.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-md font-black tracking-tight text-white">
                      ExtrairLeads
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* User Info (Mobile Only) */}
                {user && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 font-bold text-sm uppercase">
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
                            ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                        }`}
                      >
                        <link.icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom SignOut Button */}
              <div className="pt-4 border-t border-white/[0.06]">
                {user ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold"
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