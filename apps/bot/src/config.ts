import dotenv from "dotenv";
dotenv.config();

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN || "YOUR_BOT_TOKEN",
  API_URL: process.env.API_URL || "http://localhost:8000",
  CHANNEL_IDS: process.env.CHANNEL_IDS || "",
};
