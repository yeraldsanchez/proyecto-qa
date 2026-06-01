import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

test.describe('Inicio de sesión', () => {

    test('Inicio de sesión exitoso con credenciales válidas', async ({ page }) => {
        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(ADMIN_EMAIL);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();

        await expect(page).toHaveURL('/');
    });

    test('Login con contraseña incorrecta', async ({ page }) => {
        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(ADMIN_EMAIL);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill('wrongpass');
        await page.getByRole('button', { name: 'Acceder' }).click();

        await expect(page.locator('#root')).toContainText('Contraseña o correo incorrecto.');
    });

});
