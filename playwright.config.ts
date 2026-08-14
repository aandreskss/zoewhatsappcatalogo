import { defineConfig, devices } from "@playwright/test";

/**
 * E2E del flujo crítico (sección 33 del plan). Requiere `npm run dev`
 * contra un proyecto Supabase real con seed aplicado (`npm run db:seed`)
 * — no se puede ejecutar en un sandbox sin credenciales, ver
 * `tests/README.md`. `webServer` arranca el server automáticamente al
 * correr `npm run test:e2e` en un entorno que sí tenga `.env.local`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-android", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
