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

async function openProfileSettings(page: Page) {
    await page.goto('/users/settings/profile');
    await page.waitForLoadState('networkidle');
    await closeModalIfVisible(page);
}

test.describe('Edición del perfil de usuario', () => {
    test.beforeEach(async ({ page }) => {
        await loginIfNeeded(page);
        await openProfileSettings(page);
    });

    test('Editar perfil con datos válidos', async ({ page }) => {
        const publicNameInput = page.getByLabel('Nombre público');

        await publicNameInput.fill('Admin QA');
        await page.getByLabel('Sobre mí (opcional)').fill('Estudiante de ingeniería realizando pruebas automatizadas.');
        await page.getByLabel('Sitio Web (opcional)').fill('https://example.com');
        await page.getByLabel('Ubicación (opcional)').fill('Costa Rica');
        await page.getByRole('button', { name: 'Guardar' }).click();

        await expect(publicNameInput).toHaveValue('Admin QA');
    });

    test('Validar nombre público vacío', async ({ page }) => {
        const publicNameInput = page.getByLabel('Nombre público');

        await publicNameInput.fill('');
        await page.getByRole('button', { name: 'Guardar' }).click();

        await expect(publicNameInput).toHaveValue('');
    });

    test('Validar sitio web con formato inválido', async ({ page }) => {
        const websiteInput = page.getByLabel('Sitio Web (opcional)');

        await websiteInput.fill('miweb.com');
        await page.getByRole('button', { name: 'Guardar' }).click();

        await expect(websiteInput).toHaveValue('miweb.com');
    });
});