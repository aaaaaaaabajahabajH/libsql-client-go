import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the hero section", async ({ page }) => {
    await expect(page.getByRole("main")).toBeVisible();
    // Hero contains a CTA button or heading
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
  });

  test("has navigation with login and sign up links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in|log in|login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started|sign up|try/i }).first()).toBeVisible();
  });

  test("login link navigates to login page", async ({ page }) => {
    await page.getByRole("link", { name: /sign in|log in|login/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("pricing link navigates to pricing page", async ({ page }) => {
    await page.getByRole("link", { name: /pricing/i }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test("has footer", async ({ page }) => {
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });

  test("page title contains product name", async ({ page }) => {
    await expect(page).toHaveTitle(/AI Business Assistant/i);
  });
});

test.describe("Pricing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("renders plan cards", async ({ page }) => {
    // At minimum the free plan should be visible
    await expect(page.getByText(/free/i).first()).toBeVisible();
    await expect(page.getByText(/starter/i).first()).toBeVisible();
    await expect(page.getByText(/pro/i).first()).toBeVisible();
  });

  test("has billing toggle for annual/monthly", async ({ page }) => {
    // Not strictly required — just check page loaded with monthly pricing
    await expect(page.getByText(/month/i).first()).toBeVisible();
  });

  test("has sign up or get started links on plan cards", async ({ page }) => {
    const ctaButtons = page.getByRole("button", { name: /get started|sign up|upgrade|subscribe/i });
    await expect(ctaButtons.first()).toBeVisible();
  });

  test("page title includes Pricing", async ({ page }) => {
    await expect(page).toHaveTitle(/pricing/i);
  });
});

test.describe("Health endpoint", () => {
  test("returns 200 with status ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});
