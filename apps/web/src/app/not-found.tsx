import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-4xl font-bold text-emerald-400">404</h1>
        <p className="text-sm text-white/60">Halaman yang Anda cari tidak ditemukan.</p>
        <Link
          href="/"
          className="inline-block bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg px-4 py-3 text-sm transition-colors"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
