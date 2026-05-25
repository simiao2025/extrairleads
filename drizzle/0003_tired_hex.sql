CREATE TYPE "public"."scraping_job_status" AS ENUM('scraping', 'qualifying', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "scraping_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"user_id" integer,
	"status" "scraping_job_status" DEFAULT 'scraping',
	"total_expected" integer DEFAULT 20,
	"current_progress" integer DEFAULT 0,
	"job_type" text DEFAULT 'full',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "meta_template_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_provider" text DEFAULT 'evolution';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "meta_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "meta_phone_number_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "meta_waba_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifications_enabled" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_token_unique" UNIQUE("token");