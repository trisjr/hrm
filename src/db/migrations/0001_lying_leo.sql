ALTER TABLE "email_logs" ADD COLUMN "template_id" integer;--> statement-breakpoint
ALTER TABLE "email_logs" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "email_templates" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "work_requests" ADD COLUMN "is_half_day" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;