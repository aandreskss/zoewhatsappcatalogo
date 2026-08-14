import { test, expect } from "@playwright/test";

/**
 * Flujo crítico completo (sección 33 del plan): Home → Producto →
 * selección de talla → Carrito → Checkout → WhatsApp. Depende del seed
 * demo (`supabase/seed/seed.sql`) para tener al menos un producto
 * publicado con variantes y stock — si el seed cambia de nombres, ajustar
 * los selectores de texto de aquí.
 */
test.describe("flujo de compra", () => {
  test("agrega un producto al carrito y llega al checkout", async ({ page }) => {
    await page.goto("/catalogo");

    // Primera tarjeta de producto del catálogo.
    const firstProduct = page.locator('a[href^="/producto/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    await expect(page).toHaveURL(/\/producto\//);

    // Selecciona la primera opción disponible de cada grupo (color/talla)
    // — el layout exacto de botones vive en `ProductVariantPicker`.
    const optionButtons = page
      .getByRole("button")
      .filter({ hasNotText: /Agregar al carrito/ });
    const count = await optionButtons.count();
    for (let i = 0; i < count; i++) {
      const button = optionButtons.nth(i);
      if (await button.isEnabled()) {
        await button.click();
      }
    }

    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(page.getByText("Agregado al carrito.")).toBeVisible();

    await page.goto("/carrito");
    await expect(page.getByRole("link", { name: "Finalizar pedido" })).toBeVisible();
    await page.getByRole("link", { name: "Finalizar pedido" }).click();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByLabel("Nombre")).toBeVisible();
  });

  test("el carrito vacío muestra un estado vacío con enlace al catálogo", async ({
    page,
  }) => {
    // Contexto sin cookies previas — carrito vacío por defecto.
    await page.goto("/carrito");
    await expect(page.getByText("Tu carrito está vacío")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver catálogo" })).toBeVisible();
  });
});

test.describe("búsqueda y filtros", () => {
  test("buscar un término sin resultados no rompe la página", async ({ page }) => {
    await page.goto("/buscar?q=xyznonexistente123");
    await expect(
      page.getByText(/productos encontrados|producto encontrado/),
    ).toBeVisible();
  });

  test("filtrar por precio en /catalogo persiste en la URL", async ({ page }) => {
    await page.goto("/catalogo");
    await page.getByLabel(/precio mín/i).fill("10");
    await page.getByRole("button", { name: /aplicar|filtrar/i }).click();
    await expect(page).toHaveURL(/precio_min=10/);
  });
});
