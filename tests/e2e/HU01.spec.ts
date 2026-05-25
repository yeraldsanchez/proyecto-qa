import {test, expect} from '@playwright/test';

test.describe('Registro de nuevo usuario', () => {

    test('Registro exitoso con todos los datos válidos', async ({page}) => {
        await page.goto('/users/register');
        await page.getByRole('textbox', {name: 'Nombre'}).click();
        await page.getByRole('textbox', {name: 'Nombre'}).fill('usuario123');
        await page.getByRole('textbox', {name: 'Correo electrónico'}).click();
        await page.getByRole('textbox', {name: 'Correo electrónico'}).fill('test@gmail.com');
        await page.getByRole('textbox', {name: 'Contraseña'}).click();
        await page.getByRole('textbox', {name: 'Contraseña'}).click();
        await page.getByRole('textbox', {name: 'Contraseña'}).fill('Segura123');
        await page.getByRole('button', {name: 'Registrarse'}).click();

        await expect(page.locator('#root')).toContainText('¡Casi estás listo! Te hemos enviado un correo de activación a test@gmail.com. Por favor, sigue las instrucciones en el correo para activar tu cuenta.');
    });


    test('Registro con correo sin formato válido (sin @)', async ({page}) => {
        await page.goto('/users/register');
        await page.getByRole('textbox', {name: 'Nombre'}).click();
        await page.getByRole('textbox', {name: 'Nombre'}).fill('usuario123');
        await page.getByRole('textbox', {name: 'Correo electrónico'}).click();
        await page.getByRole('textbox', {name: 'Correo electrónico'}).fill('testgmail.com');
        await page.getByRole('textbox', {name: 'Contraseña'}).click();
        await page.getByRole('textbox', {name: 'Contraseña'}).click();
        await page.getByRole('textbox', {name: 'Contraseña'}).fill('Segura123');
        await page.getByRole('button', {name: 'Registrarse'}).click();

        await expect(page.locator('#root')).toContainText('Correo electrónico debe ser una dirección de correo electrónico válida.');
    });

});
