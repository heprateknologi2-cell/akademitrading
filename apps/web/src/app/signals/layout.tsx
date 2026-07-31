import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sinyal Saham Indonesia Hari Ini | Akademi Trading",
  description: "Pantau sinyal teknikal saham Indonesia lengkap dengan konfirmasi, konteks risiko, skenario edukatif, dan metodologi transparan.",
  openGraph: {
    title: "Sinyal Saham Indonesia Hari Ini | Akademi Trading",
    description: "Alat bantu analisis sinyal teknikal dengan konteks konfirmasi dan risiko. Bukan rekomendasi personal.",
  },
};

export default function SignalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
