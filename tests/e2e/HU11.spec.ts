import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

async function closeModalIfVisible(page: Page) {
    const closeButton = page.getByRole('button', { name: /cerrar|close/i });

    if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(500);
    }
}

async function loginIfNeeded(page: Page) {
    await page.goto('/users/login');

    const emailInput = page.getByRole('textbox', { name: 'Correo electrónico' });

    if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(ADMIN_EMAIL);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
        await page.waitForLoadState('networkidle');
    }

    await closeModalIfVisible(page);
}

async function openKnownQuestion(page: Page) {
    await page.goto('/questions/10010000000000002');
    await page.waitForLoadState('networkidle');
    await closeModalIfVisible(page);
}

async function openReportModal(page: Page) {
    await page.locator('a, button').filter({ hasText: /^Reportar$/i }).first().click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
}

test.describe('Reporte de contenido inapropiado', () => {
    test('Abrir formulario de reporte para una pregunta existente', async ({ page }) => {
        await loginIfNeeded(page);
        await openKnownQuestion(page);

        await openReportModal(page);

        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('Reportar pregunta existente con motivo válido', async ({ page }) => {
        await loginIfNeeded(page);
        await openKnownQuestion(page);

        await openReportModal(page);
        await page.getByText('correo no deseado').click();
        await page.getByRole('button', { name: 'Enviar' }).click();

        await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('Intento de reportar contenido sin iniciar sesión', async ({ page }) => {
        await page.context().clearCookies();

        await page.goto('/questions/10010000000000002');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('a, button').filter({
            hasText: /^Reportar$/i,
        })).toHaveCount(0);
    });
});