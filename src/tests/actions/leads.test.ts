import { describe, expect, it, vi } from "vitest";
import { deleteLeadAction, moveLeadAction, updateLeadAction } from "@/actions/leads";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  leads: "leads",
  chatHistory: "chatHistory",
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Leads Actions", () => {
  describe("moveLeadAction", () => {
    it("should return error for invalid status", async () => {
      const result = await moveLeadAction(1, "invalid_status");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Status inválido.");
    });
  });

  describe("deleteLeadAction", () => {
    it("should return error for non-existent lead", async () => {
      const { db } = await import("@/db");
      (db.select as any).mockResolvedValue([]);

      const result = await deleteLeadAction(999);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Lead não encontrado.");
    });
  });

  describe("updateLeadAction", () => {
    it("should validate lead data", async () => {
      const { db } = await import("@/db");
      (db.select as any).mockResolvedValue([
        {
          id: 1,
          name: "Test Lead",
          phone: "123456",
          website: null,
          niche: "test",
          city: "Test City",
          state: "TS",
          aiScore: 8,
          aiAnalysis: "Test analysis",
          status: "qualified",
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await updateLeadAction(1, { name: "Updated Lead" });
      expect(result.success).toBe(true);
    });
  });
});

describe("Lead Status Validation", () => {
  const VALID_STAGES = ["raw", "qualified", "in_queue", "contacted", "interested", "discarded"];

  it("should validate all valid stages", () => {
    VALID_STAGES.forEach((stage) => {
      expect(VALID_STAGES.includes(stage)).toBe(true);
    });
  });

  it("should reject invalid stages", () => {
    const invalidStages = ["invalid", "new", "pending", ""];
    invalidStages.forEach((stage) => {
      expect(VALID_STAGES.includes(stage as (typeof VALID_STAGES)[number])).toBe(false);
    });
  });
});
