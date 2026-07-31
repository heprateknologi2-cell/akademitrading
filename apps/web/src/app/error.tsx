"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
        <p className="text-sm text-white/60">
          {error.digest ? `Kode: ${error.digest}` : "Gagal memuat halaman. Silakan coba lagi."}
        </p>
        <button
          type="button"
          onClick={unstable_retry}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg px-4 py-3 text-sm transition-colors"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
