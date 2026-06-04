import { test, expect, Page } from '@playwright/test';

async function openAccountRecovery(page: Page) {
    await page.goto('/users/account-recovery');
    await page.waitForLoadState('networkidle');
}

async function submitRecoveryEmail(page: Page, email: string) {
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByRole('button', {
        name: 'Enviadme un correo electrónico de recuperación',
    }).click();
    await page.waitForLoadState('networkidle');
}

test.describe('Recuperación de contraseña', () => {
    test.beforeEach(async ({ page }) => {
        await openAccountRecovery(page);
    });

    test('Solicitar recuperación con correo registrado', async ({ page }) => {
        await submitRecoveryEmail(page, 'admin@sistema.com');

        await expect(page.getByText(/deberías de recibir un email/i)).toBeVisible();
    });

    test('Solicitar recuperación con correo no registrado', async ({ page }) => {
        await submitRecoveryEmail(page, 'noexiste@test.com');

        await expect(page.getByText(/deberías de recibir un email/i)).toBeVisible();
    });

    test('Validar correo con formato inválido', async ({ page }) => {
        const emailInput = page.getByLabel('Correo electrónico');

        await emailInput.fill('testgmail.com');
        await page.getByRole('button', {
            name: 'Enviadme un correo electrónico de recuperación',
        }).click();

        await expect(emailInput).toHaveValue('testgmail.com');
    });
});