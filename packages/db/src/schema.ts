import { pgTable, serial, integer, varchar, decimal, timestamp, uniqueIndex, index, boolean, text } from "drizzle-orm/pg-core";

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  sector: varchar("sector", { length: 50 }),
  marketCap: varchar("market_cap", { length: 20 }),
  listingDate: timestamp("listing_date"),
  status: varchar("status", { length: 10 }).default("active"),
  totalShares: decimal("total_shares", { precision: 20, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  codeIdx: uniqueIndex("stocks_code_idx").on(table.code),
  sectorIdx: index("stocks_sector_idx").on(table.sector),
}));

export const stockPrices = pgTable("stock_prices", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  open: decimal("open", { precision: 14, scale: 2 }),
  high: decimal("high", { precision: 14, scale: 2 }),
  low: decimal("low", { precision: 14, scale: 2 }),
  close: decimal("close", { precision: 14, scale: 2 }),
  volume: decimal("volume", { precision: 20, scale: 0 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  stockDateIdx: uniqueIndex("sp_stock_date_idx").on(table.stockId, table.date),
  dateIdx: index("sp_date_idx").on(table.date),
}));

export const indicators = pgTable("indicators", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  rsi: decimal("rsi", { precision: 8, scale: 2 }),
  macd: decimal("macd", { precision: 12, scale: 4 }),
  macdSignal: decimal("macd_signal", { precision: 12, scale: 4 }),
  macdHist: decimal("macd_hist", { precision: 12, scale: 4 }),
  sma20: decimal("sma_20", { precision: 14, scale: 2 }),
  sma50: decimal("sma_50", { precision: 14, scale: 2 }),
  sma200: decimal("sma_200", { precision: 14, scale: 2 }),
  bbUpper: decimal("bb_upper", { precision: 14, scale: 2 }),
  bbLower: decimal("bb_lower", { precision: 14, scale: 2 }),
  bbMiddle: decimal("bb_middle", { precision: 14, scale: 2 }),
  atr: decimal("atr", { precision: 14, scale: 2 }),
  obv: decimal("obv", { precision: 20, scale: 0 }),
  mfi: decimal("mfi", { precision: 8, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  stockDateIdx: uniqueIndex("ind_stock_date_idx").on(table.stockId, table.date),
}));

export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  signalType: varchar("signal_type", { length: 30 }).notNull(),
  strength: integer("strength").default(0),
  direction: varchar("direction", { length: 10 }),
  score: decimal("score", { precision: 5, scale: 2 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  stockDateIdx: index("sig_stock_date_idx").on(table.stockId, table.date),
  dateTypeIdx: index("sig_date_type_idx").on(table.date, table.signalType),
}));

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

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: varchar("tier", { length: 20 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  midtransId: varchar("midtrans_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const backtestResults = pgTable("backtest_results", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  strategy: varchar("strategy", { length: 50 }).notNull(),
  winRate: decimal("win_rate", { precision: 6, scale: 2 }),
  sharpeRatio: decimal("sharpe_ratio", { precision: 6, scale: 2 }),
  maxDrawdown: decimal("max_drawdown", { precision: 6, scale: 2 }),
  profitFactor: decimal("profit_factor", { precision: 8, scale: 2 }),
  totalReturn: decimal("total_return", { precision: 10, scale: 2 }),
  totalTrades: integer("total_trades"),
  period: varchar("period", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  stockStrategyIdx: index("bt_stock_strategy_idx").on(table.stockId, table.strategy),
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
