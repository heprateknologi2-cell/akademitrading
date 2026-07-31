"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/screener", label: "Screener" },
  { href: "/signals", label: "Signals" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="border-b border-white/10 bg-[#020817]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-black">
            A
          </div>
          <span className="font-bold text-lg tracking-tight">akademitrading</span>
        </Link>

        <div className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive ? "text-emerald-400" : "text-white/60 hover:text-white/90"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link href="/subscription" className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                {session.user.tier === "free" ? "UPGRADE" : "PRO"}
              </Link>
              <Link href="/dashboard" className="text-sm text-white/60 hover:text-white/90">
                {session.user.name || session.user.email}
              </Link>
              <button onClick={() => signOut()} className="text-xs text-white/40 hover:text-white/70">
                Keluar
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
