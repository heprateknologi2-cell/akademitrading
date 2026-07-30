import cron from "node-cron";
import { config } from "./config";
import { broadcastSignal } from "./bot";

export function startScheduler() {
  cron.schedule("30 7 * * 1-5", async () => {
    console.log("[Scheduler] Morning signal broadcast");
    try {
      const res = await fetch(`${config.API_URL}/api/signals/today`);
      const json = await res.json();
      if (json.data?.length > 0) {
        await broadcastSignal(json.data);
      }
    } catch (e) {
      console.error("[Scheduler] Error:", e);
    }
  }, { timezone: "Asia/Jakarta" });

  cron.schedule("30 15 * * 1-5", async () => {
    console.log("[Scheduler] Afternoon signal broadcast");
    try {
      const res = await fetch(`${config.API_URL}/api/signals/today`);
      const json = await res.json();
      if (json.data?.length > 0) {
        await broadcastSignal(json.data);
      }
    } catch (e) {
      console.error("[Scheduler] Error:", e);
    }
  }, { timezone: "Asia/Jakarta" });

  console.log("⏰ Scheduler started (07:30 & 15:30 WIB, Mon-Fri)");
}
