import { test, expect } from "@playwright/test";

test.describe("ExtrairLeads E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the main dashboard", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Extrair");
  });

  test("should navigate to leads page", async ({ page }) => {
    await page.click('text=Leads');
    await expect(page).toHaveURL("/leads");
    await expect(page.locator("h1")).toContainText("Gerenciar Leads");
  });

  test("should show search form on dashboard", async ({ page }) => {
    await expect(page.locator('text=Capturar Novos Leads')).toBeVisible();
    await expect(page.locator('input[placeholder="Pizzaria"]')).toBeVisible();
  });

  test("should display kanban columns", async ({ page }) => {
    await expect(page.locator("text=Pipeline Inteligente")).toBeVisible();
  });

  test("should display stats cards", async ({ page }) => {
    await expect(page.locator("text=Leads Totais")).toBeVisible();
    await expect(page.locator("text=Qualificados IA")).toBeVisible();
    await expect(page.locator("text=Msgs Enviadas")).toBeVisible();
    await expect(page.locator("text=Interessados")).toBeVisible();
  });

  test("should show analytics section", async ({ page }) => {
    await expect(page.locator("text=Métricas & Analytics")).toBeVisible();
  });
});

test.describe("Navigation Tests", () => {
  test("should navigate through all main routes", async ({ page }) => {
    const routes = [
      { path: "/leads", title: "Gerenciar Leads" },
      { path: "/campaigns", title: "Campanhas Ativas" },
      { path: "/appointments", title: "Agendamentos" },
      { path: "/agents", title: "Configurações da IA" },
      { path: "/settings", title: "Configurações do Sistema" },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.locator(`text=${route.title}`).first()).toBeVisible();
    }
  });
});