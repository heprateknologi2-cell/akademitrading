"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Ringkasan" },
  { href: "/screener", label: "Screener" },
  { href: "/heatmap", label: "Heatmap" },
  { href: "/sectors", label: "Sektor" },
  { href: "/calendar", label: "Kalender" },
  { href: "/dividends", label: "Dividen" },
  { href: "/signals", label: "Sinyal" },
  { href: "/ideas", label: "Ide" },
  { href: "/portfolio", label: "Portofolio" },
  { href: "/backtest", label: "Backtest" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const links = NAV_ITEMS.map((item) => {
    const active = pathname === item.href;
    return (
      <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-emerald-400/10 text-emerald-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
        {item.label}
      </Link>
    );
  });

  return (
    <nav aria-label="Navigasi utama" className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
          <Image src="/logo.png" alt="" width={30} height={30} className="rounded-lg" priority />
          <span className="font-bold tracking-tight">akademitrading</span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">{links}</div>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          {session?.user ? (
            <>
              <Link href="/subscription" className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                {session.user.tier === "free" ? "Upgrade" : "Pro"}
              </Link>
              <Link href="/settings" className="max-w-32 truncate text-sm text-slate-300">{session.user.name || session.user.email}</Link>
              <button onClick={() => signOut()} className="text-xs text-slate-500 hover:text-white">Keluar</button>
            </>
          ) : (
            <Link href="/auth/login" className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Masuk</Link>
          )}
        </div>

        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Tutup menu" : "Buka menu"}
          className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 xl:hidden">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div id="mobile-navigation" className="border-t border-white/10 bg-[#07101f] px-4 py-4 xl:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 sm:grid-cols-3">{links}</div>
          <div className="mx-auto mt-4 flex max-w-7xl items-center gap-3 border-t border-white/10 pt-4">
            {session?.user ? (
              <><Link href="/settings" className="flex-1 truncate text-sm text-slate-300">{session.user.name || session.user.email}</Link><button onClick={() => signOut()} className="text-sm text-slate-400">Keluar</button></>
            ) : (
              <><Link href="/auth/login" className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center text-sm">Masuk</Link><Link href="/auth/register" className="flex-1 rounded-lg bg-emerald-400 px-4 py-2 text-center text-sm font-semibold text-slate-950">Daftar gratis</Link></>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
