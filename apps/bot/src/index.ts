import { startBot } from "./bot";
import { startScheduler } from "./scheduler";

console.log("🤖 Akademitrading Bot starting...");
startScheduler();
startBot();
