"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, Settings, Bot, Megaphone, Users, Calendar, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
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
    <nav className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-background/60 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:shadow-emerald-500/30 transition-all duration-500 group-hover:scale-105 border border-white/10">
            <Layers className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            ExtrairLeads
          </span>
        </Link>

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
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-[13px] text-zinc-500">
                <span className="max-w-[150px] truncate">{user.name || user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 text-[13px] font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 text-[13px] font-bold"
            >
              <User className="w-3.5 h-3.5" />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}