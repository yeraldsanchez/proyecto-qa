import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
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

async function loginIfNeeded(page: Page) {
    await page.goto('/users/login');

    const emailInput = page.getByRole('textbox', { name: 'Correo electrónico' });

    if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(ADMIN_EMAIL);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
        await page.waitForURL(url => !url.toString().includes('/users/login'), { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
    }

    await closeModalIfVisible(page);
}

async function openReportModal(page: Page) {
    await page.locator('a, button').filter({ hasText: /^Reportar$/i }).first().click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
}

test.describe('Reporte de contenido inapropiado', () => {
    let questionId: string;

    test.beforeAll(async ({ request }) => {
        // Obtener token de admin solo para crear el usuario autor
        const adminLogin = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const adminToken = (await adminLogin.json()).data.access_token;

        // Crear usuario autor temporal — admin no puede reportar su propio contenido
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const authorEmail = `hu11_author_${uuid}@test.com`;
        await request.post('/answer/admin/api/user', {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { display_name: `HU11_author_${uuid}`, email: authorEmail, password: PASSWORD },
        });

        const authorLogin = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: authorEmail, pass: PASSWORD },
        });
        const authorToken = (await authorLogin.json()).data.access_token;

        const q = await request.post('/answer/api/v1/question', {
            headers: { Authorization: `Bearer ${authorToken}` },
            data: {
                title: `Pregunta HU11 E2E ${uuid}`,
                content: 'Contenido suficiente para probar el reporte de contenido inapropiado.',
                tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
            },
        });
        questionId = (await q.json()).data.id;
    });

    test('Abrir formulario de reporte para una pregunta existente', async ({ page }) => {
        await loginIfNeeded(page);
        await page.goto(`/questions/${questionId}`);
        await page.waitForLoadState('networkidle');
        await closeModalIfVisible(page);

        await openReportModal(page);

        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('Reportar pregunta existente con motivo válido', async ({ page, request }) => {
        // Usuario temporal para evitar fallo por "ya reportado" en ejecuciones repetidas
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const tempEmail = `hu11_${uuid}@test.com`;

        const adminLogin = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const adminToken = (await adminLogin.json()).data.access_token;
        await request.post('/answer/admin/api/user', {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { display_name: `HU11_${uuid}`, email: tempEmail, password: PASSWORD },
        });

        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(tempEmail);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
        await page.waitForLoadState('networkidle');
        await closeModalIfVisible(page);

        await page.goto(`/questions/${questionId}`);
        await page.waitForLoadState('networkidle');
        await closeModalIfVisible(page);

        await openReportModal(page);
        await page.getByText('correo no deseado').click();
        await page.getByRole('button', { name: 'Enviar' }).click();

        await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('Intento de reportar contenido sin iniciar sesión', async ({ page }) => {
        await page.context().clearCookies();

        await page.goto(`/questions/${questionId}`);
        await page.waitForLoadState('networkidle');

        await expect(page.locator('a, button').filter({
            hasText: /^Reportar$/i,
        })).toHaveCount(0);
    });
});
