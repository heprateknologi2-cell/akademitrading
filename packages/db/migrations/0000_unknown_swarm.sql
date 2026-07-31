CREATE TABLE "backtest_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"strategy" varchar(50) NOT NULL,
	"win_rate" numeric(6, 2),
	"sharpe_ratio" numeric(6, 2),
	"max_drawdown" numeric(6, 2),
	"profit_factor" numeric(8, 2),
	"total_return" numeric(10, 2),
	"total_trades" integer,
	"period" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"rsi" numeric(8, 2),
	"macd" numeric(12, 4),
	"macd_signal" numeric(12, 4),
	"macd_hist" numeric(12, 4),
	"sma_20" numeric(14, 2),
	"sma_50" numeric(14, 2),
	"sma_200" numeric(14, 2),
	"bb_upper" numeric(14, 2),
	"bb_lower" numeric(14, 2),
	"bb_middle" numeric(14, 2),
	"atr" numeric(14, 2),
	"obv" numeric(20, 0),
	"mfi" numeric(8, 2),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100),
	"side" varchar(10) DEFAULT 'long',
	"quantity" integer NOT NULL,
	"entry_price" numeric(14, 2) NOT NULL,
	"stop_loss" numeric(14, 2),
	"take_profit" numeric(14, 2),
	"status" varchar(10) DEFAULT 'open',
	"exit_price" numeric(14, 2),
	"pnl" numeric(14, 2),
	"pnl_percent" numeric(10, 2),
	"notes" text,
	"opened_at" timestamp DEFAULT now(),
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"signal_type" varchar(30) NOT NULL,
	"strength" integer DEFAULT 0,
	"direction" varchar(10),
	"score" numeric(5, 2),
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"open" numeric(14, 2),
	"high" numeric(14, 2),
	"low" numeric(14, 2),
	"close" numeric(14, 2),
	"volume" numeric(20, 0),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(4) NOT NULL,
	"name" varchar(100) NOT NULL,
	"sector" varchar(50),
	"market_cap" varchar(20),
	"listing_date" timestamp,
	"status" varchar(10) DEFAULT 'active',
	"total_shares" numeric(20, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "stocks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tier" varchar(20) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"midtrans_id" varchar(100),
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"name" varchar(100),
	"telegram_id" varchar(50),
	"tier" varchar(20) DEFAULT 'free',
	"password" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"stock_code" varchar(10) NOT NULL,
	"stock_name" varchar(100),
	"alert_price" numeric(14, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "backtest_results" ADD CONSTRAINT "backtest_results_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_prices" ADD CONSTRAINT "stock_prices_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bt_stock_strategy_idx" ON "backtest_results" USING btree ("stock_id","strategy");--> statement-breakpoint
CREATE UNIQUE INDEX "ind_stock_date_idx" ON "indicators" USING btree ("stock_id","date");--> statement-breakpoint
CREATE INDEX "pos_user_status_idx" ON "positions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "pos_user_code_idx" ON "positions" USING btree ("user_id","code");--> statement-breakpoint
CREATE INDEX "sig_stock_date_idx" ON "signals" USING btree ("stock_id","date");--> statement-breakpoint
CREATE INDEX "sig_date_type_idx" ON "signals" USING btree ("date","signal_type");--> statement-breakpoint
CREATE UNIQUE INDEX "sp_stock_date_idx" ON "stock_prices" USING btree ("stock_id","date");--> statement-breakpoint
CREATE INDEX "sp_date_idx" ON "stock_prices" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "stocks_code_idx" ON "stocks" USING btree ("code");--> statement-breakpoint
CREATE INDEX "stocks_sector_idx" ON "stocks" USING btree ("sector");--> statement-breakpoint
CREATE UNIQUE INDEX "wl_user_stock_idx" ON "watchlists" USING btree ("user_id","stock_code");--> statement-breakpoint
CREATE INDEX "wl_user_idx" ON "watchlists" USING btree ("user_id");