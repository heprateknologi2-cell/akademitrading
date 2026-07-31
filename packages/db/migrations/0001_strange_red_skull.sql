CREATE TABLE "dividends" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100),
	"ex_date" timestamp NOT NULL,
	"record_date" timestamp,
	"payment_date" timestamp,
	"amount_per_share" numeric(14, 2),
	"ratio" varchar(20),
	"type" varchar(20) DEFAULT 'cash',
	"source" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "div_code_date_idx" ON "dividends" USING btree ("code","ex_date");