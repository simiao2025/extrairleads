CREATE TYPE "public"."kanban_stage" AS ENUM('raw', 'qualified', 'in_queue', 'contacted', 'interested', 'discarded');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"scheduled_at" timestamp,
	"status" text DEFAULT 'confirmed',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"search_keyword" text,
	"target_city" text,
	"target_state" text,
	"agent_1_prompt" text,
	"agent_2_prompt" text,
	"weekly_limit" integer DEFAULT 50,
	"auto_outreach" text DEFAULT 'false',
	"message_template" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"role" text,
	"content" text,
	"type" text DEFAULT 'text',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"website" text,
	"niche" text,
	"city" text,
	"state" text,
	"ai_score" integer,
	"ai_analysis" text,
	"status" "kanban_stage" DEFAULT 'raw',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outreach_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"status" text,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_logs" ADD CONSTRAINT "outreach_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;