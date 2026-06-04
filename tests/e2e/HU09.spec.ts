import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

async function loginIfNeeded(page: Page) {
    await page.goto('/users/login');

    const emailInput = page.getByRole('textbox', { name: 'Correo electrónico' });

    if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(ADMIN_EMAIL);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
        await page.waitForLoadState('networkidle');
    }
}

async function openKnownQuestion(page: Page) {
    await page.goto('/questions/10010000000000002');
    await page.waitForLoadState('networkidle');
}

function saveButton(page: Page) {
    return page.locator('button, a').filter({
        hasText: /guardar|save|bookmark|follow|seguir/i,
    }).first();
}

function savedButton(page: Page) {
    return page.locator('button, a').filter({
        hasText: /guardado|saved|bookmarked|following|siguiendo/i,
    }).first();
}

test.describe('Guardado de publicaciones', () => {
    test.beforeEach(async ({ page }) => {
        await loginIfNeeded(page);
    });

    test('Guardar publicación existente con usuario autenticado', async ({ page }) => {
        await openKnownQuestion(page);

        if (await savedButton(page).isVisible().catch(() => false)) {
            await savedButton(page).click();
            await page.waitForTimeout(1000);
        }

        await saveButton(page).click();

        await expect(savedButton(page)).toBeVisible();
    });

    test('Remover publicación previamente guardada', async ({ page }) => {
        await openKnownQuestion(page);

        if (await saveButton(page).isVisible().catch(() => false)) {
            await saveButton(page).click();
            await page.waitForTimeout(1000);
        }

        await savedButton(page).click();

        await expect(saveButton(page)).toBeVisible();
    });
});