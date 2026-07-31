import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { config } from "./config";

const bot = new Bot(config.BOT_TOKEN);

bot.command("start", (ctx) => {
  ctx.reply(
    `📊 *Akademitrading Bot*\n\n` +
    `Screener dan sinyal trading saham Indonesia.\n\n` +
    `*Commands:*\n` +
    `/signal — Sinyal trading hari ini\n` +
    `/screener — Buka screener\n` +
    `/bbc — Info saham (contoh: /bbc BBCA)\n` +
    `/help — Bantuan`,
    { parse_mode: "Markdown", reply_markup: new Keyboard().text("/signal").text("/screener").resized() }
  );
});

bot.command("help", (ctx) => ctx.reply(
  `*Cara Penggunaan:*\n\n` +
  `/signal — Lihat sinyal trading hari ini\n` +
  `/screener — Akses screener web\n` +
  `/bbc <kode> — Detail saham (contoh: /bbc BBCA)\n` +
  `/alert <kode> <harga> — Set alert harga\n\n` +
  `Website: https://akademitrading.com`,
  { parse_mode: "Markdown" }
));

bot.command("signal", async (ctx) => {
  await ctx.reply(`📡 *Sinyal Hari Ini*\n\nMengambil data terbaru...\n\n` +
    `⏳ Tunggu sebentar, data sedang diproses...\n\n` +
    `Atau buka website untuk hasil lengkap:\nhttps://akademitrading.com/signals`,
    { parse_mode: "Markdown" }
  );
});

bot.command("screener", (ctx) => {
  ctx.reply(`🔍 *Screener Saham*\n\nBuka screener interaktif:\nhttps://akademitrading.com/screener\n\n` +
    `Filter berdasarkan RSI, MACD, sektor, harga, dan banyak lagi.`,
    { parse_mode: "Markdown" }
  );
});

bot.command("bbc", async (ctx) => {
  const code = ctx.match?.trim().toUpperCase();
  if (!code) {
    return ctx.reply("Gunakan: /bbc BBCA");
  }
  try {
    const res = await fetch(`${config.API_URL}/api/stocks/${code}`);
    const json = (await res.json()) as { data?: any };
    if (!json.data?.name) {
      return ctx.reply(`❌ Saham ${code} tidak ditemukan`);
    }
    const d = json.data;
    const changeEmoji = d.change_percent >= 0 ? "📈" : "📉";
    const signals = d.signals?.slice(0, 3).map((s: any) => `• ${s.description}`).join("\n") || "Tidak ada sinyal";
    ctx.reply(
      `${changeEmoji} *${d.code} — ${d.name}*\n` +
      `Harga: Rp${d.price?.toLocaleString() ?? "-"}\n` +
      `Change: ${d.change_percent >= 0 ? "+" : ""}${d.change_percent?.toFixed(2) ?? "0.00"}%\n` +
      `Sektor: ${d.sector || "-"}\n\n` +
      `*Indikator:*\n` +
      `RSI: ${d.indicators?.rsi?.toFixed(1) ?? "-"}\n` +
      `MACD: ${d.indicators?.macd?.toFixed(2) ?? "-"}\n` +
      `SMA 20: ${d.indicators?.sma_20?.toLocaleString() ?? "-"}\n\n` +
      `*Sinyal:*\n${signals}\n\n` +
      `Detail: https://akademitrading.com/stocks/${d.code}`,
      { parse_mode: "Markdown" }
    );
  } catch {
    ctx.reply(`❌ Gagal mengambil data ${code}`);
  }
});

bot.command("alert", (ctx) => {
  ctx.reply("🔔 Fitur alert harga akan segera tersedia!\n\nPantau terus update berikutnya.");
});

export async function broadcastSignal(data: any[]) {
  try {
    const top5 = data.slice(0, 5);
    let msg = `📊 *AKADEMITRADING SIGNAL*\n${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;
    for (const s of top5) {
      const emoji = s.direction === "buy" ? "🟢" : s.direction === "sell" ? "🔴" : "⚪";
      msg += `${emoji} *${s.code}* — ${s.description}\n`;
    }
    msg += `\n💡 Detail: https://akademitrading.com/signals`;

    const channels = config.CHANNEL_IDS?.split(",") || [];
    for (const channelId of channels) {
      const cid = channelId.trim();
      if (cid) {
        await bot.api.sendMessage(cid, msg, { parse_mode: "Markdown" }).catch(() => {});
      }
    }
  } catch (e) {
    console.error("Broadcast error:", e);
  }
}

export async function notifyDividends(items: Array<{ telegram_id: string; code: string; ex_date: string; amount?: number }>) {
  for (const item of items) {
    const amount = item.amount ? ` sebesar Rp${item.amount.toLocaleString("id-ID")}/saham` : "";
    const date = new Date(item.ex_date).toLocaleDateString("id-ID", { dateStyle: "long" });
    await bot.api.sendMessage(item.telegram_id, `💰 *Pengingat Dividen*\n\n${item.code} akan memasuki ex-date pada ${date}${amount}.`, { parse_mode: "Markdown" }).catch(() => {});
  }
}

export function startBot() {
  bot.start({ onStart: () => console.log("🤖 Bot started") });
}
