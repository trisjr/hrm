CREATE TABLE "public_holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(2) DEFAULT 'VN',
	"is_recurring" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "public_holidays_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "user_assessments" ALTER COLUMN "self_score_avg" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "user_assessments" ALTER COLUMN "leader_score_avg" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "user_assessments" ALTER COLUMN "final_score_avg" SET DATA TYPE real;