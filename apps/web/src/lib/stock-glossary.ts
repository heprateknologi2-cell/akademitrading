export type GlossaryCategory = "Fundamental" | "Teknikal" | "Perdagangan" | "Corporate Action";

export interface GlossaryTerm {
  term: string;
  aliases?: string[];
  category: GlossaryCategory;
  short: string;
  description: string;
}

export const STOCK_GLOSSARY: GlossaryTerm[] = [
  { term: "PER", aliases: ["P/E", "PE Ratio"], category: "Fundamental", short: "Harga saham dibanding laba per saham.", description: "Price to Earnings Ratio membandingkan harga saham dengan EPS. PER sebaiknya dibandingkan dengan emiten sejenis dan riwayatnya, bukan dipakai sendirian." },
  { term: "PBV", aliases: ["P/B"], category: "Fundamental", short: "Harga saham dibanding nilai buku per saham.", description: "Price to Book Value menunjukkan berapa kali pasar menghargai nilai buku perusahaan. Relevansinya berbeda antar sektor." },
  { term: "EPS", category: "Fundamental", short: "Laba bersih yang tersedia per lembar saham.", description: "Earnings per Share membantu melihat kemampuan perusahaan menghasilkan laba bagi setiap lembar saham. Perhatikan tren dan efek aksi korporasi." },
  { term: "ROE", category: "Fundamental", short: "Efisiensi perusahaan menghasilkan laba dari ekuitas.", description: "Return on Equity adalah laba bersih dibagi ekuitas. ROE tinggi perlu diperiksa bersama utang karena leverage dapat memperbesar nilainya." },
  { term: "DER", category: "Fundamental", short: "Perbandingan total utang terhadap ekuitas.", description: "Debt to Equity Ratio mengukur leverage. Batas yang wajar bergantung sektor; bank dan perusahaan pembiayaan tidak cocok dinilai dengan patokan perusahaan nonkeuangan." },
  { term: "Dividend Yield", category: "Fundamental", short: "Dividen tahunan relatif terhadap harga saham.", description: "Dividend yield bukan jaminan dividen berikutnya. Periksa juga payout ratio, arus kas, dan konsistensi pembagian dividen." },
  { term: "Market Cap", category: "Fundamental", short: "Nilai pasar seluruh saham beredar.", description: "Kapitalisasi pasar dihitung dari harga saham dikali jumlah saham beredar dan biasa dipakai untuk mengelompokkan skala emiten." },
  { term: "RSI", aliases: ["RSI (14)"], category: "Teknikal", short: "Momentum harga pada skala 0–100.", description: "Relative Strength Index mengukur momentum. Nilai di atas 70 sering disebut overbought dan di bawah 30 oversold, tetapi bukan sinyal jual/beli otomatis." },
  { term: "MACD", category: "Teknikal", short: "Indikator momentum berbasis selisih exponential moving average.", description: "MACD membantu membaca arah dan perubahan momentum melalui garis MACD, signal line, dan histogram." },
  { term: "SMA", aliases: ["SMA 20", "SMA 50", "SMA 200"], category: "Teknikal", short: "Rata-rata harga dalam sejumlah periode.", description: "Simple Moving Average meratakan pergerakan harga. Angka setelah SMA menunjukkan jumlah candle yang dihitung." },
  { term: "Bollinger Bands", aliases: ["BB Upper", "BB Lower"], category: "Teknikal", short: "Pita volatilitas di sekitar moving average.", description: "Bollinger Bands melebar saat volatilitas naik dan menyempit saat turun. Sentuhan pita bukan sinyal reversal otomatis." },
  { term: "ATR", category: "Teknikal", short: "Rata-rata rentang pergerakan harga.", description: "Average True Range mengukur volatilitas, bukan arah. ATR dapat membantu menentukan jarak stop loss dan ukuran posisi." },
  { term: "Support", category: "Teknikal", short: "Area harga yang cenderung menahan penurunan.", description: "Support adalah zona, bukan angka pasti. Level menjadi lebih relevan bila didukung volume dan beberapa kali pengujian." },
  { term: "Resistance", category: "Teknikal", short: "Area harga yang cenderung menahan kenaikan.", description: "Resistance dapat berubah menjadi support setelah breakout yang tervalidasi, tetapi tetap memiliki risiko false breakout." },
  { term: "Lot", category: "Perdagangan", short: "Satuan transaksi saham; 1 lot berisi 100 saham.", description: "Di pasar reguler BEI, pembelian dan penjualan saham dilakukan dalam kelipatan lot." },
  { term: "Bid", category: "Perdagangan", short: "Antrean harga beli yang diajukan pelaku pasar.", description: "Bid tertinggi menunjukkan harga beli terbaik yang sedang tersedia di order book." },
  { term: "Offer", category: "Perdagangan", short: "Antrean harga jual yang diajukan pelaku pasar.", description: "Offer terendah menunjukkan harga jual terbaik yang sedang tersedia di order book." },
  { term: "ARA/ARB", category: "Perdagangan", short: "Batas kenaikan dan penurunan harga harian BEI.", description: "Auto Rejection Atas dan Bawah membatasi perubahan harga dalam satu hari bursa. Persentasenya mengikuti ketentuan BEI yang berlaku." },
  { term: "Cum Date", category: "Corporate Action", short: "Hari terakhir membeli agar memperoleh hak aksi korporasi.", description: "Investor yang tercatat sesuai jadwal pada cum date berhak atas dividen atau hak lain yang diumumkan emiten." },
  { term: "Ex Date", category: "Corporate Action", short: "Hari ketika pembelian baru tidak lagi memperoleh hak.", description: "Pada ex date, pembeli baru tidak mendapat hak corporate action terkait dan harga dapat menyesuaikan secara teoritis." },
  { term: "Rights Issue", category: "Corporate Action", short: "Penawaran saham baru kepada pemegang saham lama.", description: "Rights issue dapat menambah modal sekaligus menimbulkan dilusi bila hak tidak dieksekusi atau dijual." },
];

export function findGlossaryTerm(term: string) {
  const query = term.toLowerCase();
  return STOCK_GLOSSARY.find((item) => item.term.toLowerCase() === query || item.aliases?.some((alias) => alias.toLowerCase() === query));
}
