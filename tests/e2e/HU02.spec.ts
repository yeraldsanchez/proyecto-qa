import {test, expect} from '@playwright/test';

test.describe('Inicio de sesión', () => {

    test('Inicio de sesión exitoso con credenciales válidas', async ({page}) => {
        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('admin@sistema.com');
        await page.getByRole('textbox', { name: 'Contraseña' }).click();
        await page.getByRole('textbox', { name: 'Contraseña' }).fill('12345678');
        await page.getByRole('button', { name: 'Acceder' }).click();

        await expect(page).toHaveURL('/');
    });


    test('Login con contraseña incorrecta', async ({page}) => {
        await page.goto('/users/login');
        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).click();
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('admin@sistema.com');
        await page.getByRole('textbox', { name: 'Contraseña' }).click();
        await page.getByRole('textbox', { name: 'Contraseña' }).fill('wrongpass');
        await page.getByRole('button', { name: 'Acceder' }).click();

        await expect(page.locator('#root')).toContainText('Contraseña o correo incorrecto.');
    });
});
