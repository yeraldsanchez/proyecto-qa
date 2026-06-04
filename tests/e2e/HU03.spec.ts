import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';
const PASSWORD = 'Segura123';

async function closeModalIfVisible(page: Page) {
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
        const closeBtn = dialog.getByRole('button', {
            name: /cerrar|close|ok|está bien|aceptar|continuar|entendido/i,
        });
        if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
    }
}

async function agregarTagDocker(page: Page) {
    await page.locator('div').filter({ hasText: /^Añadir etiqueta$/ }).nth(2).click();
    await page.getByRole('textbox', { name: 'Etiquetas' }).fill('Do');

    // Esperar explícitamente a que el dropdown cargue antes de verificar opciones
    await page.getByRole('button', { name: /Docker|\+ Crear nueva etiqueta/ }).first()
        .waitFor({ state: 'visible', timeout: 5000 });

    if (await page.getByRole('button', { name: 'Docker' }).first().isVisible()) {
        await page.getByRole('button', { name: 'Docker' }).first().click();
    } else {
        await page.getByRole('button', { name: '+ Crear nueva etiqueta' }).click();
        await page.getByRole('textbox', { name: 'Nombre público' }).fill('Docker');
        await page.getByRole('textbox', { name: 'Ruta de la URL' }).fill('Docker');
        await page.getByRole('button', { name: 'Enviar' }).click();
        await page.waitForTimeout(1000);
    }
}

let testUuid: string;

test.describe('Publicación de una nueva pregunta', () => {

    test.beforeEach(async ({ page, request }) => {
        // Usuario temporal para evitar insignias acumuladas en el admin que bloqueen la UI
        testUuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const userEmail = `hu03_${testUuid}@test.com`;

        const adminLogin = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const adminToken = (await adminLogin.json()).data.access_token;

        await request.post('/answer/admin/api/user', {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { display_name: `HU03_${testUuid}`, email: userEmail, password: PASSWORD },
        });

        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(userEmail);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
        await page.waitForURL(url => !url.toString().includes('/users/login'), { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
        await closeModalIfVisible(page);
    });

    test('Publicación exitosa de pregunta con título, contenido y tag válidos', async ({ page }) => {
        await page.goto('/questions/add');
        await page.getByRole('textbox', { name: 'Título' }).fill(`¿Como instalar docker en ubuntu? ${testUuid}`);

        const editor = page.locator('.cm-content');
        await editor.click();
        await page.keyboard.type('Necesito ayuda con el proceso de instalación');

        await agregarTagDocker(page);

        await page.getByRole('button', { name: 'Publica tu pregunta' }).click();
        await page.waitForURL(/\/questions\//, { timeout: 15000 });
        await expect(page.getByRole('button', { name: 'Publica tu respuesta' })).toBeVisible();
    });

    test('Intento de publicar pregunta con título vacío', async ({ page }) => {
        await page.goto('/questions/add');

        const editor = page.locator('.cm-content');
        await editor.click();
        await page.keyboard.type('Necesito ayuda con el proceso de instalación');

        await agregarTagDocker(page);

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
