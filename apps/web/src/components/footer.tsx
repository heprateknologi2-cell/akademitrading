import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#020817] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="akademitrading"
                width={24}
                height={24}
                className="rounded-md"
              />
              <span className="font-bold tracking-tight">akademitrading</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Screener dan sinyal trading saham Indonesia. Analisis teknikal, fundamental, dan bandarmology.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide">Fitur</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/screener" className="text-white/40 hover:text-white/70 transition-colors">Screener</Link></li>
              <li><Link href="/signals" className="text-white/40 hover:text-white/70 transition-colors">Sinyal</Link></li>
              <li><Link href="/portfolio" className="text-white/40 hover:text-white/70 transition-colors">Portofolio</Link></li>
              <li><Link href="/backtest" className="text-white/40 hover:text-white/70 transition-colors">Backtest</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide">Akun</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/auth/login" className="text-white/40 hover:text-white/70 transition-colors">Masuk</Link></li>
              <li><Link href="/auth/register" className="text-white/40 hover:text-white/70 transition-colors">Daftar</Link></li>
              <li><Link href="/subscription" className="text-white/40 hover:text-white/70 transition-colors">Langganan</Link></li>
              <li><Link href="/settings" className="text-white/40 hover:text-white/70 transition-colors">Pengaturan</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-white/30">
            &copy; {year} akademitrading. Semua hak dilindungi.
          </p>
          <p className="text-xs text-white/30">
            Bukan saran investasi. Trading saham mengandung risiko kerugian.
          </p>
        </div>
      </div>
    </footer>
  );
}
