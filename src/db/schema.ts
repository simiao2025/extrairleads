import {
	customType,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const kanbanStageEnum = pgEnum("kanban_stage", [
	"raw",
	"qualified",
	"in_queue",
	"contacted",
	"interested",
	"human_intervention",
	"discarded",
]);

export const scrapingJobStatusEnum = pgEnum("scraping_job_status", [
	"scraping",
	"qualifying",
	"completed",
	"failed",
]);

export const scrapingJobs = pgTable(
	"scraping_jobs",
	{
		id: serial("id").primaryKey(),
		campaignId: integer("campaign_id").references(() => campaigns.id, {
			onDelete: "cascade",
		}),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		status: scrapingJobStatusEnum("status").default("scraping"),
		totalExpected: integer("total_expected").default(20),
		currentProgress: integer("current_progress").default(0),
		jobType: text("job_type").default("full"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		index("scraping_jobs_user_idx").on(table.userId),
		index("scraping_jobs_campaign_idx").on(table.campaignId),
	],
);

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: text("email").notNull().unique(),
	name: text("name"),
	password: text("password"),
	emailVerified: timestamp("email_verified"),
	image: text("image"),
	cpfCnpj: text("cpf_cnpj"),
	phone: text("phone"),
	address: text("address"),
	city: text("city"),
	uf: text("uf"),
	cep: text("cep"),
	onboardingStatus: text("onboarding_status").default("COMPLETED"), // 'PENDING_INFO' | 'PENDING_PASSWORD' | 'COMPLETED'
	isTemporaryPassword: integer("is_temporary_password").default(0), // 0 = false, 1 = true
	whatsappInstanceName: text("whatsapp_instance_name"),
	whatsappInstanceToken: text("whatsapp_instance_token"),
	whatsappProvider: text("whatsapp_provider").default("evolution"), // 'evolution' | 'meta_official'
	metaAccessToken: text("meta_access_token"),
	metaPhoneNumberId: text("meta_phone_number_id"),
	metaWabaId: text("meta_waba_id"),
	notificationsEnabled: integer("notifications_enabled").default(1), // 1 = enabled, 0 = disabled
	plan: text("plan").default("Starter"),
	leadsBalance: integer("leads_balance").default(500),
	createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable(
	"accounts",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(table) => [index("accounts_user_idx").on(table.userId)],
);

export const sessions = pgTable(
	"sessions",
	{
		id: serial("id").primaryKey(),
		sessionToken: text("session_token").notNull().unique(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		expires: timestamp("expires").notNull(),
	},
	(table) => [index("sessions_user_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
	"verification_tokens",
	{
		id: serial("id").primaryKey(),
		identifier: text("identifier").notNull(),
		token: text("token").notNull().unique(),
		expires: timestamp("expires").notNull(),
	},
	(table) => [
		index("verification_tokens_token_idx").on(table.token),
		index("verification_tokens_identifier_idx").on(table.identifier),
	],
);

export const campaigns = pgTable(
	"campaigns",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		name: text("name").notNull(),
		niche: text("niche"),
		city: text("city"),
		state: text("state"),
		autoOutreach: text("auto_outreach").default("false"), // "true" ou "false"
		metaTemplateName: text("meta_template_name"),
		status: text("status").default("active"), // "active", "paused", "completed"
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("campaigns_user_idx").on(table.userId)],
);

export const leads = pgTable(
	"leads",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		campaignId: integer("campaign_id").references(() => campaigns.id, {
			onDelete: "set null",
		}),
		name: text("name").notNull(),
		phone: text("phone"),
		website: text("website"),
		niche: text("niche"),
		city: text("city"),
		state: text("state"),
		imageUrl: text("image_url"),
		aiScore: integer("ai_score"),
		aiAnalysis: text("ai_analysis"),
		status: kanbanStageEnum("status").default("raw"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [
		index("leads_status_idx").on(table.status),
		index("leads_created_idx").on(table.createdAt),
		index("leads_user_idx").on(table.userId),
		index("leads_campaign_idx").on(table.campaignId),
		index("leads_niche_idx").on(table.niche),
	],
);

export const campaignConfigs = pgTable(
	"campaign_configs",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		name: text("name").notNull(),
		searchKeyword: text("search_keyword"),
		targetCity: text("target_city"),
		targetState: text("target_state"),
		agent1Prompt: text("agent_1_prompt"),
		agent2Prompt: text("agent_2_prompt"),
		weeklyLimit: integer("weekly_limit").default(50),
		autoOutreach: text("auto_outreach").default("false"), // "true" ou "false"
		messageTemplate: text("message_template"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("campaign_configs_user_idx").on(table.userId)],
);

export const chatHistory = pgTable(
	"chat_history",
	{
		id: serial("id").primaryKey(),
		leadId: integer("lead_id").references(() => leads.id),
		role: text("role"), // 'user' ou 'assistant'
		content: text("content"),
		type: text("type").default("text"), // 'text' ou 'audio'
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("chat_history_lead_idx").on(table.leadId)],
);

export const appointments = pgTable(
	"appointments",
	{
		id: serial("id").primaryKey(),
		leadId: integer("lead_id").references(() => leads.id),
		scheduledAt: timestamp("scheduled_at"),
		status: text("status").default("confirmed"), // 'confirmed', 'canceled', 'rescheduled'
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("appointments_lead_idx").on(table.leadId)],
);

export const outreachLogs = pgTable(
	"outreach_logs",
	{
		id: serial("id").primaryKey(),
		leadId: integer("lead_id").references(() => leads.id),
		status: text("status"), // e.g., 'sent', 'failed'
		sentAt: timestamp("sent_at").defaultNow(),
	},
	(table) => [index("outreach_logs_lead_idx").on(table.leadId)],
);

const vector1536 = customType<{ data: number[]; driverData: string }>({
	dataType() {
		return "vector(1536)";
	},
	toDriver(value: number[]): string {
		return JSON.stringify(value);
	},
	fromDriver(value: unknown): number[] {
		if (typeof value === "string") {
			try {
				return JSON.parse(value);
			} catch {
				return [];
			}
		}
		return value as number[];
	},
});

export const documents = pgTable(
	"documents",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		fileName: text("file_name").notNull(),
		fileType: text("file_type"),
		status: text("status").default("processing"), // 'processing', 'completed', 'error'
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("documents_user_idx").on(table.userId)],
);

export const knowledgeBase = pgTable(
	"knowledge_base",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		documentId: integer("document_id").references(() => documents.id, {
			onDelete: "cascade",
		}),
		title: text("title").notNull(),
		content: text("content").notNull(),
		embedding: vector1536("embedding"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [
		index("knowledge_base_user_idx").on(table.userId),
		index("knowledge_base_document_idx").on(table.documentId),
	],
);

export const ttsAudioCache = pgTable(
	"tts_audio_cache",
	{
		id: serial("id").primaryKey(),
		textHash: text("text_hash").notNull().unique(),
		text: text("text").notNull(),
		base64Audio: text("base64_audio").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("tts_audio_cache_hash_idx").on(table.textHash)],
);

export const semanticCache = pgTable(
	"semantic_cache",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		query: text("query").notNull(),
		response: text("response").notNull(),
		embedding: vector1536("embedding"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [index("semantic_cache_user_idx").on(table.userId)],
);
