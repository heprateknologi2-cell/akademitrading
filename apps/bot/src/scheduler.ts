import cron from "node-cron";
import { config } from "./config";
import { broadcastSignal, notifyDividends } from "./bot";

export function startScheduler() {
  cron.schedule("30 7 * * 1-5", async () => {
    console.log("[Scheduler] Morning signal broadcast");
    try {
      const res = await fetch(`${config.API_URL}/api/signals/today`);
      const json = (await res.json()) as { data?: any };
      if (json.data?.length > 0) {
        await broadcastSignal(json.data);
        await fetch(`${config.API_URL}/api/signals/broadcast`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signals: json.data }) }).catch(() => {});
      }
    } catch (e) {
      console.error("[Scheduler] Error:", e);
    }
  }, { timezone: "Asia/Jakarta" });

  cron.schedule("30 15 * * 1-5", async () => {
    console.log("[Scheduler] Afternoon signal broadcast");
    try {
      const res = await fetch(`${config.API_URL}/api/signals/today`);
      const json = (await res.json()) as { data?: any };
      if (json.data?.length > 0) {
        await broadcastSignal(json.data);
        await fetch(`${config.API_URL}/api/signals/broadcast`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signals: json.data }) }).catch(() => {});
      }
    } catch (e) {
      console.error("[Scheduler] Error:", e);
    }
  }, { timezone: "Asia/Jakarta" });

  cron.schedule("0 8 * * *", async () => {
    console.log("[Scheduler] Dividend reminders");
    try {
      const res = await fetch(`${config.API_URL}/api/dividends/notifications?days=3`);
      const json = (await res.json()) as { data?: Array<{ telegram_id: string; code: string; ex_date: string; amount?: number }> };
      if (json.data?.length) await notifyDividends(json.data);
    } catch (e) {
      console.error("[Scheduler] Dividend error:", e);
    }
  }, { timezone: "Asia/Jakarta" });

  console.log("⏰ Scheduler started (07:30 & 15:30 WIB, Mon-Fri)");
}
