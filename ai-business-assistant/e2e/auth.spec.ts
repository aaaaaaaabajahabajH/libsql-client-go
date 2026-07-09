import { test, expect } from "@playwright/test";

test.describe("Protected route redirect", () => {
  test("redirects unauthenticated user from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated user from /settings to /login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated user from /admin to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders sign in form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel(/email address/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Toast or inline error should appear
    await expect(
      page.getByText(/sign in failed|invalid|incorrect/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("has link to register page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("has link to forgot password page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });
});

test.describe("Register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders registration form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create|get started|sign up/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account|sign up|register/i })).toBeVisible();
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.getByRole("button", { name: /create account|sign up|register/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.getByLabel(/email/i).fill("not-an-email");
    // Trigger blur to surface validation
    await page.keyboard.press("Tab");
    await page.getByRole("button", { name: /create account|sign up|register/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("has link back to login page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in|log in|login/i })).toBeVisible();
  });
});

test.describe("Forgot password page", () => {
  test("renders forgot password form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /reset|send/i })).toBeVisible();
  });
});
