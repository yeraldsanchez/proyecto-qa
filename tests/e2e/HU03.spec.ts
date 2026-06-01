import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

test.describe('Publicación de una nueva pregunta', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(ADMIN_EMAIL);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
    });

    test('Publicación exitosa de pregunta con título, contenido y tag válidos', async ({ page }) => {
        await page.goto('/questions/add');
        await page.getByRole('textbox', { name: 'Título' }).fill('¿Como instalar docker en ubuntu?');

        const editor = page.locator('.cm-content');
        await editor.click();
        await page.keyboard.type('Necesito ayuda con el proceso de instalación');

        await page.locator('div').filter({ hasText: /^Añadir etiqueta$/ }).nth(2).click();
        await page.getByRole('textbox', { name: 'Etiquetas' }).fill('Do');

        const dockerTag = page.getByRole('button', { name: 'Docker' });
        if (await dockerTag.isVisible()) {
            await dockerTag.click();
        } else {
            await page.getByRole('button', { name: '+ Crear nueva etiqueta' }).click();
            await page.getByRole('textbox', { name: 'Nombre público' }).fill('Docker');
            await page.getByRole('textbox', { name: 'Ruta de la URL' }).fill('Docker');
            await page.getByRole('button', { name: 'Enviar' }).click();
        }

        await page.getByRole('button', { name: 'Publica tu pregunta' }).click();
        await expect(page.getByRole('button', { name: 'Publica tu respuesta' })).toBeVisible();
    });

    test('Intento de publicar pregunta con título vacío', async ({ page }) => {
        await page.goto('/questions/add');

        const editor = page.locator('.cm-content');
        await editor.click();
        await page.keyboard.type('Necesito ayuda con el proceso de instalación');

        await page.locator('div').filter({ hasText: /^Añadir etiqueta$/ }).nth(2).click();
        await page.getByRole('textbox', { name: 'Etiquetas' }).fill('Do');

        const dockerTag = page.getByRole('button', { name: 'Docker' });
        if (await dockerTag.isVisible()) {
            await dockerTag.click();
        } else {
            await page.getByRole('button', { name: '+ Crear nueva etiqueta' }).click();
            await page.getByRole('textbox', { name: 'Nombre público' }).fill('Docker');
            await page.getByRole('textbox', { name: 'Ruta de la URL' }).fill('Docker');
            await page.getByRole('button', { name: 'Enviar' }).click();
        }
        await page.getByRole('button', { name: 'Publica tu pregunta' }).click();
        await expect(page.getByText('Title es un campo requerido.')).toBeVisible();
    });

    test('Intento de publicar pregunta sin tags', async ({ page }) => {
        await page.goto('/questions/add');

        await page.getByRole('textbox', { name: 'Título' }).fill('¿Como instalar docker en ubuntu?');

        const editor = page.locator('.cm-content');
        await editor.click();
        await page.keyboard.type('Necesito ayuda con el proceso de instalación');

        await page.getByRole('button', { name: 'Publica tu pregunta' }).click();
        await expect(page.getByText('Not enough tags were entered.')).toBeVisible();
    });

});
