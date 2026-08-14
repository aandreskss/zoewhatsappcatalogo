import { test, expect } from "@playwright/test";

/**
 * Flujos de admin (sección 33 del plan: "flujo admin de creación de
 * producto, flujo de ajuste de inventario"). Requiere un usuario admin
 * real ya creado en Supabase Auth con rol asignado en `user_roles` — las
 * credenciales se pasan por variables de entorno para no commitearlas
 * (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`). Si no están definidas, el
 * `test.skip` evita un fallo confuso en vez de intentar loguearse con
 * strings vacíos.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin", () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Requiere E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/correo|email/i).fill(ADMIN_EMAIL!);
    await page.getByLabel(/contraseña|password/i).fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /iniciar sesión|entrar/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("crea un producto en borrador", async ({ page }) => {
    await page.goto("/admin/productos");
    await page.getByRole("link", { name: /nuevo producto|crear producto/i }).click();
    await page.getByLabel("Nombre").fill(`Producto E2E ${Date.now()}`);
    await page.getByRole("button", { name: /crear/i }).click();
    await expect(page).toHaveURL(/\/admin\/productos\/[a-f0-9-]+/);
  });

  test("el panel de pedidos muestra la lista sin errores", async ({ page }) => {
    await page.goto("/admin/pedidos");
    await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
  });

  test("el dashboard ejecutivo carga KPIs sin errores", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Pedidos hoy")).toBeVisible();
    await expect(page.getByText("Embudo de conversión")).toBeVisible();
  });
});
