import { chromium } from '@playwright/test';

async function globalSetup() {
  const baseURL    = process.env.BASE_URL        ?? 'http://localhost:9080';
  const siteName   = process.env.SITE_NAME       ?? 'Prueba';
  const adminName  = process.env.ADMIN_NAME      ?? 'admin';
  const adminEmail = process.env.ADMIN_EMAIL     ?? 'admin@sistema.com';
  const adminPass  = process.env.ADMIN_PASSWORD  ?? '12345678';

  // Chequeo rápido via HTTP — sin abrir browser
  let needsInstall: boolean;
  try {
    const res = await fetch(`${baseURL}/install`);
    // Si la URL final ya no es /install, la app está instalada y redirigió
    needsInstall = res.url.includes('/install');
  } catch {
    throw new Error(`[global-setup] No se pudo conectar a la app en ${baseURL}. ¿Está corriendo el servidor?`);
  }

  if (!needsInstall) {
    console.log('[global-setup] App ya instalada, se omite el setup.');
    return;
  }

  // Solo llega aquí si la app necesita ser instalada
  const browser = await chromium.launch({
    headless: process.env.SETUP_HEADLESS === 'true',
    slowMo:   process.env.SETUP_SLOW_MO ? Number(process.env.SETUP_SLOW_MO) : 0,
  });

  const context = await browser.newContext({ baseURL });
  const page    = await context.newPage();
  await page.goto('/install');

  if (process.env.SETUP_DEBUG === '1' || process.env.PWDEBUG === '1') {
    await page.pause();
  }

  // Paso 1 — Idioma
  await page.getByLabel('Please choose a language').selectOption('es_ES');
  await page.getByRole('button', { name: 'Próximo' }).click();

  // Paso 2 — Base de datos
  await page.getByLabel('Motor de base de datos').selectOption('sqlite3');
  await page.getByRole('button', { name: 'Próximo' }).click();

  // Paso 3 — Confirmación de DB
  await page.getByRole('button', { name: 'Próximo' }).click();

  // Paso 4 — Datos del sitio y admin
  await page.getByRole('textbox', { name: 'Nombre del sitio' }).fill(siteName);
  await page.getByRole('textbox', { name: 'Correo electrónico de contacto' }).fill(adminEmail);
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(adminName);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(adminPass);
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill(adminPass);
  await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(adminEmail);
  await page.getByRole('button', { name: 'Próximo' }).click();

  await page.getByRole('button', { name: 'Hecho' }).click();
  await page.waitForURL(url => !url.href.includes('/install'), { timeout: 15_000 });

  console.log('[global-setup] Instalación completada.');
  await browser.close();
}

export default globalSetup;
