ALTER TYPE "public"."kanban_stage" ADD VALUE 'human_intervention' BEFORE 'discarded';--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"niche" text,
	"city" text,
	"state" text,
	"auto_outreach" text DEFAULT 'false',
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaign_configs" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "campaign_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cpf_cnpj" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "uf" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cep" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_status" text DEFAULT 'COMPLETED';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_temporary_password" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_instance_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_instance_token" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_user_idx" ON "campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_user_idx" ON "knowledge_base" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "campaign_configs" ADD CONSTRAINT "campaign_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_lead_idx" ON "appointments" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "campaign_configs_user_idx" ON "campaign_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_history_lead_idx" ON "chat_history" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "outreach_logs_lead_idx" ON "outreach_logs" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");