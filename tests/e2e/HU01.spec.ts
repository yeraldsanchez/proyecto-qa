import { test, expect } from '@playwright/test';

test.describe('Registro de nuevo usuario', () => {

    let registeredEmail: string;

    test.beforeAll(async ({ request }) => {
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        registeredEmail = `hu01_${uuid}@test.com`;
        // Registrar el correo via API para que exista antes del test de duplicado
        await request.post('/answer/api/v1/user/register/email', {
            data: { e_mail: registeredEmail, name: `hu01_${uuid}`, pass: 'Segura123' },
        });
    });

    test('Registro exitoso con todos los datos válidos', async ({ page }) => {
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const newEmail = `hu01_new_${uuid}@test.com`;

        await page.goto('/users/register');
        await page.getByRole('textbox', { name: 'Nombre' }).fill(`usuario_${uuid}`);
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(newEmail);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill('Segura123');
        await page.getByRole('button', { name: 'Registrarse' }).click();

        await expect(page.locator('#root')).toContainText(
            `¡Casi estás listo! Te hemos enviado un correo de activación a ${newEmail}.`
        );
    });

    test('Registro con correo sin formato válido (sin @)', async ({ page }) => {
        await page.goto('/users/register');
        await page.getByRole('textbox', { name: 'Nombre' }).fill('usuario123');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('testgmail.com');
        await page.getByRole('textbox', { name: 'Contraseña' }).fill('Segura123');
        await page.getByRole('button', { name: 'Registrarse' }).click();

        await expect(page.locator('#root')).toContainText('Correo electrónico debe ser una dirección de correo electrónico válida.');
    });

    test('Registro con correo ya registrado en el sistema', async ({ page }) => {
        await page.goto('/users/register');
        await page.getByRole('textbox', { name: 'Nombre' }).fill('usuario123');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(registeredEmail);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill('Segura123');
        await page.getByRole('button', { name: 'Registrarse' }).click();

        await expect(page.locator('#root')).toContainText('Correo electrónico ya en uso.');
    });

});
