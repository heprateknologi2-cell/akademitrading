CREATE TABLE "idea_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"direction" varchar(10),
	"chart_thumb" text,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idea_user_idx" ON "idea_likes" USING btree ("idea_id","user_id");--> statement-breakpoint
CREATE INDEX "ideas_code_idx" ON "ideas" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ideas_created_idx" ON "ideas" USING btree ("created_at");