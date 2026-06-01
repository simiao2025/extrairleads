CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"file_name" text NOT NULL,
	"file_type" text,
	"status" text DEFAULT 'processing',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD COLUMN "document_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" text DEFAULT 'Starter';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "leads_balance" integer DEFAULT 500;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_user_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_base_document_idx" ON "knowledge_base" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "leads_campaign_idx" ON "leads" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "leads_niche_idx" ON "leads" USING btree ("niche");--> statement-breakpoint
CREATE INDEX "scraping_jobs_user_idx" ON "scraping_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scraping_jobs_campaign_idx" ON "scraping_jobs" USING btree ("campaign_id");