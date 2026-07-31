import { pgTable, serial, varchar, decimal, text, timestamp, uniqueIndex, index, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 100 }),
  telegramId: varchar("telegram_id", { length: 50 }).unique(),
  tier: varchar("tier", { length: 20 }).default("free"),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tier: varchar("tier", { length: 20 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  midtransId: varchar("midtrans_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  stockCode: varchar("stock_code", { length: 10 }).notNull(),
  stockName: varchar("stock_name", { length: 100 }),
  alertPrice: decimal("alert_price", { precision: 14, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userStockIdx: uniqueIndex("wl_user_stock_idx").on(table.userId, table.stockCode),
  userIdx: index("wl_user_idx").on(table.userId),
}));

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 100 }),
  side: varchar("side", { length: 10 }).default("long"),
  quantity: integer("quantity").notNull(),
  entryPrice: decimal("entry_price", { precision: 14, scale: 2 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 14, scale: 2 }),
  takeProfit: decimal("take_profit", { precision: 14, scale: 2 }),
  status: varchar("status", { length: 10 }).default("open"),
  exitPrice: decimal("exit_price", { precision: 14, scale: 2 }),
  pnl: decimal("pnl", { precision: 14, scale: 2 }),
  pnlPercent: decimal("pnl_percent", { precision: 10, scale: 2 }),
  notes: text("notes"),
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
}, (table) => ({
  userStatusIdx: index("pos_user_status_idx").on(table.userId, table.status),
  userCodeIdx: index("pos_user_code_idx").on(table.userId, table.code),
}));

export const dividends = pgTable("dividends", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 100 }),
  exDate: timestamp("ex_date").notNull(),
  recordDate: timestamp("record_date"),
  paymentDate: timestamp("payment_date"),
  amountPerShare: decimal("amount_per_share", { precision: 14, scale: 2 }),
  ratio: varchar("ratio", { length: 20 }),
  type: varchar("type", { length: 20 }).default("cash"),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  codeDateIdx: uniqueIndex("div_code_date_idx").on(table.code, table.exDate),
}));

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  direction: varchar("direction", { length: 10 }),
  chartThumb: text("chart_thumb"),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  codeIdx: index("ideas_code_idx").on(table.code),
  createdAtIdx: index("ideas_created_idx").on(table.createdAt),
}));

export const ideaLikes = pgTable("idea_likes", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ideaUserIdx: uniqueIndex("idea_user_idx").on(table.ideaId, table.userId),
}));
