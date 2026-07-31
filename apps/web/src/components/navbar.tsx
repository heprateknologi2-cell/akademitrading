"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PRIMARY_ITEMS = [
  { href: "/", label: "Ringkasan" },
  { href: "/screener", label: "Screener" },
  { href: "/signals", label: "Sinyal" },
  { href: "/ideas", label: "Ide" },
  { href: "/portfolio", label: "Portofolio" },
];

const TOOL_ITEMS = [
  { href: "/heatmap", label: "Heatmap" },
  { href: "/sectors", label: "Sektor" },
  { href: "/calendar", label: "Kalender" },
  { href: "/dividends", label: "Dividen" },
  { href: "/backtest", label: "Backtest" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => href === "/" ? pathname === href : pathname.startsWith(href);
  const toolsActive = TOOL_ITEMS.some((item) => isActive(item.href));

  useEffect(() => {
    function closeTools(event: MouseEvent) {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    }
    function closeMenus(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", closeTools);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("mousedown", closeTools);
      document.removeEventListener("keydown", closeMenus);
    };
  }, []);

  const linkClass = (href: string) => `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive(href)
      ? "bg-emerald-400/10 text-emerald-300"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

  return (
    <nav aria-label="Navigasi utama" className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/85 shadow-[0_1px_0_rgb(255_255_255/0.02)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg" aria-label="Akademitrading, halaman utama">
          <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg ring-1 ring-white/10" priority />
          <span className="font-bold tracking-tight">akademitrading</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {PRIMARY_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}

          <div ref={toolsRef} className="relative">
            <button
              type="button"
              onClick={() => setToolsOpen((value) => !value)}
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
              className={`flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${toolsActive ? "bg-emerald-400/10 text-emerald-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              Tools <ChevronDown size={15} className={`transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] grid w-48 gap-1 rounded-xl border border-white/10 bg-[#081221] p-2 shadow-2xl shadow-black/40">
                {TOOL_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} role="menuitem" onClick={() => setToolsOpen(false)} aria-current={isActive(item.href) ? "page" : undefined} className={linkClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {session?.user ? (
            <>
              <Link href="/subscription" className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/15">
                {session.user.tier === "free" ? "Upgrade" : "Pro"}
              </Link>
              <Link href="/settings" className="max-w-28 truncate rounded-md text-sm text-slate-300 hover:text-white">{session.user.name || session.user.email}</Link>
              <button onClick={() => signOut()} className="rounded-md px-2 py-2 text-xs text-slate-500 hover:bg-white/5 hover:text-white">Keluar</button>
            </>
          ) : (
            <Link href="/auth/login" className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-300">Masuk</Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          className="rounded-lg border border-white/10 p-2.5 text-slate-300 hover:bg-white/5 lg:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-navigation" className="border-t border-white/10 bg-[#07101f]/98 px-4 py-4 shadow-2xl lg:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 sm:grid-cols-3">
            {[...PRIMARY_ITEMS, ...TOOL_ITEMS].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={isActive(item.href) ? "page" : undefined} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mx-auto mt-4 flex max-w-7xl items-center gap-3 border-t border-white/10 pt-4">
            {session?.user ? (
              <>
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex-1 truncate rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5">{session.user.name || session.user.email}</Link>
                <button onClick={() => signOut()} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-300">Keluar</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-center text-sm">Masuk</Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg bg-emerald-400 px-4 py-2.5 text-center text-sm font-semibold text-slate-950">Daftar gratis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
