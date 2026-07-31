"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex items-center justify-center bg-[#020817] text-white">
        <div className="w-full max-w-sm space-y-4 text-center px-4">
          <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
          <p className="text-sm text-white/60">
            {error.digest ? `Kode: ${error.digest}` : "Silakan coba lagi."}
          </p>
          <button
            type="button"
            onClick={unstable_retry}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg px-4 py-3 text-sm transition-colors"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
